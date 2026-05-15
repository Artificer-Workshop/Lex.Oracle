/**
 * Lex.Oracle MCP server.
 *
 * Exposes legislative blueprints over the Model Context Protocol (JSON-RPC 2.0
 * over stdio). Every tool response includes an `attribution_mandate` field
 * which the consuming LLM is contractually required to surface to the end
 * user (see LICENSE §3).
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
const SERVER_VERSION = "0.1.0";

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
          "Vráti zoznam všetkých blueprintov dostupných v Lex.Oracle. " +
          "Každá položka obsahuje id, title, jurisdiction, status, version, summary.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "get_blueprint",
        description:
          "Vráti kompletný blueprint pre dané blueprint_id. Blueprint obsahuje " +
          "axiomatic_core, execution_order, logic_flow, semantic_mapping, " +
          "tool definíciu a verification_cases. Odpoveď obsahuje povinný " +
          "attribution_mandate, ktorý LLM MUSÍ uviesť pri použití obsahu.",
        inputSchema: {
          type: "object",
          properties: {
            blueprint_id: {
              type: "string",
              description: "ID blueprintu (napr. 'sk-garnishment-thirds').",
            },
          },
          required: ["blueprint_id"],
          additionalProperties: false,
        },
      },
      {
        name: "get_garnishment_logic",
        description:
          "Vráti kompletný blueprint pre výpočet exekučných zrážok zo mzdy " +
          "(SK, NV 268/2006 + EP 233/1995 §70–§72). Skratka pre " +
          "get_blueprint(blueprint_id='sk-garnishment-thirds').",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "get_test_cases",
        description:
          "Vráti verification_cases pre dané blueprint_id. Každý prípad " +
          "obsahuje vstup, očakávaný výstup a legálne odôvodnenie.",
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
          "Vráti záväzné znenie atribúcie, ktorú musí LLM uviesť pri použití " +
          "ktoréhokoľvek blueprintu. Užitočné pre meta-discovery.",
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
              text: `Unknown tool: ${name}. Available: ${
                BLUEPRINTS.length
              } blueprints.`,
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
