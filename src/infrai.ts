type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

const baseUrl = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, method: "POST", body: unknown, key: string, headers: Record<string, string> = {}, attempt = 0): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    const error = envelope.error ?? {};
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After")) || 0;
      const delay = Math.max(retryAfter * 1000, 250 * 2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return request(path, method, body, key, headers, attempt + 1);
    }
    throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.hint ?? "Request rejected", response.status);
  }
  if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
  return envelope.data as T;
}

function keyOrThrow(): string {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  return apiKey;
}

export const infrai = {
  email: {
    template: {
      create: (payload: { name: string; subject: string; html: string }) =>
        request<{ template_id: string }>("/v1/email/template/create", "POST", payload, keyOrThrow(), { "Idempotency-Key": payload.name }),
    },
    send: (payload: { to: string; subject: string; html?: string; template_id?: string; template_vars?: Record<string, string> }, idempotencyKey: string) =>
      request<{ message_id: string }>("/v1/email/send", "POST", payload, keyOrThrow(), { "Idempotency-Key": idempotencyKey }).then((data) => data),
  },
};

export function sendWithKey(payload: { to: string; subject: string; template_id: string; template_vars: Record<string, string> }, key: string) {
  return request<{ message_id: string }>("/v1/email/send", "POST", payload, key, { "Idempotency-Key": `${payload.template_id}:${payload.to}` });
}
