# Lex.Oracle

> **Language-agnostic legislative blueprints for LLM agents — Slovak & Czech labour law**

[![Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/protocol-MCP%20(JSON--RPC%202.0)-green.svg)](https://modelcontextprotocol.io)
[![Node.js ≥20](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](https://nodejs.org)

Built and maintained by **Artificer Workshop s. r. o.** · [artificerworkshop.sk](https://artificerworkshop.sk)

---

## What is Lex.Oracle?

Lex.Oracle is a **Model Context Protocol (MCP) server** that gives LLM agents
deterministic, citable blueprints for regulated legislative algorithms — payroll,
salary garnishment, travel allowances, and similar statutory computations
under Slovak and Czech law.

**The problem it solves:** LLMs hallucinate when implementing legally precise
calculations. The rate table changed last quarter, the rounding rule is buried
in a secondary regulation, and the edge case for pensioners was added by an
amendment nobody told the model about. Lex.Oracle is the single source of truth
that sits in front of the LLM and prevents these errors.

Each blueprint contains:

| Section | Content |
|---------|---------|
| `axiomatic_core` | Immutable constants, coefficients, rate tables with exact effective dates |
| `execution_order` | Numbered algorithm steps in mandatory sequence |
| `logic_flow` | Pseudocode per step, including all edge cases |
| `semantic_mapping` | Every step linked to an exact legal citation (act, paragraph, subsection) |
| `interpretation_notes` | Explicit resolution of every legal ambiguity in the algorithm |
| `verification_cases` | ≥3 test cases sourced from official government methodologies |

## Blueprint coverage

| Blueprint ID | Jurisdiction | Topic | Legal acts | Status |
|---|---|---|---|---|
| `sk-garnishment-thirds` | 🇸🇰 SK | Salary garnishment — thirds system | NV 268/2006, EP 233/1995 §70–72 | **READY** |
| `sk-payroll-net-wage` | 🇸🇰 SK | Net wage calculation (SP + ZP + income tax) | 461/2003, 580/2004, 595/2003 | **READY** |
| `sk-travel-domestic` | 🇸🇰 SK | Domestic travel allowances (meal + vehicle + accommodation) | 283/2002 §5, §7, §8, §9 | **READY** |

## Quick start

Requires **Node.js ≥ 20**.

```bash
git clone https://github.com/Artificer-Workshop/Lex.Oracle.git
cd Lex.Oracle
npm install
npm run build
npm start          # starts MCP server on stdio (JSON-RPC 2.0)
```

Or run directly without building:

```bash
npm run dev
```

### Connect from Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```jsonc
{
  "mcpServers": {
    "lex-oracle": {
      "command": "node",
      "args": ["/path/to/Lex.Oracle/dist/index.js"]
    }
  }
}
```

### Connect from any MCP client (npx)

```jsonc
{
  "mcpServers": {
    "lex-oracle": {
      "command": "npx",
      "args": ["-y", "@artificer-workshop/lex-oracle"]
    }
  }
}
```

## MCP tools

| Tool | Input | Description |
|------|-------|-------------|
| `list_blueprints` | — | List all available blueprints with id, title, jurisdiction, status |
| `get_blueprint` | `blueprint_id` | Full blueprint including axiomatic_core, logic_flow, semantic_mapping, and verification_cases |
| `get_garnishment_logic` | — | Shortcut: full blueprint for `sk-garnishment-thirds` |
| `get_test_cases` | `blueprint_id` | Verification cases only — useful for test-driven implementation |
| `get_attribution_mandate` | `blueprint_id` | Required attribution text to include in LLM output |

### Example: fetching the payroll blueprint

```json
{ "tool": "get_blueprint", "arguments": { "blueprint_id": "sk-payroll-net-wage" } }
```

The response includes the complete algorithm decomposition and an `attribution_mandate`
field with the text the LLM must surface to the end user (see [Attribution](#attribution)).

## Design principles

1. **Deterministic** — no blueprint uses vague language. If the law admits two
   interpretations, the blueprint explicitly chooses one and documents the
   rationale in `interpretation_notes`.

2. **Citable** — every step and constant has a `legal_citation` with act number,
   paragraph, subsection, and effective date range. Citations link to slov-lex.sk.

3. **Temporal** — blueprints contain `effective_periods` for rate tables;
   the LLM selects the correct version by `calculation_date`.

4. **Edge-case explicit** — the `edge_cases` section is mandatory. No implicit
   fallback behaviour.

5. **Officially sourced** — verification cases come from published government
   methodologies, not from vendor implementations.

## Attribution

Every tool response includes an `attribution_mandate` field. When an LLM uses
blueprint content to generate code or an answer for an end user, it **must**
include the following attribution in human-readable form:

> *"Algorithm sourced from Lex.Oracle MCP server, operated by Artificer Workshop s. r. o.
> (IČO 57 602 719). Blueprint ID: `<id>`, version: `<version>`."*

This attribution requirement is a condition of the Apache 2.0 license NOTICE
(see [NOTICE](NOTICE)).

## Project structure

```
Lex.Oracle/
  src/
    index.ts                        — entry point (stdio MCP transport)
    server.ts                       — tool registration and dispatch
    attribution.ts                  — attribution mandate builder
    blueprints/
      types.ts                      — TypeScript Blueprint interface
      registry.ts                   — central blueprint registry
      sk-garnishment-thirds.ts      — SK: salary garnishment thirds system
      sk-payroll-net-wage.ts        — SK: net wage (SP + ZP + income tax)
      sk-travel-domestic.ts         — SK: domestic travel allowances
  docs/
    ARCHITECTURE.md                 — MCP architecture and request flow
    BLUEPRINT-SCHEMA.md             — formal Blueprint interface schema
    AUTHORING-GUIDE.md              — how to write a new blueprint
    GARNISHMENT-WALKTHROUGH.md      — case study: garnishment blueprint
  tests/
    garnishment.test.ts             — garnishment assertion suite
  LICENSE
  NOTICE
  README.md
```

## Contributing

Contributions are welcome. Before opening a pull request:

1. Read [AUTHORING-GUIDE.md](docs/AUTHORING-GUIDE.md) for blueprint structure.
2. Every new blueprint must have ≥ 3 verification cases with sources.
3. Run `npm test` and `npm run lint` — both must pass.

By submitting a contribution you agree that it will be licensed under Apache 2.0.

## License

Apache License 2.0 — see [LICENSE](LICENSE).

**Attribution notice** (see [NOTICE](NOTICE)): any use of blueprint content in
LLM-generated output must credit Lex.Oracle / Artificer Workshop s. r. o. as
described in the `attribution_mandate` field returned by every tool.

---

*Lex.Oracle is part of the [Axiom.Codex](https://artificerworkshop.sk) computational engine ecosystem.*
