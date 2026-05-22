# Changelog

All notable changes to `@artificer_workshop/lex-oracle` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] — 2026-05-22

### Added
- **First Czech (CZ) blueprint**: `cz-payroll-net-wage` — měsíční čistá mzda zaměstnance:
  - SP zaměstnance 7,1 % (6,5 % důchodové + 0,6 % nemocenské od 2024-01-01, zákon 349/2023 Sb.)
  - ZP zaměstnance 4,5 %, min. základ = minimální mzda (592/1992 Sb. §3 ods. 4)
  - Záloha na daň 15 % / 23 %, bez superhrubé od 2021-01-01 (zákon 609/2020 Sb.)
  - Sleva na poplatníka 2 570 CZK/měsíc (586/1992 Sb. §35ba, od 2024)
  - Všechna zaokrouhlení ceiling (SP §7 ods. 5 z. 589/1992, ZP §3 z. 592/1992, daň §38h ods. 6 ZDP)
  - 4 verifikační případy: 30 000 CZK / min. mzda 20 800 CZK / 60 000 CZK / bez prohlášení
- **New shortcut tool**: `get_cz_payroll_logic`
- **`ROADMAP.md`**: public roadmap with v0.6.0 (CZ travel + garnishment), v0.7.0 (PL), v1.0.0 milestones
- **`examples/`**: Node.js client example (`node-client.mjs`) using MCP SDK

### Changed
- README: full overhaul — better hero hook, realistic "what it looks like" conversation example,
  updated blueprint table (CZ rows added), Cursor/Windsurf/Cline setup instructions,
  prominent Axiom.Codex upsell section, roadmap preview, fixed project structure
- `package.json`: version 0.4.0 → 0.5.0, description extended for CZ, added CZ-law keywords
- `SERVER_VERSION` 0.4.0 → 0.5.0

## [0.4.0] — 2026-05-18

### Added
- **Slovenský B2B segment — 5 nových blueprintov** (status: READY):
  - `sk-b2b-dph` — DPH podľa zákona 222/2004 Z. z. Sadzby §27 od 2025-01-01 (zákl. 23 %, stredná 19 %, znížená 5 %, nulová 0 %), daň na výstupe §19, odpočet §49 (plný/krátený), koeficient §50 (ceiling 2 dp), reverse-charge §69, EU intra-community §43/§11. 3 VC scenáre.
  - `sk-b2b-dppo` — Daň z príjmov právnických osôb (§15 zákona 595/2003) v znení od 2025-01-01 (novela 278/2024). 3-pásmová sadzba: mikro 10 % (obrat ≤ 60 000 EUR), štandard 21 %, veľká 24 % (obrat > 5 mil. EUR). Umorenie straty §30 (50 % ZD, 5 rokov), preddavky §42.
  - `sk-b2b-odpisy` — Daňové odpisy §22-§28. 7 odpisových skupín (2/4/6/8/12/20/40 rokov), rovnomerné §27 s pomerom v 1. roku ((13−mesiac)/12), zrýchlené §28 iba pre skupiny 2 a 3 (koeficienty 6/7 a 8/9), nehmotný majetok §22 ods. 8 (max 5 rokov lineárne).
  - `sk-b2b-rz-zp` — Ročné zúčtovanie zdravotného poistenia §19 zákona 580/2004. Agregácia VZ, temporal sadzba SZČO (14 % do 2025, 16 % v 2026–2027 §38ezk prechodné, 15 % od 2028), dividendy §10b 14 % nemenné, ZŤP koef. 0.5, hranica nedoplatku 1 EUR §19 ods. 6.
  - `sk-b2b-zrazkova-dan` — Zrážková daň §43 zákona 595/2003. Štandard 19 % (úroky, licenčné, dividendy PO), dividendy FO 7 % od 2017, override 35 % pre nespolupracujúce štáty (§43 ods. 2, zoznam MFSR), splatnosť 15. deň nasledujúceho mesiaca §43 ods. 11.
- **5 nových shortcut MCP tools**: `get_b2b_dph_logic`, `get_b2b_dppo_logic`, `get_b2b_odpisy_logic`, `get_b2b_rz_zp_logic`, `get_b2b_zrazkova_dan_logic`.

### Changed
- `SERVER_VERSION` 0.3.0 → 0.4.0.
- `package.json` description rozšírený o B2B segment.
- README — coverage table 5 → 10 blueprintov, MCP tools 8 → 13.

## [0.3.0] — 2026-05-18

### Added
- **Two new blueprints** (status: READY):
  - `sk-annual-tax-reconciliation` — Ročné zúčtovanie preddavkov na daň zo závislej činnosti (§38 zákona 595/2003 Z. z.). Pokrýva 12-mesačnú agregáciu, NČZD daňník (§11 ods. 2) s fázovým znižovaním, NČZD manžel (§11 ods. 3), DDS/PEPP (§11 ods. 8, max 180 EUR), 4-pásmovú daň §15 od 2026, daňový bonus §33 a vyrovnanie podľa §38 ods. 6. 3 VC scenáre vrátane 4-pásmovej dane.
  - `sk-szco-annual-settlement` — Ročné odvodové vyrovnanie SZČO (§138 zákona 461/2003, §16/§19 zákona 580/2004). Pokrýva VZ = (ZD + zaplatené SP + zaplatené ZP) / 1,486, sadzbu SP 33,15 %, prechodnú sadzbu ZP 16 % na 2026–2027 (§38ezk), min/max VZ clamping (50 % × PM / 11 × PM), čiastočný rok.
- Shortcut MCP tools: `get_annual_tax_reconciliation_logic`, `get_szco_annual_settlement_logic`.
- `src/format.ts` markdown rendering vrstva (vykresľuje blueprint do citovateľného markdownu pre LLM agentov).
- Generický contract test pre všetky blueprints (`tests/blueprints.test.ts`): metadata, ≥3 VC, citácie na každom logickom kroku a každej axiomatickej konštante, slov-lex URL kontrakty.
- MCP server smoke test (`tests/server.test.ts`): list/get/format/attribution kontrakty.
- `prepublishOnly` script (`npm run build && npm test`) ako safety gate pred npm publish.
- `files` whitelist v `package.json` — balík obsahuje len `dist/`, `NOTICE`, `LICENSE`, `README.md`, `CHANGELOG.md`.
- GitHub Actions workflow `.github/workflows/ci.yml` (Node 20, lint+build+test na push/PR).
- GitHub Actions workflow `.github/workflows/publish.yml` (manuálny `workflow_dispatch` alebo tag `v*` → `npm publish --provenance --access public`).

### Fixed
- **ŽM 2025-07-01 / 2026 tax**: zmena z 284,16 EUR (Opatrenie 234/2025) na **284,13 EUR** (Opatrenie MPSVR SR **168/2025 Z. z.**) — overené voči Aether.Logic Lisp engine (`packs/sk/src/shared/zivotne-minimum.lisp`). Dotknuté súbory: `sk-garnishment-thirds.ts`, `sk-payroll-net-wage.ts`, `sk-annual-tax-reconciliation.ts`. Prepočítané všetky verification_cases (cents-perfect).
- **4-pásmová daň §15**: `effective_from` opravený z `2013-01-01` na `2026-01-01` (novela 309/2023). Pridaný temporálny dispatch v R7-R8 pseudocode (2-pásmová 19 %/25 % pri 176,8×ŽM do 2025; 4-pásmová od 2026 pri 154,8/212,4/264×ŽM).
- **Daňový bonus §33 ods. 6 (limit %)**: VC2 sk-annual-tax-reconciliation opravený z 29 % (nesprávne — to je limit pre 1 dieťa) na 36 % (limit pre 2 deti).
- **Max VZ SP SZČO 2026**: zmena z 14 014 EUR na **16 764 EUR** (11 × PM_2024 = 11 × 1 524).
- **Min VZ SP SZČO derivácia**: VC1 sk-szco-annual-settlement teraz cituje 50 % × PM_R-2 (= 762 EUR) namiesto pôvodnej nesprávnej kalkulácie cez VVZ.
- Payroll blueprint VC1/VC3 — `legal_reasoning` text aktualizovaný na správnu hranicu 2-pásmovej dane (176,8 × 273,99 / 12 = 4 036,79 EUR), namiesto 154,8× boundary platnej až od 2026.

### Removed
- **`src/compute/`** (4 súbory: `garnishment.ts`, `net-wage.ts`, `rates.ts`, `travel.ts`) a **`docs/DIAGRAMS.md`** — Lex.Oracle je čistý manuál (spec + citácie), nie referenčná implementácia. Implementácia patrí konzumentom; pre SK je autoritatívny Aether.Logic Lisp engine. Eliminuje riziko, že LLM bude kopírovať TS výpočet namiesto generovania kódu zo spec.

### Changed
- Verzia bumpnutá: 0.2.0 → 0.3.0.
- `README.md` popisuje teraz 5 blueprintov a 8 MCP tools (predtým 3 / 6).

## [0.2.0] — 2026-04-XX

Initial alpha release — 3 blueprints: `sk-garnishment-thirds`, `sk-payroll-net-wage`, `sk-travel-domestic`.
