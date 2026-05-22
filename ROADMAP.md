# Lex.Oracle — Roadmap

This roadmap is public and updated with each release.
Issues and suggestions: open a GitHub Issue.

---

## Current release: v0.5.0 (2026-05-22)

- ✅ 10 SK blueprints (payroll, garnishment, travel, tax, SZČO, B2B)
- ✅ First CZ blueprint: `cz-payroll-net-wage` (SP 7.1 % + ZP 4.5 % + záloha na daň)
- ✅ 14 MCP tools

---

## v0.6.0 — CZ expansion (Q3 2026)

| Blueprint ID | Topic | Legal acts |
|---|---|---|
| `cz-travel-domestic` | Travel allowances — stravné + km + ubytování | 262/2006 Sb. §151–§189, Vyhláška 589/2006 Sb. |
| `cz-garnishment` | Salary garnishment — třetinový systém | OSŘ §276–§302, NV 595/2006 Sb. |
| `cz-annual-tax-reconciliation` | Roční zúčtování daně — NČZD, slevy, bonus | 586/1992 Sb. §38ch |

---

## v0.7.0 — Polish market entry (Q4 2026)

| Blueprint ID | Topic | Legal acts |
|---|---|---|
| `pl-payroll-uop` | Net wage (UoP) — ZUS employee + PIT advance | Ustawa o PIT (1991/80/350), Ustawa o ZUS (1998/137/887) |
| `pl-travel-domestic` | Podróże służbowe — diety + km | RMPiPS z 29.01.2013 |
| `pl-garnishment` | Egzekucja z wynagrodzenia — system potrąceń | KP §87–§91 |

---

## v1.0.0 — Production-grade multi-jurisdiction coverage (H1 2027)

Goals for the 1.0 milestone:

- Full SK + CZ + PL blueprint parity (payroll · garnishment · travel · tax reconciliation)
- Blueprint versioning API: `get_blueprint_version(id, effective_date)` returns the
  historically correct algorithm for any past date
- Machine-readable rate-table diff feed: structured changelog for every rate change
- Automated freshness checks: CI verifies constants against official government sources
  quarterly

---

## Maintained by

[Artificer Workshop s. r. o.](https://artificerworkshop.sk) (IČO 57 602 719)

Lex.Oracle blueprints power [Axiom.Codex](https://artificerworkshop.sk) —
the production computation engine for SK · CZ · PL payroll and tax law,
with JWS-signed audit trails and Z3 formal verification.
