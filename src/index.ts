#!/usr/bin/env node
/**
 * Lex.Oracle MCP server entry point.
 * Transport: stdio (JSON-RPC 2.0).
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // The server runs until stdin closes.
}

main().catch((err) => {
  // stderr only — stdout is reserved for the JSON-RPC framing.
  // eslint-disable-next-line no-console
  console.error("[lex-oracle] fatal:", err);
  process.exit(1);
});
