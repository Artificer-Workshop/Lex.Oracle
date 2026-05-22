import { test } from "node:test";
import assert from "node:assert/strict";

import { BLUEPRINTS } from "../src/blueprints/registry.js";
import { buildAttributionMandate } from "../src/attribution.js";

const SEMVER = /^\d+\.\d+\.\d+$/;

test("registry exposes 11 blueprints", () => {
  assert.equal(BLUEPRINTS.length, 11);
});

test("every blueprint id is unique", () => {
  const ids = BLUEPRINTS.map((bp) => bp.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const bp of BLUEPRINTS) {
  test(`${bp.id}: metadata well-formed`, () => {
    assert.ok(bp.title.length > 0);
    assert.match(bp.version, SEMVER);
    assert.ok(["SK", "CZ"].includes(bp.jurisdiction));
    assert.ok(["PLACEHOLDER", "DRAFT", "READY", "DEPRECATED"].includes(bp.status));
    assert.match(bp.last_reviewed, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(bp.summary.length >= 50);
  });

  test(`${bp.id}: ≥3 verification cases`, () => {
    assert.ok(
      bp.verification_cases.length >= 3,
      `expected ≥3 VC, got ${bp.verification_cases.length}`,
    );
  });

  test(`${bp.id}: every axiomatic constant has citation`, () => {
    for (const c of bp.axiomatic_core) {
      assert.ok(c.citation, `constant ${c.name} missing citation`);
      assert.ok(c.citation.act, `constant ${c.name} citation missing act`);
      assert.ok(c.citation.quote, `constant ${c.name} citation missing quote`);
    }
  });

  test(`${bp.id}: every logic step has citation`, () => {
    for (const step of bp.logic_flow) {
      assert.ok(step.citation, `step ${step.id} missing citation`);
      assert.ok(step.citation.act, `step ${step.id} citation missing act`);
      assert.ok(step.citation.quote, `step ${step.id} citation missing quote`);
    }
  });

  test(`${bp.id}: every verification case has expected_output and legal_reasoning`, () => {
    for (const vc of bp.verification_cases) {
      assert.ok(vc.id, "VC missing id");
      assert.ok(vc.expected_output, `${vc.id} missing expected_output`);
      assert.ok(vc.legal_reasoning && vc.legal_reasoning.length > 20, `${vc.id} legal_reasoning too short`);
    }
  });

  test(`${bp.id}: attribution mandate identifies owner and blueprint`, () => {
    const m = buildAttributionMandate(bp.id, bp.version);
    assert.match(m.required_text, /Artificer Workshop/);
    assert.match(m.required_text, /57 602 719/);
    assert.match(m.required_text, new RegExp(bp.id));
    assert.match(m.required_text, new RegExp(bp.version));
  });

  test(`${bp.id}: legal_acts cites known jurisdiction URLs`, () => {
    const SK_URL = /^https:\/\/www\.slov-lex\.sk\/pravne-predpisy\/SK\/ZZ\/\d{4}\/\d+\/?$/;
    const CZ_URL = /^https:\/\/www\.zakonyprolidi\.cz\/cs\/\d{4}-\d+$/;
    for (const la of bp.legal_acts) {
      assert.ok(la.act && la.act.length > 0);
      if (la.url) {
        const valid = SK_URL.test(la.url) || CZ_URL.test(la.url);
        assert.ok(valid, `${bp.id} legal_act URL not recognised: ${la.url}`);
      }
    }
  });
}
