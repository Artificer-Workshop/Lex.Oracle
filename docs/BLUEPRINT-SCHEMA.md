# Schéma blueprintu

Každý blueprint je TypeScript objekt typu `Blueprint` (viď `src/blueprints/types.ts`). Nasledujúce povinné polia tvoria záväznú schému v1.0:

## Hlavička

| Pole | Typ | Popis |
|------|-----|-------|
| `id` | `string` (kebab-case) | Stabilný identifikátor (napr. `"sk-garnishment-thirds"`) |
| `title` | `string` | Krátky ľudský titul |
| `version` | `string` (semver) | Verzia blueprintu — bumpni pri akejkoľvek normatívnej zmene |
| `jurisdiction` | `"SK"` \| `"CZ"` | ISO α-2 kód jurisdikcie |
| `status` | `"PLACEHOLDER"` \| `"DRAFT"` \| `"READY"` \| `"DEPRECATED"` | Pripravenosť |
| `last_reviewed` | `YYYY-MM-DD` | Dátum poslednej revízie obsahu |
| `summary` | `string` | Jeden odsek zhrnutia |
| `legal_acts` | `Array<{act, title, url?}>` | Zákony pokryté blueprintom |

## Sekcia 1: `axiomatic_core`

Pole `AxiomaticConstant`. Každá konštanta:
- `name` — symbolický názov (napr. `"K_BASE"`)
- `definition` — formálna definícia v slovnej / matematickej notácii
- `value` — hodnota alebo vzorec ako string (zachováva presné racionalia)
- `citation` — `LegalCitation`
- `effective_periods?` — historické verzie hodnoty

## Sekcia 2: `execution_order`

Pole stringov v poradí, v akom sa kroky vykonávajú. Príklad:
```
"STEP_S1: …"
"STEP_S2: …"
```

## Sekcia 3: `logic_flow`

Pole `LogicStep`. Každý krok:
- `id` — `"S1"`, `"S2.a"`, …
- `description` — jednovetová sumarizácia
- `pseudocode` — pseudokód bez jazykovo špecifickej syntaxe
- `citation` — `LegalCitation`
- `edge_cases?` — pole `{condition, behaviour, citation?}`. Edge cases sú **povinné** všade kde algoritmus má vetvenie.

## Sekcia 4: `semantic_mapping`

Pole `{step_id, citation}` — prepája každý krok algoritmu s presnou citáciou. Slúži na audit a krížovú kontrolu.

## Sekcia 5: `tool`

`ToolDefinition`:
- `name` — kebab-case
- `description`
- `input_parameters` — pole `ToolParameter` s typmi a unitmi
- `calculation_steps` — vysvetlenie postupu
- `audit_trail_template` — Mustache-style template (`{placeholder}`) pre ľudsky čitateľné odôvodnenie výsledku

## Sekcia 6: `verification_cases`

Pole `VerificationCase`. Minimum 3 prípady. Každý:
- `id`
- `source` — odkiaľ je prípad prevzatý (metodika, judikát, vendor table)
- `input` — kompletný objekt vstupov
- `expected_output` — kompletný objekt výstupov
- `legal_reasoning` — krok po kroku odôvodnenie

## Citácia (`LegalCitation`)

```ts
{
  act: "268/2006 Z. z.",
  paragraph: "§71",
  odsek?: 1,
  pismeno?: "a",
  effective_from: "2006-07-01",
  effective_to?: "2008-12-31",
  url?: "https://www.slov-lex.sk/…",
  quote: "Zvyšok čistej mzdy …"
}
```

## Determinizmus

- Žiadne `Math.random()`, dátumy `now()`, ani externé zdroje.
- Hodnoty konštánt vyjadruj ako string (napr. `"0.60"`, `"3/4"`) aby sa zachovala presnosť racionalia.
- Ak zákon pripúšťa dvojitý výklad, urči jeden a zaznač do `interpretation_notes` s rationale.
