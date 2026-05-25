/**
 * Lex.Oracle MCP server.
 *
 * Exposes legislative blueprints over the Model Context Protocol (JSON-RPC 2.0).
 * Every tool response includes an `attribution_mandate` field which the consuming
 * LLM should surface to the end user (see NOTICE).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { buildAttributionMandate } from "./attribution.js";
import {
  BLUEPRINTS,
  getBlueprint,
  listBlueprints,
} from "./blueprints/registry.js";
import {
  formatBlueprint,
  formatBlueprintList,
  formatVerificationCases,
} from "./format.js";

const SERVER_NAME = "lex-oracle";
const SERVER_VERSION = "0.5.0";

// ---------------------------------------------------------------------------
// Shared schema + annotation constants
// ---------------------------------------------------------------------------

const READ_ONLY = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

const BLUEPRINT_OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    blueprint: {
      type: "object" as const,
      description:
        "Complete blueprint: axiomatic_core (rate constants + citations), " +
        "execution_order (numbered steps), logic_flow (pseudocode + edge cases), " +
        "semantic_mapping (step → legal citation), verification_cases, legal_acts.",
    },
    presentation: {
      type: "string" as const,
      description: "Markdown-formatted blueprint ready for LLM consumption.",
    },
    attribution_mandate: {
      type: "string" as const,
      description: "Required Apache 2.0 attribution text to surface to end users.",
    },
  },
  required: ["blueprint", "presentation", "attribution_mandate"],
};

const BLUEPRINT_ID_PARAM = {
  type: "string" as const,
  description:
    "Blueprint identifier, e.g. 'sk-garnishment-thirds', " +
    "'sk-payroll-net-wage', 'sk-travel-domestic'.",
};

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

export function createServer(): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      // ── list_blueprints ────────────────────────────────────────────────
      {
        name: "list_blueprints",
        title: "List Blueprints",
        description:
          "List all blueprints available in Lex.Oracle. " +
          "Each entry contains: id, title, jurisdiction, status, version, summary.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        outputSchema: {
          type: "object" as const,
          properties: {
            blueprints: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  id: { type: "string" as const },
                  title: { type: "string" as const },
                  jurisdiction: { type: "string" as const },
                  status: { type: "string" as const },
                  version: { type: "string" as const },
                  summary: { type: "string" as const },
                },
                required: ["id", "title", "jurisdiction", "status", "version", "summary"],
              },
            },
            presentation: {
              type: "string" as const,
              description: "Markdown-formatted blueprint list.",
            },
          },
          required: ["blueprints", "presentation"],
        },
        annotations: READ_ONLY,
      },

      // ── get_blueprint ──────────────────────────────────────────────────
      {
        name: "get_blueprint",
        title: "Get Blueprint",
        description:
          "Retrieve a complete legislative blueprint by blueprint_id. " +
          "The blueprint contains: axiomatic_core (rate constants with effective dates), " +
          "execution_order (numbered steps), logic_flow (pseudocode + edge cases per step), " +
          "semantic_mapping (each step → exact legal citation), and verification_cases " +
          "(test cases from official government methodologies). " +
          "The response includes a human-readable 'presentation' field and an attribution_mandate.",
        inputSchema: {
          type: "object",
          properties: {
            blueprint_id: BLUEPRINT_ID_PARAM,
          },
          required: ["blueprint_id"],
          additionalProperties: false,
        },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_garnishment_logic ──────────────────────────────────────────
      {
        name: "get_garnishment_logic",
        title: "Slovak Salary Garnishment",
        description:
          "Retrieve the complete blueprint for Slovak salary garnishment — " +
          "the thirds system (NV 268/2006 + Execution Code 233/1995 §70–§72). " +
          "Covers: non-deductible base, dependant increments, thirds split, " +
          "over-limit portion, and distribution across multiple executions. " +
          "Shortcut for get_blueprint(blueprint_id='sk-garnishment-thirds').",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_travel_logic ───────────────────────────────────────────────
      {
        name: "get_travel_logic",
        title: "Slovak Domestic Travel Allowances",
        description:
          "Retrieve the complete blueprint for Slovak domestic travel allowances — " +
          "Act 283/2002 (meal allowances §5, vehicle km reimbursement §7, " +
          "accommodation passthrough §8, miscellaneous passthrough §9). " +
          "Covers: time-band stravné selection, km rate, meal deduction edge case " +
          "(deductions use the 18+ h rate, NOT the actual band rate), and total claim assembly. " +
          "Shortcut for get_blueprint(blueprint_id='sk-travel-domestic').",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_annual_tax_reconciliation_logic ────────────────────────────
      {
        name: "get_annual_tax_reconciliation_logic",
        title: "Slovak Annual Tax Reconciliation",
        description:
          "Retrieve the complete blueprint for Slovak annual tax reconciliation — " +
          "§38 Zákon 595/2003 Z.z. (ročné zúčtovanie preddavkov na daň zo závislej činnosti). " +
          "Covers: 12-month aggregation, NČZD na daňovníka (§11 ods. 2), NČZD na manžela (§11 ods. 3), " +
          "DDS/PEPP (§11 ods. 8, max 180 EUR), annual tax §15, child bonus §33, settlement vs advances (§38 ods. 6). " +
          "Shortcut for get_blueprint(blueprint_id='sk-annual-tax-reconciliation').",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_szco_annual_settlement_logic ───────────────────────────────
      {
        name: "get_szco_annual_settlement_logic",
        title: "Slovak SZČO Annual Insurance Settlement",
        description:
          "Retrieve the complete blueprint for Slovak SZČO annual insurance settlement — " +
          "461/2003 Z.z. §138 ods. 2 (SP) + 580/2004 Z.z. §13 ods. 2 + §19 (ZP). " +
          "Covers: VZ = (ZD + paid SP + paid ZP) / 1.486 / divisor, SP rates 33.15% " +
          "(nemocenské 4.4% + starobné 18% + invalidné 6% + rezervný fond 4.75%), " +
          "ZP rate temporal (14% to 2025 / 16% 2026–2027 §38ezk / 15% from 2028), " +
          "min/max VZ clamping, partial-year handling (SP always /12, ZP /months). " +
          "Shortcut for get_blueprint(blueprint_id='sk-szco-annual-settlement').",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_b2b_dph_logic ──────────────────────────────────────────────
      {
        name: "get_b2b_dph_logic",
        title: "Slovak VAT (DPH)",
        description:
          "Retrieve the complete blueprint for Slovak VAT (DPH) — Zákon 222/2004 Z. z. " +
          "Covers: §27 sadzby (zákl. 23 %, stredná 19 %, znížená 5 %, nulová 0 % od 2025-01-01), " +
          "daň na výstupe §19, odpočet §49 (plný/krátený), koeficient §50 (ceiling 2dp), " +
          "reverse-charge §69, EU intra-community §43/§11. " +
          "Shortcut for get_blueprint(blueprint_id='sk-b2b-dph').",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_b2b_dppo_logic ─────────────────────────────────────────────
      {
        name: "get_b2b_dppo_logic",
        title: "Slovak Corporate Income Tax (DPPO)",
        description:
          "Retrieve the complete blueprint for Slovak corporate income tax (DPPO) — " +
          "Zákon 595/2003 Z. z. §15 v znení od 2025-01-01 (novela 278/2024). " +
          "Covers: 3 sadzby (mikro 10 % ≤ 60 000 EUR / štandard 21 % / veľká 24 % > 5 mil. EUR), " +
          "základ dane §17, umorenie straty §30 (max 50 % ZD, 5 rokov), preddavky §42. " +
          "Shortcut for get_blueprint(blueprint_id='sk-b2b-dppo').",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_b2b_odpisy_logic ───────────────────────────────────────────
      {
        name: "get_b2b_odpisy_logic",
        title: "Slovak Tax Depreciation",
        description:
          "Retrieve the complete blueprint for Slovak tax depreciation — " +
          "Zákon 595/2003 Z. z. §22-§28. Covers: 7 odpisových skupín (2/4/6/8/12/20/40 rokov), " +
          "rovnomerné §27 s pomerom v 1. roku ((13−mesiac)/12), zrýchlené §28 iba sk. 2 a 3 " +
          "(koeficienty 6/7 a 8/9), nehmotný majetok §22 ods. 8 (max 5 rokov lineárne). " +
          "Shortcut for get_blueprint(blueprint_id='sk-b2b-odpisy').",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_b2b_rz_zp_logic ────────────────────────────────────────────
      {
        name: "get_b2b_rz_zp_logic",
        title: "Slovak Annual Health Insurance Settlement (RZ ZP)",
        description:
          "Retrieve the complete blueprint for Slovak annual health-insurance settlement (RZ ZP) — " +
          "Zákon 580/2004 Z. z. §19. Covers: agregácia VZ (zamestnanec, SZČO, dividendy, iné), " +
          "temporal sadzba SZČO (14 % do 2025 / 16 % v 2026–2027 §38ezk prechodné / 15 % od 2028), " +
          "dividendy §10b 14 % nemenné, ZŤP koef. 0.5, rozdiel preplatok/nedoplatok, hranica 1 EUR §19 ods. 6. " +
          "Shortcut for get_blueprint(blueprint_id='sk-b2b-rz-zp').",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_b2b_zrazkova_dan_logic ─────────────────────────────────────
      {
        name: "get_b2b_zrazkova_dan_logic",
        title: "Slovak Withholding Tax",
        description:
          "Retrieve the complete blueprint for Slovak withholding tax — Zákon 595/2003 Z. z. §43. " +
          "Covers: štandard 19 % (úroky, licenčné, dividendy PO), dividendy FO 7 % od 2017, " +
          "override 35 % pre nespolupracujúce štáty §43 ods. 2, splatnosť 15. deň nasl. mesiaca §43 ods. 11. " +
          "Shortcut for get_blueprint(blueprint_id='sk-b2b-zrazkova-dan').",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_cz_payroll_logic ───────────────────────────────────────────
      {
        name: "get_cz_payroll_logic",
        title: "Czech Net Wage Calculation",
        description:
          "Retrieve the complete blueprint for Czech net wage calculation — " +
          "Zákon 589/1992 Sb. (SP 7.1% = 6.5% důchodové + 0.6% nemocenské od 2024-01-01) + " +
          "Zákon 592/1992 Sb. (ZP 4.5%, min. základ = minimální mzda) + " +
          "Zákon 586/1992 Sb. (záloha na daň 15%/23%, sleva na poplatníka 2 570 CZK/měsíc, " +
          "superhrubá zrušena od 2021-01-01, všechny složky ceiling na celé CZK). " +
          "4 verifikační případy: standard 30 000 / min. mzda / vyšší příjem / bez prohlášení. " +
          "Shortcut for get_blueprint(blueprint_id='cz-payroll-net-wage').",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        outputSchema: BLUEPRINT_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },

      // ── get_test_cases ─────────────────────────────────────────────────
      {
        name: "get_test_cases",
        title: "Get Verification Test Cases",
        description:
          "Retrieve verification_cases for a given blueprint_id. " +
          "Each case contains: input, expected_output, and legal_reasoning. " +
          "Useful for test-driven implementation or spot-checking a completed implementation.",
        inputSchema: {
          type: "object",
          properties: {
            blueprint_id: {
              type: "string",
              description:
                "Blueprint identifier to retrieve test cases for, " +
                "e.g. 'sk-garnishment-thirds', 'sk-payroll-net-wage'.",
            },
          },
          required: ["blueprint_id"],
          additionalProperties: false,
        },
        outputSchema: {
          type: "object" as const,
          properties: {
            blueprint_id: { type: "string" as const },
            version: { type: "string" as const },
            verification_cases: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  input: { type: "object" as const, description: "Test input values." },
                  expected_output: { type: "object" as const, description: "Expected computation result." },
                  legal_reasoning: { type: "string" as const, description: "Citation-backed rationale." },
                },
                required: ["input", "expected_output", "legal_reasoning"],
              },
            },
            presentation: { type: "string" as const },
            attribution_mandate: { type: "string" as const },
          },
          required: ["blueprint_id", "version", "verification_cases", "presentation", "attribution_mandate"],
        },
        annotations: READ_ONLY,
      },

      // ── get_attribution_mandate ────────────────────────────────────────
      {
        name: "get_attribution_mandate",
        title: "Get Attribution Mandate",
        description:
          "Retrieve the required attribution text for a given blueprint_id. " +
          "When blueprint content is used to generate code or an answer for an end user, " +
          "the LLM should include this text in human-readable form in the output.",
        inputSchema: {
          type: "object",
          properties: {
            blueprint_id: {
              type: "string",
              description:
                "Blueprint identifier to retrieve attribution text for, " +
                "e.g. 'sk-garnishment-thirds', 'sk-payroll-net-wage'.",
            },
          },
          required: ["blueprint_id"],
          additionalProperties: false,
        },
        outputSchema: {
          type: "object" as const,
          properties: {
            attribution_mandate: {
              type: "string" as const,
              description: "Required Apache 2.0 attribution text to surface to end users.",
            },
          },
          required: ["attribution_mandate"],
        },
        annotations: READ_ONLY,
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "list_blueprints": {
        const bps = listBlueprints();
        return ok({
          blueprints: bps,
          presentation: formatBlueprintList(bps),
        });
      }

      case "get_blueprint": {
        const parsed = z
          .object({ blueprint_id: z.string() })
          .parse(args ?? {});
        const bp = getBlueprint(parsed.blueprint_id);
        if (!bp) return notFound(parsed.blueprint_id);
        return ok({
          blueprint: bp,
          presentation: formatBlueprint(bp),
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_garnishment_logic": {
        const bp = getBlueprint("sk-garnishment-thirds");
        if (!bp) return notFound("sk-garnishment-thirds");
        return ok({
          blueprint: bp,
          presentation: formatBlueprint(bp),
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_travel_logic": {
        const bp = getBlueprint("sk-travel-domestic");
        if (!bp) return notFound("sk-travel-domestic");
        return ok({
          blueprint: bp,
          presentation: formatBlueprint(bp),
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_annual_tax_reconciliation_logic": {
        const bp = getBlueprint("sk-annual-tax-reconciliation");
        if (!bp) return notFound("sk-annual-tax-reconciliation");
        return ok({
          blueprint: bp,
          presentation: formatBlueprint(bp),
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_szco_annual_settlement_logic": {
        const bp = getBlueprint("sk-szco-annual-settlement");
        if (!bp) return notFound("sk-szco-annual-settlement");
        return ok({
          blueprint: bp,
          presentation: formatBlueprint(bp),
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_b2b_dph_logic": {
        const bp = getBlueprint("sk-b2b-dph");
        if (!bp) return notFound("sk-b2b-dph");
        return ok({ blueprint: bp, presentation: formatBlueprint(bp), attribution_mandate: buildAttributionMandate(bp.id, bp.version) });
      }

      case "get_b2b_dppo_logic": {
        const bp = getBlueprint("sk-b2b-dppo");
        if (!bp) return notFound("sk-b2b-dppo");
        return ok({ blueprint: bp, presentation: formatBlueprint(bp), attribution_mandate: buildAttributionMandate(bp.id, bp.version) });
      }

      case "get_b2b_odpisy_logic": {
        const bp = getBlueprint("sk-b2b-odpisy");
        if (!bp) return notFound("sk-b2b-odpisy");
        return ok({ blueprint: bp, presentation: formatBlueprint(bp), attribution_mandate: buildAttributionMandate(bp.id, bp.version) });
      }

      case "get_b2b_rz_zp_logic": {
        const bp = getBlueprint("sk-b2b-rz-zp");
        if (!bp) return notFound("sk-b2b-rz-zp");
        return ok({ blueprint: bp, presentation: formatBlueprint(bp), attribution_mandate: buildAttributionMandate(bp.id, bp.version) });
      }

      case "get_b2b_zrazkova_dan_logic": {
        const bp = getBlueprint("sk-b2b-zrazkova-dan");
        if (!bp) return notFound("sk-b2b-zrazkova-dan");
        return ok({ blueprint: bp, presentation: formatBlueprint(bp), attribution_mandate: buildAttributionMandate(bp.id, bp.version) });
      }

      case "get_cz_payroll_logic": {
        const bp = getBlueprint("cz-payroll-net-wage");
        if (!bp) return notFound("cz-payroll-net-wage");
        return ok({ blueprint: bp, presentation: formatBlueprint(bp), attribution_mandate: buildAttributionMandate(bp.id, bp.version) });
      }

      case "get_test_cases": {
        const parsed = z
          .object({ blueprint_id: z.string() })
          .parse(args ?? {});
        const bp = getBlueprint(parsed.blueprint_id);
        if (!bp) return notFound(parsed.blueprint_id);
        return ok({
          blueprint_id: bp.id,
          version: bp.version,
          verification_cases: bp.verification_cases,
          presentation: formatVerificationCases(bp.id, bp.version, bp.verification_cases),
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_attribution_mandate": {
        const parsed = z
          .object({ blueprint_id: z.string() })
          .parse(args ?? {});
        const bp = getBlueprint(parsed.blueprint_id);
        if (!bp) return notFound(parsed.blueprint_id);
        return ok({
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      default:
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${name}. Available tools: list_blueprints, get_blueprint, get_garnishment_logic, get_travel_logic, get_annual_tax_reconciliation_logic, get_szco_annual_settlement_logic, get_b2b_dph_logic, get_b2b_dppo_logic, get_b2b_odpisy_logic, get_b2b_rz_zp_logic, get_b2b_zrazkova_dan_logic, get_cz_payroll_logic, get_test_cases, get_attribution_mandate.`,
            },
          ],
        };
    }
  });

  return server;
}

function ok(payload: Record<string, unknown>) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  };
}

function notFound(blueprintId: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            error: "blueprint_not_found",
            blueprint_id: blueprintId,
            available: BLUEPRINTS.map((b) => b.id),
          },
          null,
          2,
        ),
      },
    ],
  };
}
