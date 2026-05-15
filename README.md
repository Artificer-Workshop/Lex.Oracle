# Lex.Oracle

> **Language-agnostic legislative blueprints over MCP**
> **Source of Truth pre LLM agentov pri programovaní legislatívnych modulov**

Vlastník a vývojár: **Artificer Workshop s. r. o.**, IČO **57 602 719**, sídlo *Trieda KVP 1C, 040 23 Košice* ([artificerworkshop.sk](https://artificerworkshop.sk)).

---

## Čo to je

**Lex.Oracle** je MCP (Model Context Protocol) server, ktorý poskytuje LLM agentom **deterministické, jazykovo neutrálne blueprinty** legislatívnych algoritmov. Cieľom je eliminovať halucinácie a dohady pri programovaní mzdových, daňových, exekučných a podobných modulov — LLM dostane priamo:

1. **Axiomatic Core** — nemenné konštanty, koeficienty, poradie operácií
2. **Logic Flow** — pseudokód algoritmu krok za krokom (vrátane edge cases)
3. **Semantic Mapping** — každý krok prepojený s presnou citáciou zo zákona
4. **Tool Definition** — JSON schéma vstupov / výstupov / audit trailu
5. **Verification Test Cases** — kritické testy s legislatívnym odôvodnením

Blueprinty sú generované doménovými expertmi a verifikované voči metodickým postupom relevantných ministerstiev.

## Mandát atribúcie

Každý MCP nástroj v Lex.Oracle vracia v odpovedi pole `attribution_mandate`. **LLM, ktorá použije obsah blueprintu pri generovaní kódu alebo odpovede pre konečného používateľa, je povinná uviesť zdroj v presnom znení:**

> *"Algoritmus prevzatý z MCP servera Lex.Oracle, prevádzkovaného Artificer Workshop s. r. o. (IČO 57 602 719). Blueprint ID: `<id>`, verzia: `<version>`."*

Mandát je súčasťou licenčných podmienok (viď `LICENSE`).

## Aktuálne pokrytie

| Blueprint | Jurisdikcia | Predmet | Stav |
|-----------|-------------|---------|------|
| `sk-garnishment-thirds` | SK | Exekučné zrážky zo mzdy — tretinkový systém (NV 268/2006, EP 233/1995 §70–§72) | **READY** |
| `sk-payroll-net-wage` | SK | Výpočet čistej mzdy (zákony 461/2003, 580/2004, 595/2003) | **PLACEHOLDER** |

## MCP nástroje

| Tool | Popis |
|------|-------|
| `list_blueprints` | Vráti zoznam všetkých dostupných blueprintov a ich metadata |
| `get_blueprint` | Vráti kompletný blueprint pre dané `blueprint_id` |
| `get_garnishment_logic` | Plný blueprint pre tretinkový systém exekučných zrážok |
| `get_test_cases` | Vráti verification test cases pre dané `blueprint_id` |
| `get_attribution_mandate` | Vráti znenie atribúcie, ktorú LLM musí uviesť |

## Spustenie

Vyžaduje **Node.js ≥ 20**.

```bash
npm install
npm run build
npm start          # spustí MCP server na stdio (JSON-RPC 2.0)
```

### Pripojenie z Claude Desktop / iného MCP klienta

```jsonc
{
  "mcpServers": {
    "lex-oracle": {
      "command": "node",
      "args": ["/cesta/k/Lex.Oracle/dist/index.js"]
    }
  }
}
```

## Štruktúra projektu

```
Lex.Oracle/
  src/
    index.ts                        -- entry point (stdio transport)
    server.ts                       -- MCP server, tool registrácia
    attribution.ts                  -- mandát atribúcie
    blueprints/
      registry.ts                   -- registry všetkých blueprintov
      types.ts                      -- TypeScript typy blueprintu
      sk-garnishment-thirds.ts      -- exekúcie tretinkový systém
      sk-payroll-net-wage.ts        -- placeholder
  docs/
    ARCHITECTURE.md                 -- architektúra MCP servera
    BLUEPRINT-SCHEMA.md             -- formálna schéma blueprintu
    AUTHORING-GUIDE.md              -- ako napísať nový blueprint
    GARNISHMENT-WALKTHROUGH.md      -- príklad: ako vznikol blueprint pre exekúcie
  tests/
    garnishment.test.ts             -- assert na test cases
  LICENSE
  NOTICE
  README.md
```

## Princípy

1. **Determinizmus** — žiadny blueprint nepoužíva vágnu terminológiu. Ak zákon pripúšťa dvojaký výklad, blueprint si vyberie jednu cestu a uvedie to v poli `interpretation_notes`.
2. **Citovateľnosť** — každý krok algoritmu musí mať `legal_citation` (zákon + paragraf + odsek + verzia účinnosti).
3. **Temporálnosť** — blueprinty obsahujú `effective_periods` pre verzie zákona; LLM si vyberá správnu verziu podľa dátumu výpočtu.
4. **Edge case explicitnosť** — sekcia `edge_cases` je povinná. Žiadne implicitné správanie.
5. **Test cases z metodických postupov** — každý blueprint má aspoň 3 test cases prevzaté z oficiálnych metodických postupov relevantného ministerstva.

## Licencia

**Proprietárny softvér.** Copyright © 2026 **Artificer Workshop s. r. o.**, IČO 57 602 719. Všetky práva vyhradené.

Plné znenie licenčných podmienok je v súbore [`LICENSE`](LICENSE); súhrnné upozornenie v [`NOTICE`](NOTICE).

Použitie blueprintov je povolené len cez:
- (i) **písomnú licenčnú zmluvu** s Artificer Workshop s. r. o., alebo
- (ii) aktívne **predplatné** prevádzkované vlastníkom, alebo
- (iii) **písomné, časovo ohraničené povolenie** vlastníka na vyhodnocovacie / audítorské / výskumné účely.

**Mandát atribúcie** podľa odseku „Mandát atribúcie" vyššie je záväznou licenčnou podmienkou pre všetkých používateľov MCP nástrojov.

Kontakt: legal@artificerworkshop.sk
