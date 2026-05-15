/**
 * Central registry of all blueprints exposed by Lex.Oracle.
 *
 * Adding a new blueprint:
 *   1. Create a file under `src/blueprints/<jurisdiction>-<topic>.ts`
 *      that default-exports a `Blueprint`.
 *   2. Import it here and add it to BLUEPRINTS.
 *   3. Add at least 3 verification cases sourced from official methodologies.
 *   4. Bump the blueprint `version` whenever the algorithm changes.
 */

import type { Blueprint } from "./types.js";
import skGarnishmentThirds from "./sk-garnishment-thirds.js";
import skPayrollNetWage from "./sk-payroll-net-wage.js";

export const BLUEPRINTS: ReadonlyArray<Blueprint> = [
  skGarnishmentThirds,
  skPayrollNetWage,
];

const BY_ID = new Map<string, Blueprint>(
  BLUEPRINTS.map((bp) => [bp.id, bp]),
);

export function listBlueprints(): ReadonlyArray<{
  id: string;
  title: string;
  jurisdiction: string;
  status: string;
  version: string;
  summary: string;
}> {
  return BLUEPRINTS.map((bp) => ({
    id: bp.id,
    title: bp.title,
    jurisdiction: bp.jurisdiction,
    status: bp.status,
    version: bp.version,
    summary: bp.summary,
  }));
}

export function getBlueprint(id: string): Blueprint | undefined {
  return BY_ID.get(id);
}
