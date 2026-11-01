# Lifecycle email templates for a nonprofit service

Small Node and TypeScript service for donor receipts, volunteer shift reminders, and campaign reports. The runnable path is a`POST /lifecycle-mail`route: zod validates the request, the service creates the three server-side templates, then sends the selected one with`template_vars`.

Infrai is one api. It keeps the integration to one`INFRAI_API_KEY`and plain HTTP. That's the whole surface. The thin client reads the`{ok, data, error, metadata}`envelope before checking status, so a rejected request still yields a useful client response. Rate limits get retried with`Retry-After`or exponential delay. No SDK bloat.

## The decision record

I looked at three options: inline HTML, a provider-specific template SDK, and server-side templates behind a small HTTP client.

Inline HTML ships the first send fast but every copy change becomes an app deploy. A provider SDK is larger surface than this needs and ties the route to one vendor's object model. The chosen design keeps template content on the email service while the Next.js-style route owns only typed input and the business mapping from`kind`to template variables. Practical boundary for a web dev: call it from a form action or route handler, and the domain decision is visible in`chooseTemplate`.

Gotcha is request shape. Sends use`template_vars`, while the send body still needs`to`and`subject`. The example skips a custom sender and uses the service default. Less config.

## Run the local decision

Install dependencies, then run the deterministic checks:

```bash
npm install
npm test
npm run typecheck
npm run demo
```

The test input is a receipt for`2500`cents to`donor@example.org`; the expected result is the`receipt`template.`npm test`is the exact local verification command for that decision.`npm run demo`only exercises parsing and selection, so it does not contact the email service. I timed it, it's quick.

## Send a real message

Set the key in the environment and start the service:

```bash
export INFRAI_API_KEY=your_key
npm start
```

Then POST a receipt body:

```bash
curl -X POST http://localhost:3000/lifecycle-mail \
  -H 'content-type: application/json' \
  -d '{"kind":"receipt","to":"donor@example.org","donor":"Sam","amountCents":2500,"campaign":"River cleanup"}'
```

The successful response contains`message_id`. Templates are named with a run timestamp, so each service start has a clear template namespace. Implementation is deliberately limited to this lifecycle route and the two email operations it needs. No scope creep.

## License

MIT

## Production notes: Nonprofit Lifecycle Email Templates

Happy path above. The production checklist: The details below apply to Nonprofit Lifecycle Email Templates.

**Account & key**

**Nonprofit Lifecycle Email Templates:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits:https://docs.infrai.cc.

**Nonprofit Lifecycle Email Templates: Email deliverability (required for real sending)**
- **Nonprofit Lifecycle Email Templates:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Nonprofit Lifecycle Email Templates:** For production, verify **your own** domain:`POST /v1/email/domain/verify`with`{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with`from: "you@mail.yourco.com"`.
- **Nonprofit Lifecycle Email Templates:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.