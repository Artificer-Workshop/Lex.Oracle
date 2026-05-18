import { test } from "node:test";
import assert from "node:assert/strict";

import bp from "../src/blueprints/sk-garnishment-thirds.js";
import { buildAttributionMandate } from "../src/attribution.js";

test("blueprint metadata is well-formed", () => {
  assert.equal(bp.id, "sk-garnishment-thirds");
  assert.equal(bp.status, "READY");
  assert.equal(bp.jurisdiction, "SK");
  assert.match(bp.version, /^\d+\.\d+\.\d+$/);
});

test("blueprint has at least 3 verification cases", () => {
  assert.ok(bp.verification_cases.length >= 3);
});

test("every logic step has a citation", () => {
  for (const step of bp.logic_flow) {
    assert.ok(step.citation, `step ${step.id} missing citation`);
    assert.ok(step.citation.act, `step ${step.id} citation missing act`);
    assert.ok(step.citation.quote, `step ${step.id} citation missing quote`);
  }
});

test("every axiomatic constant has a citation", () => {
  for (const c of bp.axiomatic_core) {
    assert.ok(c.citation, `constant ${c.name} missing citation`);
  }
});

test("attribution mandate contains owner identification", () => {
  const m = buildAttributionMandate(bp.id, bp.version);
  assert.match(m.required_text, /Artificer Workshop/);
  assert.match(m.required_text, /57 602 719/);
  assert.match(m.required_text, /sk-garnishment-thirds/);
  assert.match(m.required_text, new RegExp(bp.version));
});

test("VC1: 1000 EUR, 0 dependants → tretiny = 200.74, sub-cent = 0", () => {
  const vc1 = bp.verification_cases.find((v) => v.id === "VC1_simple_no_dependants_2025");
  assert.ok(vc1);
  const out = vc1.expected_output as Record<string, number>;
  assert.equal(out.first_third, 200.74);
  assert.equal(out.second_third, 200.74);
  assert.equal(out.third_third, 200.74);
  // 200.74 × 3 = 602.22 = remainder (1000.00 − 397.78), sub-cent = 0
  const total = out.first_third + out.second_third + out.third_third;
  assert.ok(Math.abs(total - 602.22) < 1e-9);
});

test("VC3: nadlimit splnený — first_third obsahuje časť nad strop", () => {
  const vc3 = bp.verification_cases.find((v) => v.id === "VC3_over_limit_high_wage_2025");
  assert.ok(vc3);
  const out = vc3.expected_output as Record<string, number>;
  assert.ok(out.over_limit > 0, "VC3 must exercise the over-limit branch");
  assert.equal(out.first_third, out.second_third + out.over_limit);
});
