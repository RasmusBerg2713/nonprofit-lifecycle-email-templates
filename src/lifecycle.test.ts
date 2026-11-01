import test from "node:test";
import assert from "node:assert/strict";
import { chooseTemplate, lifecycleRequest } from "./lifecycle.ts";

test("a donation receipt selects the receipt template", () => {
  const input = lifecycleRequest.parse({ kind: "receipt", to: "donor@example.org", donor: "Sam", amountCents: 2500, campaign: "River cleanup" });
  assert.equal(chooseTemplate(input), "receipt");
});

test("request boundary rejects a missing campaign", () => {
  assert.throws(() => lifecycleRequest.parse({ kind: "receipt", to: "donor@example.org", donor: "Sam", amountCents: 2500 }));
});
