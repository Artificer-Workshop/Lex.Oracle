# Autorský sprievodca blueprintom

Tento dokument vedie doménového experta cez proces vytvorenia nového blueprintu pre Lex.Oracle.

## Pred-podmienky

- Máš plný text zákona (najlepšie všetky historické verzie z slov-lex.sk).
- Máš aspoň jeden metodický postup ministerstva alebo vendor implementáciu, voči ktorej budeš verifikovať.
- Vieš identifikovať všetky **edge cases** v zákone — situácie, kde algoritmus vetví.

## Pracovný postup

### 1. Identifikuj scope

Jeden blueprint = jeden **uzavretý algoritmus**. Príklady správneho rozsahu:
- ✓ "Tretinkový systém pre exekučné zrážky"
- ✓ "Výpočet preddavku na daň z príjmov FO §35 ZDP"
- ✗ "Celá mzdová agenda" (príliš široké → rozdeľ na viac blueprintov)

### 2. Vytvor súbor

```
src/blueprints/<jurisdiction>-<topic>.ts
```

Napr. `sk-payroll-social-insurance.ts`. Kebab-case, lower.

### 3. Naplň `axiomatic_core`

Každá konštanta v zákone — koeficient, percento, suma, koeficient stropu — je vlastný `AxiomaticConstant`. Ak sa hodnota mení v čase (typicky ŽM, sadzby), vyplň `effective_periods`.

**Pravidlo:** každá konštanta MUSÍ mať `citation` smerujúcu na konkrétny paragraf a odsek.

### 4. Napíš `execution_order`

Pole stringov v presnom poradí krokov. Toto je "table of contents" pre logic_flow. Zatiaľ bez kódu — len krátke vety.

### 5. Rozpíš `logic_flow`

Pre každý krok:
- jednoznačný `id` korelujúci s `execution_order`
- pseudokód bez jazykovo-špecifickej syntaxe (žiadne `let`, `const`, `defun`, `def`)
- citácia z relevantného paragrafu
- **edge cases** — pre každú vetvu `if/elif/else` v algoritme

### 6. Vyplň `semantic_mapping`

Cross-table medzi `step_id` a `citation`. Slúži pre rýchly audit "kde v zákone je tento krok zakotvený".

### 7. Definuj `tool`

- `name` — kebab-case, prefix podľa domény (`get_payroll_…`, `get_garnishment_…`)
- `input_parameters` — vrátane `unit` (`"EUR"`, `"EUR/month"`, `"count"`)
- `audit_trail_template` — Mustache placeholders v `{snake_case}`

### 8. Pridaj minimálne 3 `verification_cases`

Zdroje (preferované poradie):
1. Metodický postup MPSVR / MF SR / FR SR
2. Modelové príklady z ročenky / komentára k zákonu
3. Judikatúra Ústavného súdu SR / NS SR
4. Vendor implementácie (KROS, Olymp) — len ako sekundárny cross-check

Každý prípad MUSÍ mať `legal_reasoning` — krok po kroku odôvodnenie.

### 9. Registruj blueprint

V `src/blueprints/registry.ts` pridaj import a do poľa `BLUEPRINTS`.

### 10. Build + test

```bash
npm run build
npm test
```

### 11. Bumpni `version`

- Prvá publikácia: `1.0.0`
- Pridanie test case bez zmeny algoritmu: PATCH (1.0.1)
- Spresnenie pseudokódu / citácie: MINOR (1.1.0)
- Zmena algoritmu (novela zákona): MAJOR (2.0.0)

## Čo sa NEROBÍ

- ❌ Nepoužívaj vágnu terminológiu ("primerane", "obvykle"). Buď deterministický.
- ❌ Nedávaj implicitné správanie. Každú vetvu pomenuj v `edge_cases`.
- ❌ Nepoužívaj jazykovo-špecifickú syntax v pseudokóde.
- ❌ Neuvádzaj implementačné detaily konkrétneho engine. Blueprint je **abstraktný**.
- ❌ Nikdy neoznačuj blueprint ako `READY` ak nemáš aspoň 3 zelené verification cases.

## Kontrolný zoznam pred mergeom

- [ ] Každý logic step má `citation`
- [ ] Každá konštanta má `citation`
- [ ] Každé vetvenie algoritmu má edge case v príslušnom kroku
- [ ] Aspoň 3 verification cases zo zdrojov ministerstva
- [ ] `interpretation_notes` doplnené pre nejasné miesta
- [ ] `version` a `last_reviewed` aktuálne
- [ ] `npm run build` zelené
- [ ] `npm test` zelené
