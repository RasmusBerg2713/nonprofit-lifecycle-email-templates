import { chooseTemplate, lifecycleRequest } from "./lifecycle.ts";

const input = lifecycleRequest.parse({ kind: "receipt", to: "donor@example.org", donor: "Sam", amountCents: 2500, campaign: "River cleanup" });
console.log({ selectedTemplate: chooseTemplate(input), input });
