# Lex.Oracle — Examples

Runnable examples demonstrating how to consume Lex.Oracle from code.

## node-client.mjs

Node.js ≥ 20 client using the official MCP SDK.
Connects via `npx @artificer-workshop/lex-oracle` — no local clone required.

**Install the SDK once:**

```bash
npm install @modelcontextprotocol/sdk
```

**Run:**

```bash
node examples/node-client.mjs
```

**What it does:**
1. Lists all available blueprints
2. Fetches the CZ payroll blueprint and prints the human-readable presentation
3. Fetches verification test cases for the SK payroll blueprint

---

## Typical agent workflow

```
1. list_blueprints()
     → discover what's available

2. get_blueprint("sk-payroll-net-wage")   or use a shortcut like get_cz_payroll_logic()
     → get the full algorithm with citations

3. Use axiomatic_core constants + logic_flow pseudocode to implement or verify
     your computation

4. Use verification_cases to write tests before shipping
```

---

## Use from Claude Desktop / Cursor / Cline

No code required. Add the server to your MCP config (see main README),
then ask your agent directly:

> "What are the 2026 SP rates for employees in Slovakia?"
> "Implement a Python function to compute Czech net wage."
> "Write a test suite for Slovak payroll garnishment calculation."
