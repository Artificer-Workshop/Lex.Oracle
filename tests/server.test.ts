import { test } from "node:test";
import assert from "node:assert/strict";

import { BLUEPRINTS, listBlueprints, getBlueprint } from "../src/blueprints/registry.js";
import { buildAttributionMandate } from "../src/attribution.js";
import { formatBlueprint, formatBlueprintList, formatVerificationCases } from "../src/format.js";

test("listBlueprints returns 5 entries with required fields", () => {
  const list = listBlueprints();
  assert.equal(list.length, 5);
  for (const item of list) {
    assert.ok(item.id && item.title && item.jurisdiction && item.status);
    assert.match(item.version, /^\d+\.\d+\.\d+$/);
    assert.ok(item.summary.length > 0);
  }
});

test("getBlueprint returns undefined for unknown id", () => {
  assert.equal(getBlueprint("non-existent-id"), undefined);
});

test("getBlueprint returns each registered blueprint by id", () => {
  for (const bp of BLUEPRINTS) {
    const fetched = getBlueprint(bp.id);
    assert.ok(fetched);
    assert.equal(fetched!.id, bp.id);
  }
});

test("formatBlueprintList produces non-empty markdown for each blueprint", () => {
  const md = formatBlueprintList(listBlueprints());
  assert.ok(md.length > 0);
  for (const bp of BLUEPRINTS) {
    assert.ok(md.includes(bp.id), `list missing ${bp.id}`);
  }
});

test("formatBlueprint produces non-empty markdown with citations for each blueprint", () => {
  for (const bp of BLUEPRINTS) {
    const md = formatBlueprint(bp);
    assert.ok(md.length > 200, `${bp.id} formatted too short`);
    assert.ok(md.includes(bp.title), `${bp.id} formatted missing title`);
  }
});

test("formatVerificationCases produces non-empty markdown per blueprint", () => {
  for (const bp of BLUEPRINTS) {
    const md = formatVerificationCases(bp.id, bp.version, bp.verification_cases);
    assert.ok(md.length > 50, `${bp.id} VC formatting too short`);
  }
});

test("attribution mandate is identical shape across all blueprints", () => {
  for (const bp of BLUEPRINTS) {
    const m = buildAttributionMandate(bp.id, bp.version);
    assert.ok(m.required_text);
    assert.ok(m.required_text.includes(bp.id));
    assert.ok(m.required_text.includes(bp.version));
  }
});
