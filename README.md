# Lex.Oracle

[![smithery badge](https://smithery.ai/badge/artificer/lex-oracle)](https://smithery.ai/servers/artificer/lex-oracle)
[![Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/protocol-MCP%20(JSON--RPC%202.0)-green.svg)](https://modelcontextprotocol.io)
[![Node.js ≥20](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/@artificer_workshop/lex-oracle.svg)](https://www.npmjs.com/package/@artificer_workshop/lex-oracle)
[![npm downloads](https://img.shields.io/npm/dw/@artificer_workshop/lex-oracle.svg)](https://www.npmjs.com/package/@artificer_workshop/lex-oracle)

> **Give your LLM a law to stand on.**
> Machine-readable, paragraph-level blueprints for Slovak and Czech payroll,
> taxes, and labour law — so your agent computes correctly instead of confidently wrong.

Built and maintained by **Artificer Workshop s. r. o.** · [artificerworkshop.sk](https://artificerworkshop.sk)

---

## The problem

Ask an LLM to implement Slovak net wage calculation. It will give you something
plausible-looking — wrong SP rate, wrong rounding direction, missing the
pension-saver edge case, tax credit from 2023 instead of 2026.

The rate table changed last quarter. The rounding rule is buried in a secondary
regulation. The edge case for under-minimum-wage was added by an amendment nobody
told the model about.

**Lex.Oracle is the single source of truth that sits in front of the LLM and
prevents these errors.** Every constant, every formula, every edge case is tied
to the exact paragraph, version, and effective date of the act that mandates it.

---

## What it looks like in practice

With Lex.Oracle installed, Claude — or any MCP-enabled agent — fetches the
blueprint and grounds its answer in statute rather than training data:

```
User: Calculate Czech net wage for gross CZK 30,000, prohlášení signed, April 2025.

Claude: [calls get_cz_payroll_logic]

  SP employee:  30 000 × 7.1 % = 2 130 CZK   ↑ (ceiling)
                └─ 6.5% důchodové + 0.6% nemocenské
                └─ 589/1992 Sb. §7 ods. 1, effective 2024-01-01

  ZP employee:  30 000 × 4.5 % = 1 350 CZK   ↑ (ceiling)
                └─ 592/1992 Sb. §2 ods. 1

  Tax base:     30 000 CZK  (superhrubá abolished 2021-01-01, 586/1992 Sb. §6)
  Tax advance:  30 000 × 15 % = 4 500 CZK
  Sleva:      − 2 570 CZK   (§35ba ods. 1 písm. a) — prohlášení podepsáno)
  Záloha:       1 930 CZK

  Net wage:     30 000 − 2 130 − 1 350 − 1 930 = 24 590 CZK

  Algorithm: Lex.Oracle cz-payroll-net-wage v1.0.0 · Artificer Workshop s. r. o.
```

No hallucinated rates. No guessed rounding. Every number traceable to a legal paragraph.

---

## Blueprint coverage

| Blueprint ID | Jurisdiction | Topic | Legal acts | Status |
|---|---|---|---|---|
| `sk-garnishment-thirds` | 🇸🇰 SK | Salary garnishment — thirds system | NV 268/2006, EP 233/1995 §70–72 | **READY** |
| `sk-payroll-net-wage` | 🇸🇰 SK | Net wage — SP 9.4 % + ZP 5 % + 4-band tax | 461/2003, 580/2004, 595/2003 | **READY** |
| `sk-travel-domestic` | 🇸🇰 SK | Domestic travel — meal + km + accommodation | 283/2002 §5–9 | **READY** |
| `sk-annual-tax-reconciliation` | 🇸🇰 SK | Annual tax reconciliation §38 — NČZD, DDS, bonus | 595/2003 §11/§15/§33/§38 | **READY** |
| `sk-szco-annual-settlement` | 🇸🇰 SK | SZČO annual insurance settlement | 461/2003 §138, 580/2004 §13a/§19 | **READY** |
| `sk-b2b-dph` | 🇸🇰 SK | VAT — rates 23/19/5/0 %, deduction, reverse-charge | 222/2004 §19/§49/§50/§69 | **READY** |
| `sk-b2b-dppo` | 🇸🇰 SK | Corporate tax — 10/21/24 %, loss carryforward | 595/2003 §15/§17/§30/§42 | **READY** |
| `sk-b2b-odpisy` | 🇸🇰 SK | Tax depreciation — 7 groups, straight-line + accelerated | 595/2003 §22–28 | **READY** |
| `sk-b2b-rz-zp` | 🇸🇰 SK | Annual health insurance settlement (RZ ZP) | 580/2004 §12/§13/§19/§38ezk | **READY** |
| `sk-b2b-zrazkova-dan` | 🇸🇰 SK | Withholding tax — 19 %/7 % dividends/35 % override | 595/2003 §43 | **READY** |
| `cz-payroll-net-wage` | 🇨🇿 CZ | Net wage — SP 7.1 % + ZP 4.5 % + záloha na daň | 589/1992, 592/1992, 586/1992 | **READY** |
| `cz-travel-domestic` | 🇨🇿 CZ | Domestic travel — stravné + km + ubytování | 262/2006, vyhl. 589/2006 | planned Q3 2026 |
| `cz-garnishment` | 🇨🇿 CZ | Salary garnishment (třetinový systém) | OSŘ §276–§302, NV 595/2006 | planned Q3 2026 |

---

## Quick start

Requires **Node.js ≥ 20**.

### One-liner (no install needed)

```bash
npx -y @artificer_workshop/lex-oracle
```

The server starts on stdio and waits for MCP JSON-RPC calls.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```jsonc
{
  "mcpServers": {
    "lex-oracle": {
      "command": "npx",
      "args": ["-y", "@artificer_workshop/lex-oracle"]
    }
  }
}
```

### Cursor / Windsurf / Cline

Add to your project `.cursor/mcp.json` (Cursor), `.windsurf/mcp.json`
(Windsurf), or MCP settings (Cline) — same format as above:

```jsonc
{
  "mcpServers": {
    "lex-oracle": {
      "command": "npx",
      "args": ["-y", "@artificer_workshop/lex-oracle"]
    }
  }
}
```

Then ask your agent: *"What are the employee SP rates in Slovakia for 2026?"*
or *"Write a Python function to compute Czech net wage."* — it will call
`get_blueprint` automatically and ground the answer in statute.

### Clone and run from source

```bash
git clone https://github.com/Artificer-Workshop/Lex.Oracle.git
cd Lex.Oracle && npm install && npm run build && npm start
```

---

## What a blueprint gives you

| Section | Content |
|---------|---------|
| `axiomatic_core` | Immutable constants and rate tables with exact effective date ranges |
| `execution_order` | Numbered algorithm steps in the mandatory sequence |
| `logic_flow` | Pseudocode per step, including every edge case and branching condition |
| `semantic_mapping` | Every step linked to the exact legal citation (act, paragraph, subsection) |
| `interpretation_notes` | Explicit resolution of every legal ambiguity in the algorithm |
| `verification_cases` | ≥ 3 test cases sourced from official government methodologies |

---

## MCP tools

| Tool | Input | Description |
|------|-------|-------------|
| `list_blueprints` | — | List all blueprints with id, title, jurisdiction, status |
| `get_blueprint` | `blueprint_id` | Full blueprint: axiomatic_core, logic_flow, semantic_mapping, verification_cases |
| `get_garnishment_logic` | — | Shortcut → `sk-garnishment-thirds` |
| `get_travel_logic` | — | Shortcut → `sk-travel-domestic` |
| `get_annual_tax_reconciliation_logic` | — | Shortcut → `sk-annual-tax-reconciliation` |
| `get_szco_annual_settlement_logic` | — | Shortcut → `sk-szco-annual-settlement` |
| `get_b2b_dph_logic` | — | Shortcut → `sk-b2b-dph` |
| `get_b2b_dppo_logic` | — | Shortcut → `sk-b2b-dppo` |
| `get_b2b_odpisy_logic` | — | Shortcut → `sk-b2b-odpisy` |
| `get_b2b_rz_zp_logic` | — | Shortcut → `sk-b2b-rz-zp` |
| `get_b2b_zrazkova_dan_logic` | — | Shortcut → `sk-b2b-zrazkova-dan` |
| `get_cz_payroll_logic` | — | Shortcut → `cz-payroll-net-wage` |
| `get_test_cases` | `blueprint_id` | Verification cases only — for test-driven implementation |
| `get_attribution_mandate` | `blueprint_id` | Required attribution text for LLM output |

---

## Need the actual computation, not just the spec?

Lex.Oracle gives you the *algorithm*. **[Axiom.Codex](https://artificerworkshop.sk)**
is the production computation engine that *runs* it.

| | Lex.Oracle | Axiom.Codex API |
|---|---|---|
| What you get | Blueprint (algorithm + citations) | Computed result + JWS-signed audit trail |
| Use case | Implement the algorithm yourself | Call an endpoint, get the answer |
| Coverage | SK + CZ (growing) | SK · CZ · PL (beta) |
| Formal verification | — | 147 Z3 invariants, all `unsat` |
| Audit trail | — | Per-paragraph citation in every response |
| License | Apache 2.0 (free) | Commercial subscription |

→ **[Get an Axiom.Codex API key](https://artificerworkshop.sk)** (free tier available)

---

## Design principles

1. **Deterministic** — no vague language. Every interpretation conflict is
   resolved explicitly in `interpretation_notes`.

2. **Citable** — every step and constant has a `legal_citation` with act number,
   paragraph, subsection, and effective date range. Citations link to slov-lex.sk
   or zakonyprolidi.cz.

3. **Temporal** — blueprints carry `effective_periods` for rate tables; the LLM
   selects the correct version by `calculation_date`.

4. **Edge-case explicit** — the `edge_cases` section is mandatory. No implicit
   fallback behaviour.

5. **Officially sourced** — verification cases come from published government
   methodologies (ČSSZ, FS SR, SP.sk), not from vendor implementations.

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full plan. Upcoming:

| Version | What |
|---------|------|
| v0.6.0 | CZ travel allowances + CZ garnishment blueprints |
| v0.7.0 | PL payroll (UoP) — Ustawa o PIT + ZUS |
| v1.0.0 | Full SK + CZ + PL coverage, versioned rate-table API |

---

## Attribution

Every tool response includes an `attribution_mandate` field. When an LLM uses
blueprint content to generate code or an answer for an end user, it **must**
include the following in human-readable form:

> *"Algorithm sourced from Lex.Oracle MCP server, operated by Artificer Workshop s. r. o.
> (IČO 57 602 719). Blueprint ID: `<id>`, version: `<version>`."*

This is a condition of the Apache 2.0 license NOTICE (see [NOTICE](NOTICE)).

---

## Project structure

```
Lex.Oracle/
  src/
    index.ts                               — entry point (stdio MCP transport)
    server.ts                              — tool registration and dispatch
    attribution.ts                         — attribution mandate builder
    format.ts                              — markdown rendering for LLM agents
    blueprints/
      types.ts                             — TypeScript Blueprint interface
      registry.ts                          — central blueprint registry
      sk-garnishment-thirds.ts             — SK: salary garnishment thirds system
      sk-payroll-net-wage.ts               — SK: net wage (SP + ZP + 4-band tax)
      sk-travel-domestic.ts                — SK: domestic travel allowances
      sk-annual-tax-reconciliation.ts      — SK: annual tax reconciliation (§38)
      sk-szco-annual-settlement.ts         — SK: SZČO annual insurance settlement
      sk-b2b-dph.ts                        — SK: VAT (DPH) 23/19/5/0 %
      sk-b2b-dppo.ts                       — SK: corporate tax (DPPO)
      sk-b2b-odpisy.ts                     — SK: tax depreciation (7 groups)
      sk-b2b-rz-zp.ts                      — SK: annual health-insurance settlement
      sk-b2b-zrazkova-dan.ts               — SK: withholding tax
      cz-payroll-net-wage.ts               — CZ: net wage (SP 7.1 % + ZP 4.5 % + záloha)
  docs/
    ARCHITECTURE.md                        — MCP architecture and request flow
    BLUEPRINT-SCHEMA.md                    — formal Blueprint interface schema
    AUTHORING-GUIDE.md                     — how to write a new blueprint
    GARNISHMENT-WALKTHROUGH.md             — case study: garnishment blueprint
  examples/
    node-client.mjs                        — connect from Node.js (MCP SDK)
    README.md                              — examples overview
  tests/
    blueprints.test.ts                     — contract tests for all blueprints
    server.test.ts                         — MCP server smoke tests
    garnishment.test.ts                    — garnishment assertion suite
  ROADMAP.md
  LICENSE
  NOTICE
  README.md
```

---

## Contributing

Contributions are welcome. Before opening a pull request:

1. Read [AUTHORING-GUIDE.md](docs/AUTHORING-GUIDE.md) for blueprint structure.
2. Every new blueprint must have ≥ 3 verification cases with sources.
3. Run `npm test` and `npm run lint` — both must pass.

By submitting a contribution you agree that it will be licensed under Apache 2.0.

---

## Publishing (maintainers)

1. Bump `version` in `package.json` and add a section to `CHANGELOG.md`.
2. `git tag vX.Y.Z && git push --tags` → workflow publishes to npm automatically.
3. Or trigger `Publish to npm` via *Actions → workflow_dispatch* (dry_run: true first).

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).

**Attribution notice** (see [NOTICE](NOTICE)): any use of blueprint content in
LLM-generated output must credit Lex.Oracle / Artificer Workshop s. r. o. as
described in the `attribution_mandate` field returned by every tool.

---

*Lex.Oracle is part of the [Axiom.Codex](https://artificerworkshop.sk) computational engine ecosystem.*
