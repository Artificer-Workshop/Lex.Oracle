#!/usr/bin/env node
/**
 * Lex.Oracle MCP server entry point.
 * TRANSPORT=stdio (default) — JSON-RPC 2.0 over stdin/stdout, for npx / Claude Desktop.
 * TRANSPORT=http            — Streamable HTTP on $PORT (default 3000) at /mcp, for Cloud Run / Smithery.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  if (process.env.TRANSPORT === "http") {
    const { startHttpServer } = await import("./http.js");
    const port = parseInt(process.env.PORT ?? "3000", 10);
    await startHttpServer(port);
    return;
  }

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
