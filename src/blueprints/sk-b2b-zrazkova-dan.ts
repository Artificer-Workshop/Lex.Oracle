/**
 * Blueprint: SK B2B — Zrážková daň (§43 zákona 595/2003)
 *
 * Pokrýva výpočet zrážkovej dane pre rezidentov a nerezidentov: úroky z vkladov,
 * podiely na zisku FO, licenčné poplatky, dividendy PO. Sadzby 7 % (dividendy FO),
 * 19 % (štandard), 35 % (nespolupracujúce jurisdikcie, §43 ods. 2). Splatnosť do
 * 15. dňa nasledujúceho mesiaca podľa §43 ods. 11.
 */

import type { Blueprint } from "./types.js";

const blueprint: Blueprint = {
  id: "sk-b2b-zrazkova-dan",
  title: "SK B2B — Zrážková daň (§43 595/2003 Z. z.)",
  version: "1.0.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Výpočet zrážkovej dane podľa §43 zákona 595/2003: 7 % na dividendy fyzických osôb, " +
    "19 % na úroky, licenčné poplatky a dividendy právnických osôb, 35 % na všetky " +
    "plnenia smerujúce do nespolupracujúcich štátov (§43 ods. 2). " +
    "Pokrýva oznámenie a splatnosť do 15. dňa nasledujúceho mesiaca (§43 ods. 11).",
  legal_acts: [
    {
      act: "595/2003 Z. z.",
      title: "Zákon o dani z príjmov",
      url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
    },
  ],
  interpretation_notes: [
    {
      issue:
        "Sadzba 35 % pre 'nespolupracujúce štáty' (§43 ods. 2) — zoznam je dynamický.",
      chosen_interpretation:
        "Aplikuje sa override 35 % ak kod_statu prijemcu je v aktuálnom MFSR zozname nespolupracujúcich štátov, BEZ ohľadu na typ plnenia (úrok, licencia, dividenda).",
      rationale:
        "MFSR vedie zoznam (Oznámenie 24/2017 Z. z. + aktualizácie). Lex.Oracle nedrží zoznam — konzument MUSÍ poskytnúť kod_statu a flag 'je_nespolupracujuci'.",
    },
  ],
  axiomatic_core: [
    {
      name: "WHT_SADZBA_STANDARD",
      definition:
        "Štandardná sadzba zrážkovej dane (úroky, licenčné poplatky, dividendy PO)",
      value: "19 %",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 1,
        effective_from: "2013-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Daň sa vyberá zrážkou vo výške 19 % zo základu dane, ak tento zákon neustanovuje inak.",
      },
    },
    {
      name: "WHT_SADZBA_DIVIDENDY_FO",
      definition: "Sadzba zrážkovej dane pre podiely na zisku vyplatené fyzickej osobe",
      value: "7 % (od 2017-01-01)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 1,
        effective_from: "2017-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Z príjmu uvedeného v §3 ods. 1 písm. e) [podiel na zisku] sa daň vyberá zrážkou vo výške 7 %.",
      },
      effective_periods: [
        { from: "2017-01-01", value: "7 %" },
      ],
    },
    {
      name: "WHT_SADZBA_NESPOLUPRACUJUCE",
      definition:
        "Sadzba zrážkovej dane pre plnenia smerujúce do nespolupracujúcich štátov",
      value: "35 % (od 2014-03-01)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 2,
        effective_from: "2014-03-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Daň sa vyberá zrážkou vo výške 35 % z príjmov plynúcich daňovníkovi nespolupracujúceho štátu.",
      },
    },
    {
      name: "WHT_SPLATNOST_DNI",
      definition:
        "Termín odvodu zrážkovej dane platiteľom — 15. deň nasledujúceho mesiaca",
      value: "15. deň mesiaca nasledujúceho po mesiaci zrazenia",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 11,
        effective_from: "2004-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Platiteľ dane je povinný zrazenú daň odviesť správcovi dane najneskôr do 15. dňa každého mesiaca za predchádzajúci kalendárny mesiac.",
      },
    },
  ],
  execution_order: [
    "S1: Klasifikuj typ plnenia (úrok / licenčné / dividenda FO / dividenda PO).",
    "S2: Over kod_statu a flag je_nespolupracujuci — ak true, override 35 %.",
    "S3: Vyber sadzbu na základe typu a (prípadne) override.",
    "S4: Vypočítaj zrážkovú daň = round_half_up_cents(zaklad × sadzba).",
    "S5: Vypočítaj netto pre príjemcu = zaklad − dan.",
    "S6: Urči termín splatnosti = 15. deň nasledujúceho mesiaca po vyplatení.",
  ],
  logic_flow: [
    {
      id: "S1",
      description: "Klasifikácia typu plnenia",
      pseudocode: `enum TypPlnenia:
    UROK            # úroky z vkladov, dlhopisov
    LICENCNE        # licenčné poplatky, know-how, autorské
    DIVIDENDY_FO    # podiel na zisku vyplatený fyzickej osobe
    DIVIDENDY_PO    # podiel na zisku vyplatený právnickej osobe (zriedkavé)

# Vstupný parameter — konzument klasifikuje pri volaní`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 3,
        effective_from: "2017-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Daňou vyberanou zrážkou sa zdaňujú príjmy uvedené v §3 ods. 1 písm. e), úroky z vkladov, licenčné poplatky a iné.",
      },
    },
    {
      id: "S2",
      description: "Override pre nespolupracujúci štát (§43 ods. 2)",
      pseudocode: `function je_nespolupracujuca_jurisdikcia(kod_statu):
    # MFSR maintains list — Aether/Lex.Oracle does NOT hardcode it
    # Caller must pass flag explicitly
    return input.je_nespolupracujuci == true`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 2,
        effective_from: "2014-03-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Sadzba 35 % sa uplatní z príjmov plynúcich daňovníkovi nespolupracujúceho štátu (zoznam vedie MF SR).",
      },
    },
    {
      id: "S3",
      description: "Výber sadzby",
      pseudocode: `function vyber_sadzbu(typ, je_nespolupracujuci, datum):
    if je_nespolupracujuci:
        return 0.35
    if typ == DIVIDENDY_FO and datum >= 2017-01-01:
        return 0.07
    # ostatné typy: úrok, licenčné, dividenda PO
    return 0.19`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 1,
        effective_from: "2017-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Sadzba dane vyberanej zrážkou je 19 % alebo 7 % (pre podiely na zisku FO).",
      },
    },
    {
      id: "S4",
      description: "Výpočet dane",
      pseudocode: `function vypocet_dane(zaklad, sadzba):
    if zaklad <= 0: return 0
    return round_half_up_cents(zaklad * sadzba)`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§47",
        effective_from: "2004-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote: "Daň sa zaokrúhľuje na eurocenty matematicky (half-up).",
      },
    },
    {
      id: "S5",
      description: "Netto pre príjemcu",
      pseudocode: `netto = zaklad - dan`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 10,
        effective_from: "2004-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Zrazenú daň je platiteľ dane povinný odviesť, príjemcovi vypláca čistú sumu po zrážke.",
      },
    },
    {
      id: "S6",
      description: "Splatnosť",
      pseudocode: `function splatnost(datum_vyplaty):
    next_month_first = first_day_of_next_month(datum_vyplaty)
    return next_month_first + 14 days  # 15. deň`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 11,
        effective_from: "2004-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote: "Najneskôr do 15. dňa každého mesiaca za predchádzajúci kalendárny mesiac.",
      },
    },
  ],
  semantic_mapping: [
    {
      step_id: "S1",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 3,
        effective_from: "2017-01-01",
        quote: "Definícia plnení podliehajúcich zrážkovej dani.",
      },
    },
    {
      step_id: "S2",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 2,
        effective_from: "2014-03-01",
        quote: "Override 35 % pre nespolupracujúce štáty.",
      },
    },
    {
      step_id: "S3",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 1,
        effective_from: "2017-01-01",
        quote: "Sadzby 19 % / 7 %.",
      },
    },
    {
      step_id: "S4",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§47",
        effective_from: "2004-01-01",
        quote: "Zaokrúhlenie na eurocenty.",
      },
    },
    {
      step_id: "S5",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 10,
        effective_from: "2004-01-01",
        quote: "Netto vyplatenie príjemcovi po zrážke.",
      },
    },
    {
      step_id: "S6",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§43",
        odsek: 11,
        effective_from: "2004-01-01",
        quote: "Termín odvodu — 15. deň nasledujúceho mesiaca.",
      },
    },
  ],
  tool: {
    name: "sk-b2b-zrazkova-dan-vypocet",
    description:
      "Vypočíta zrážkovú daň pre jedno plnenie podľa §43 zákona 595/2003. " +
      "Vstupom je základ, typ plnenia, dátum a flag pre nespolupracujúcu jurisdikciu.",
    input_parameters: [
      {
        name: "zaklad",
        type: "number",
        description: "Hrubá suma plnenia pred zrážkou",
        required: true,
        unit: "EUR",
      },
      {
        name: "typ",
        type: "string",
        description: "Typ plnenia",
        required: true,
        enum: ["urok", "licencne", "dividendy-fo", "dividendy-po"] as const,
      },
      {
        name: "datum_vyplaty",
        type: "string",
        description: "Dátum vyplatenia (YYYY-MM-DD) — určuje aplikovateľnú sadzbu",
        required: true,
      },
      {
        name: "je_nespolupracujuci",
        type: "boolean",
        description:
          "True ak prijímateľ je z nespolupracujúceho štátu (override 35 %) — konzument musí overiť voči MFSR zoznamu",
        required: false,
      },
    ],
    calculation_steps: [
      "S1: Klasifikácia typu",
      "S2: Override 35 % ak nespolupracujúci štát",
      "S3: Výber sadzby",
      "S4: Daň = zaklad × sadzba (zaokrúhlené)",
      "S5: Netto = zaklad − daň",
      "S6: Splatnosť 15. deň nasledujúceho mesiaca",
    ],
    audit_trail_template:
      "Zrážková daň {datum_vyplaty} typ={typ}: zaklad={zaklad} EUR × sadzba={sadzba}% = " +
      "{dan} EUR; netto pre príjemcu = {netto} EUR; splatnosť = {splatnost}.",
  },
  verification_cases: [
    {
      id: "VC1_urok_rezident",
      source:
        "FS SR — Pokyn k zrážkovej dani §43, štandardný úrok z bankového vkladu",
      input: {
        zaklad: 1000.0,
        typ: "urok",
        datum_vyplaty: "2026-03-10",
        je_nespolupracujuci: false,
      },
      expected_output: {
        sadzba_pct: 19,
        dan: 190.0,
        netto: 810.0,
        splatnost: "2026-04-15",
      },
      legal_reasoning:
        "Úrok z vkladu rezidenta → štandardná sadzba §43 ods. 1 = 19 %. " +
        "Daň = 1 000 × 0.19 = 190.00 EUR. Netto = 1 000 − 190 = 810.00 EUR. " +
        "Splatnosť = 15. apríl 2026 (15. deň mesiaca po marci — §43 ods. 11).",
    },
    {
      id: "VC2_dividendy_fo",
      source: "FS SR — Pokyn k dividendám FO podľa §3 ods. 1 písm. e), §43 ods. 1",
      input: {
        zaklad: 5000.0,
        typ: "dividendy-fo",
        datum_vyplaty: "2026-06-30",
        je_nespolupracujuci: false,
      },
      expected_output: {
        sadzba_pct: 7,
        dan: 350.0,
        netto: 4650.0,
        splatnost: "2026-07-15",
      },
      legal_reasoning:
        "Podiel na zisku vyplatený FO → sadzba §43 ods. 1 = 7 % (od 2017-01-01). " +
        "Daň = 5 000 × 0.07 = 350.00 EUR. Netto = 4 650.00 EUR. Splatnosť 15. júl 2026.",
    },
    {
      id: "VC3_nespolupracujuci_override",
      source:
        "FS SR — Aplikácia §43 ods. 2 pri plnení do nespolupracujúcej jurisdikcie",
      input: {
        zaklad: 2000.0,
        typ: "licencne",
        datum_vyplaty: "2026-09-15",
        je_nespolupracujuci: true,
      },
      expected_output: {
        sadzba_pct: 35,
        dan: 700.0,
        netto: 1300.0,
        splatnost: "2026-10-15",
      },
      legal_reasoning:
        "Licenčné plnenie do nespolupracujúceho štátu — §43 ods. 2 override = 35 % " +
        "(prebije štandardných 19 %). Daň = 2 000 × 0.35 = 700.00 EUR. Netto = 1 300.00 EUR. " +
        "Splatnosť 15. október 2026.",
    },
  ],
};

export default blueprint;
