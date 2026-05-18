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
import skTravelDomestic from "./sk-travel-domestic.js";
import skAnnualTaxReconciliation from "./sk-annual-tax-reconciliation.js";
import skSzcoAnnualSettlement from "./sk-szco-annual-settlement.js";
import skB2bDph from "./sk-b2b-dph.js";
import skB2bDppo from "./sk-b2b-dppo.js";
import skB2bOdpisy from "./sk-b2b-odpisy.js";
import skB2bRzZp from "./sk-b2b-rz-zp.js";
import skB2bZrazkovaDan from "./sk-b2b-zrazkova-dan.js";

export const BLUEPRINTS: ReadonlyArray<Blueprint> = [
  skGarnishmentThirds,
  skPayrollNetWage,
  skTravelDomestic,
  skAnnualTaxReconciliation,
  skSzcoAnnualSettlement,
  skB2bDph,
  skB2bDppo,
  skB2bOdpisy,
  skB2bRzZp,
  skB2bZrazkovaDan,
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
