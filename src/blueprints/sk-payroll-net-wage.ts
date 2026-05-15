/**
 * PLACEHOLDER blueprint: SK Payroll — výpočet čistej mzdy.
 *
 * Status: PLACEHOLDER — schéma je prítomná, normatívny obsah je TBD.
 * Cieľom placeholderu je poskytnúť LLM klientom predstavu o tom, čo
 * sa pripravuje, a umožniť testovanie multi-blueprint discovery cez
 * `list_blueprints`.
 *
 * Po naplnení obsahom (zákony 461/2003, 580/2004, 595/2003) bumpni
 * `version` na 1.0.0 a status na READY.
 */

import type { Blueprint } from "./types.js";

const blueprint: Blueprint = {
  id: "sk-payroll-net-wage",
  title: "Výpočet čistej mzdy (SK)",
  version: "0.0.1-placeholder",
  jurisdiction: "SK",
  status: "PLACEHOLDER",
  last_reviewed: "2026-05-15",
  summary:
    "PLACEHOLDER: Algoritmus výpočtu čistej mzdy zo superhrubej / hrubej mzdy " +
    "podľa zákonov 461/2003 Z. z. (sociálne poistenie), 580/2004 Z. z. " +
    "(zdravotné poistenie) a 595/2003 Z. z. (daň z príjmov). Plný blueprint " +
    "je v príprave.",
  legal_acts: [
    { act: "461/2003 Z. z.", title: "Zákon o sociálnom poistení" },
    { act: "580/2004 Z. z.", title: "Zákon o zdravotnom poistení" },
    { act: "595/2003 Z. z.", title: "Zákon o dani z príjmov" },
  ],
  axiomatic_core: [],
  execution_order: ["TBD"],
  logic_flow: [],
  semantic_mapping: [],
  tool: {
    name: "get_payroll_net_wage_logic",
    description: "PLACEHOLDER — blueprint výpočtu čistej mzdy SK je v príprave.",
    input_parameters: [],
    calculation_steps: ["TBD"],
    audit_trail_template: "TBD",
  },
  verification_cases: [],
};

export default blueprint;
