import { z } from "zod";
import { infrai, sendWithKey } from "./infrai.ts";

export const lifecycleRequest = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("receipt"), to: z.string().email(), donor: z.string().min(1), amountCents: z.number().int().positive(), campaign: z.string().min(1) }),
  z.object({ kind: z.literal("reminder"), to: z.string().email(), volunteer: z.string().min(1), shift: z.string().min(1) }),
  z.object({ kind: z.literal("report"), to: z.string().email(), campaign: z.string().min(1), totalCents: z.number().int().nonnegative() }),
]);

export type LifecycleRequest = z.infer<typeof lifecycleRequest>;
export type TemplateIds = Record<LifecycleRequest["kind"], string>;

const templateBodies = {
  receipt: { subject: "Your donation receipt", html: "<h1>Thank you, {{donor}}</h1><p>Donation: {{amountCents}} cents for {{campaign}}.</p>" },
  reminder: { subject: "Volunteer shift reminder", html: "<h1>Thanks, {{volunteer}}</h1><p>Your shift is {{shift}}.</p>" },
  report: { subject: "Campaign report", html: "<h1>{{campaign}}</h1><p>Total raised: {{totalCents}} cents.</p>" },
};

export function chooseTemplate(input: LifecycleRequest): LifecycleRequest["kind"] {
  return input.kind;
}

export async function createTemplates(runId: string): Promise<TemplateIds> {
  const entries = await Promise.all(Object.entries(templateBodies).map(async ([kind, body]) => {
    const result = await infrai.email.template.create({ ...body, name: `nonprofit-${kind}-${runId}` });
    return [kind, result.template_id] as const;
  }));
  return Object.fromEntries(entries) as TemplateIds;
}

export async function sendLifecycle(input: LifecycleRequest, ids: TemplateIds, key = process.env.INFRAI_API_KEY): Promise<string> {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const templateVars = Object.fromEntries(Object.entries(input).filter(([name]) => name !== "kind" && name !== "to")) as Record<string, string>;
  const result = await sendWithKey({ to: input.to, subject: templateBodies[input.kind].subject, template_id: ids[chooseTemplate(input)], template_vars: templateVars }, key);
  return result.message_id;
}
