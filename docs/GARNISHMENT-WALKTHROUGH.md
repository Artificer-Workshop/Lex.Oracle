# Garnishment Walkthrough — ako vznikol `sk-garnishment-thirds`

Tento dokument ukazuje na konkrétnom príklade, ako sa zákonný text dekonštruuje do blueprintu. Použiteľné ako šablóna pre ďalšie blueprinty.

## Vstup

Dva primárne zákony:

- **NV SR 268/2006 Z. z.** — definuje nezraziteľné sumy a strop (§1, §2, §3)
- **Zákon NR SR 233/1995 Z. z.** (Exekučný poriadok), §70–§72 — definuje rozdelenie zvyšku na tretiny a distribučný algoritmus

Sekundárne:
- **Zákon č. 601/2003 Z. z.** — referenčné životné minimum (zdroj všetkých koeficientov)

## Krok 1 — extrakcia konštánt (`axiomatic_core`)

Prešiel som §1, §2, §2a, §2b, §3 NV 268/2006 a vytiahol konštanty. Každá má:
- názov (`K_BASE`, `K_DEPENDANT`, `STROP`, …)
- formálnu definíciu
- citáciu
- historické verzie (`effective_periods`) — kľúčové, lebo koeficienty sa menili novelami 292/2015, 390/2021

Napríklad `K_BASE`:
```
2006-07-01 → 2015-12-31 : 0.60   (60 % ŽM)
2016-01-01 → 2021-12-31 : 1.00   (novela 292/2015)
2022-01-01 → ?          : 1.40   (novela 390/2021)
```

## Krok 2 — určenie `execution_order`

12 krokov, S1 → S12, lineárne s vetvením v S6 (no-remainder) a S12 (distribúcia podľa typu pohľadávky).

## Krok 3 — `logic_flow` + edge cases

Prešiel som každý krok a doplnil:
- pseudokód (bez `let`, `const` — čisto algoritmický)
- edge cases zo zákona alebo z výkladovej praxe MPSVR

Príklad edge case zo zákona §1 ods. 4:
> "25 % zo životného minima … sa nezapočítava na tú osobu, v ktorej prospech trvá výkon rozhodnutia na vymoženie pohľadávky výživného."

→ Edge case v S4: ak `claim_type == alimony_for_this_person`, vyživovaná osoba sa odpočíta z `dependants` pred násobením prírastku.

## Krok 4 — `interpretation_notes`

Tri miesta v zákone som identifikoval ako nejasné:

1. **Smer zaokrúhlenia v §71 ods. 1 EP** — zákon hovorí "zaokrúhli na sumu deliteľnú tromi", nehovorí smer. Ustálená prax MPSVR a Komory exekútorov: NADOL. Doplnené do `interpretation_notes` s rationale.

2. **Centové zvyšky pri pomernom delení (§72 ods. 3)** — zákon nešpecifikuje algoritmus pomerného delenia. Použitá metóda najväčšieho zvyšku (Hamilton). Doplnené do `interpretation_notes`.

3. **Sub-cent zostatok zo zaokrúhlenia tretín** — kam ide max 2 cent rozdiel? Logická a výkladová odpoveď: zostáva povinnému (3. tretina). Doplnené.

## Krok 5 — verification cases

Vybrané 3 prípady:

- **VC1** — jednoduchý: bezdetný, jedna nepriorita, mzda 1000 EUR. Test: základný workflow + sub-centový zvyšok 2 centy.
- **VC2** — komplexný: 2 deti, jedno z nich príjemcom výživného → §1 ods. 4 vylúčenie, §2 zníženie základu na 70 %.
- **VC3** — vysoký príjem: 3000 EUR, dve exekúcie (priorita + nepriorita). Test §71 ods. 3 EP nadlimit + §72 distribúcia.

Každý prípad má `legal_reasoning` — krok po kroku odôvodnenie, ktoré LLM vie použiť ako tréningový/few-shot príklad.

## Krok 6 — `tool` definícia

Tool `get_garnishment_logic` má 5 vstupných parametrov, 8 calculation steps, audit_trail_template s 11 placeholdermi.

## Výstup

Súbor `src/blueprints/sk-garnishment-thirds.ts`, ~430 riadkov, status `READY`, version `1.0.0`.

## Čo sa stane s blueprintom keď príde novela?

1. Bumpnem `version` na `2.0.0` (MAJOR — algoritmus sa menil).
2. Pridám novú entry do `effective_periods` dotknutých konštánt.
3. Doplním nové edge cases do `logic_flow`.
4. Pridám aspoň 1 nový verification case zo nového účinného obdobia.
5. Aktualizujem `last_reviewed`.
6. Stará verzia ostáva v git histórii — LLM ktorá spomenula predchádzajúcu `version` v atribúcii má dohľadateľný stav.
