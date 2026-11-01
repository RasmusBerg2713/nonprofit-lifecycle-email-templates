import { createServer } from "node:http";
import { lifecycleRequest, createTemplates, sendLifecycle } from "./lifecycle.ts";

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/lifecycle-mail") {
    response.writeHead(404).end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  try {
    const input = lifecycleRequest.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const ids = await createTemplates(new Date().toISOString().replace(/\D/g, "").slice(0, 14));
    const message_id = await sendLifecycle(input, ids);
    response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ message_id }));
  } catch (error) {
    const status = error instanceof Error && error.name === "ZodError" ? 400 : 502;
    response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Request rejected" }));
  }
});

server.listen(3000, () => console.log("POST http://localhost:3000/lifecycle-mail"));
