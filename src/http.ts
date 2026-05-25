import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { renderLanding } from "./landing.js";

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

  app.get("/robots.txt", (_req: Request, res: Response): void => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send([
      "User-agent: *",
      "Allow: /",
      "",
      "# MCP endpoint — allow LLM agent crawlers",
      "User-agent: SmitheryBot/1.0",
      "Allow: /mcp",
      "",
      "User-agent: ClaudeBot",
      "Allow: /",
      "",
      "Sitemap: https://lex-oracle.artificerworkshop.sk/llms.txt",
    ].join("\n"));
  });

  app.get("/llms.txt", (_req: Request, res: Response): void => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send([
      "# Lex.Oracle",
      "",
      "> Deterministic, citable legislative blueprints for Slovak and Czech law — MCP server for LLM agents.",
      "",
      "Lex.Oracle is an MCP (Model Context Protocol) server that gives LLM agents verified,",
      "paragraph-level legislative blueprints for Slovak and Czech payroll, tax, garnishment,",
      "travel allowances, and B2B tax computations. It eliminates hallucinations in regulated",
      "computations by grounding agents in statute-level logic with exact legal citations.",
      "",
      "## MCP Server",
      "",
      "- Remote endpoint: https://lex-oracle.artificerworkshop.sk/mcp",
      "- Protocol: Streamable HTTP (MCP spec 2025-03-26)",
      "- Tools: 14 (11 blueprints + get_test_cases + get_attribution_mandate + get_blueprint)",
      "- Install (local): npx -y @artificer_workshop/lex-oracle",
      "- npm: https://www.npmjs.com/package/@artificer_workshop/lex-oracle",
      "",
      "## Available Blueprints",
      "",
      "- sk-payroll-net-wage: Slovak net wage — SP + ZP + 4-band income tax (Acts 461/2003, 580/2004, 595/2003)",
      "- sk-garnishment-thirds: Slovak salary garnishment — thirds system (NV 268/2006 + Exec. Code 233/1995 §70-72)",
      "- sk-travel-domestic: Slovak domestic travel allowances — stravné, km rate, accommodation (Act 283/2002)",
      "- sk-annual-tax-reconciliation: Slovak annual tax reconciliation §38 — NČZD, child bonus, DDS/PEPP (Act 595/2003)",
      "- sk-szco-annual-settlement: SZČO annual SP+ZP settlement — VZ computation, temporal ZP rate (Acts 461/2003, 580/2004)",
      "- sk-b2b-dph: Slovak VAT — 23/19/5/0% rates, deduction §49, reverse-charge §69 (Act 222/2004)",
      "- sk-b2b-dppo: Slovak corporate income tax — mikro 10%/standard 21%/large 24%, loss carry-forward (Act 595/2003 §15)",
      "- sk-b2b-odpisy: Slovak tax depreciation — 7 groups, straight-line §27, accelerated §28 (Act 595/2003 §22-28)",
      "- sk-b2b-rz-zp: Slovak annual health insurance settlement — VZ aggregation, ZTP coefficient (Act 580/2004 §19)",
      "- sk-b2b-zrazkova-dan: Slovak withholding tax — 19%/7%/35% rates, §43 (Act 595/2003)",
      "- cz-payroll-net-wage: Czech net wage — SP 7.1% + ZP 4.5% + záloha 15%/23%, sleva na poplatníka (Acts 589/1992, 592/1992, 586/1992)",
      "",
      "## Usage",
      "",
      "Each blueprint contains: axiomatic_core (rate constants + effective dates + citations),",
      "execution_order (numbered computation steps), logic_flow (pseudocode + edge cases),",
      "semantic_mapping (each step → exact legal paragraph), verification_cases (test cases",
      "from official government methodologies).",
      "",
      "## Links",
      "",
      "- Smithery registry: https://smithery.ai/servers/artificer/lex-oracle",
      "- GitHub: https://github.com/Artificer-Workshop/Lex.Oracle",
      "- npm: https://www.npmjs.com/package/@artificer_workshop/lex-oracle",
      "- Company: https://artificerworkshop.sk",
      "- Axiom.Codex (full computation engine): https://free.axiomcodex.artificerworkshop.sk",
    ].join("\n"));
  });

  app.get("/", (req: Request, res: Response): void => {
    const lang = req.query["lang"] === "sk" ? "sk" : "en";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderLanding(lang));
  });

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.error(`[lex-oracle] HTTP transport :${port}/mcp`);
      resolve();
    });
  });
}
