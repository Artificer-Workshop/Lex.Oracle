import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

const VERSION = "0.5.0";

export async function startHttpServer(port: number): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Each MCP request gets its own stateless transport + server pair.
  // Lex.Oracle is fully stateless (all blueprints are static compiled data),
  // so no session management is needed.
  app.post("/mcp", async (req: Request, res: Response): Promise<void> => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    const server = createServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    await server.close();
  });

  app.get("/mcp", (_req: Request, res: Response): void => {
    res.status(405).json({ error: "method_not_allowed", hint: "Use POST /mcp" });
  });

  app.delete("/mcp", (_req: Request, res: Response): void => {
    res.status(200).json({ ok: true });
  });

  app.get("/health", (_req: Request, res: Response): void => {
    res.json({ status: "ok", service: "lex-oracle", version: VERSION });
  });

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.error(`[lex-oracle] HTTP transport :${port}/mcp`);
      resolve();
    });
  });
}
