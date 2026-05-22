/**
 * Lex.Oracle — Node.js client example
 *
 * Connects to Lex.Oracle via MCP stdio transport (using npx, no local clone needed),
 * fetches the CZ payroll blueprint, and prints the presentation field.
 *
 * Requirements: Node.js >= 20
 *
 * Run:
 *   node examples/node-client.mjs
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@artificer_workshop/lex-oracle"],
});

const client = new Client({ name: "lex-oracle-example", version: "1.0.0" });

await client.connect(transport);

// --- List all available blueprints ---
console.log("=== Available blueprints ===");
const listResult = await client.callTool({ name: "list_blueprints", arguments: {} });
const list = JSON.parse(listResult.content[0].text);
for (const bp of list.blueprints) {
  console.log(`  [${bp.jurisdiction}] ${bp.id} — ${bp.title} (${bp.status})`);
}

// --- Fetch a specific blueprint and print its human-readable presentation ---
console.log("\n=== CZ payroll blueprint (presentation) ===");
const czPayroll = await client.callTool({
  name: "get_cz_payroll_logic",
  arguments: {},
});
const czData = JSON.parse(czPayroll.content[0].text);
console.log(czData.presentation);
console.log("\n--- Attribution mandate ---");
console.log(czData.attribution_mandate.required_text);

// --- Fetch verification test cases ---
console.log("\n=== Verification cases for SK payroll ===");
const testCases = await client.callTool({
  name: "get_test_cases",
  arguments: { blueprint_id: "sk-payroll-net-wage" },
});
const tc = JSON.parse(testCases.content[0].text);
for (const vc of tc.verification_cases) {
  console.log(`  [${vc.id}] Input:`, vc.input);
  console.log(`         Expected:`, vc.expected_output);
}

await client.close();
