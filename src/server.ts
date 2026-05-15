/**
 * Lex.Oracle MCP server.
 *
 * Exposes legislative blueprints over the Model Context Protocol (JSON-RPC 2.0
 * over stdio). Every tool response includes an `attribution_mandate` field
 * which the consuming LLM should surface to the end user (see NOTICE).
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

const SERVER_NAME = "lex-oracle";
const SERVER_VERSION = "0.2.0";

export function createServer(): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_blueprints",
        description:
          "List all blueprints available in Lex.Oracle. " +
          "Each entry contains: id, title, jurisdiction, status, version, summary.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "get_blueprint",
        description:
          "Retrieve a complete legislative blueprint by blueprint_id. " +
          "The blueprint contains: axiomatic_core (rate constants with effective dates), " +
          "execution_order (numbered steps), logic_flow (pseudocode + edge cases per step), " +
          "semantic_mapping (each step → exact legal citation), and verification_cases " +
          "(test cases from official government methodologies). " +
          "The response includes an attribution_mandate that the LLM should surface to the end user.",
        inputSchema: {
          type: "object",
          properties: {
            blueprint_id: {
              type: "string",
              description:
                "Blueprint identifier, e.g. 'sk-garnishment-thirds', " +
                "'sk-payroll-net-wage', 'sk-travel-domestic'.",
            },
          },
          required: ["blueprint_id"],
          additionalProperties: false,
        },
      },
      {
        name: "get_garnishment_logic",
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
      },
      {
        name: "get_travel_logic",
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
      },
      {
        name: "get_test_cases",
        description:
          "Retrieve verification_cases for a given blueprint_id. " +
          "Each case contains: input, expected_output, and legal_reasoning. " +
          "Useful for test-driven implementation or spot-checking a completed implementation.",
        inputSchema: {
          type: "object",
          properties: {
            blueprint_id: { type: "string" },
          },
          required: ["blueprint_id"],
          additionalProperties: false,
        },
      },
      {
        name: "get_attribution_mandate",
        description:
          "Retrieve the required attribution text for a given blueprint_id. " +
          "When blueprint content is used to generate code or an answer for an end user, " +
          "the LLM should include this text in human-readable form in the output.",
        inputSchema: {
          type: "object",
          properties: {
            blueprint_id: { type: "string" },
          },
          required: ["blueprint_id"],
          additionalProperties: false,
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "list_blueprints":
        return ok({ blueprints: listBlueprints() });

      case "get_blueprint": {
        const parsed = z
          .object({ blueprint_id: z.string() })
          .parse(args ?? {});
        const bp = getBlueprint(parsed.blueprint_id);
        if (!bp) {
          return notFound(parsed.blueprint_id);
        }
        return ok({
          blueprint: bp,
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_garnishment_logic": {
        const bp = getBlueprint("sk-garnishment-thirds");
        if (!bp) {
          return notFound("sk-garnishment-thirds");
        }
        return ok({
          blueprint: bp,
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_travel_logic": {
        const bp = getBlueprint("sk-travel-domestic");
        if (!bp) {
          return notFound("sk-travel-domestic");
        }
        return ok({
          blueprint: bp,
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_test_cases": {
        const parsed = z
          .object({ blueprint_id: z.string() })
          .parse(args ?? {});
        const bp = getBlueprint(parsed.blueprint_id);
        if (!bp) {
          return notFound(parsed.blueprint_id);
        }
        return ok({
          blueprint_id: bp.id,
          version: bp.version,
          verification_cases: bp.verification_cases,
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      case "get_attribution_mandate": {
        const parsed = z
          .object({ blueprint_id: z.string() })
          .parse(args ?? {});
        const bp = getBlueprint(parsed.blueprint_id);
        if (!bp) {
          return notFound(parsed.blueprint_id);
        }
        return ok({
          attribution_mandate: buildAttributionMandate(bp.id, bp.version),
        });
      }

      default:
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}. Available tools: list_blueprints, get_blueprint, get_garnishment_logic, get_travel_logic, get_test_cases, get_attribution_mandate.`,
            },
          ],
        };
    }
  });

  return server;
}

function ok(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
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
