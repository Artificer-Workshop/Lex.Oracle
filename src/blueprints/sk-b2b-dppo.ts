/**
 * Blueprint: SK B2B — Daň z príjmov právnických osôb (DPPO)
 *
 * Zákon č. 595/2003 Z. z. o dani z príjmov, najmä §15 (sadzby) v znení od
 * 2025-01-01 (konsolidačný balíček, novela 278/2024 Z. z.). Pokrýva 3-pásmovú
 * klasifikáciu daňovníka (mikrodaňovník / štandard / veľký podnik), výpočet
 * základu dane (§17), umorenie daňových strát (§30) a preddavky (§42).
 */

import type { Blueprint } from "./types.js";

const blueprint: Blueprint = {
  id: "sk-b2b-dppo",
  title: "SK B2B — Daň z príjmov právnických osôb (§15 595/2003 Z. z.)",
  version: "1.0.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Výpočet ročnej dane z príjmov právnickej osoby podľa §15 zákona 595/2003 " +
    "v znení od 2025-01-01: mikrodaňovník 10 % (obrat ≤ 60 000 EUR), štandard 21 %, " +
    "veľký podnik 24 % (obrat > 5 000 000 EUR). Zahŕňa základ dane §17, umorenie " +
    "straty §30 (max 50 % ZD, 5 rokov) a klasifikáciu preddavkov §42.",
  legal_acts: [
    {
      act: "595/2003 Z. z.",
      title: "Zákon o dani z príjmov",
      url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
    },
    {
      act: "278/2024 Z. z.",
      title:
        "Novela 595/2003 — konsolidačný balíček 2025 (3-pásmová sadzba DPPO)",
      url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2024/278/",
    },
  ],
  interpretation_notes: [
    {
      issue:
        "Hranica mikrodaňovníka — obrat 60 000 EUR sa posudzuje za zdaňovacie obdobie podľa §2 písm. w).",
      chosen_interpretation:
        "Klasifikuj na základe rocne_prijmy (zdaniteľné príjmy) ZA zdaňovacie obdobie, NIE účtovných výnosov. Zhoduje sa s definíciou §2 písm. w) a metodikou FS SR.",
      rationale:
        "Aether.Logic klasifikuj-dannika rovnako používa zdaniteľné príjmy. Účtovné výnosy môžu zahŕňať pol. mimo §2 písm. w).",
    },
    {
      issue:
        "Umorenie straty §30 — limit 50 % platí na ZD pred odpočtom straty alebo po?",
      chosen_interpretation:
        "Limit 50 % sa počíta z ZD PRED odpočtom straty (t. j. odpočet ≤ 0.5 × ZD_pred).",
      rationale:
        "Inak by limit nikdy nebol binding (ZD po odpočte by automaticky bola ≥ 0.5 × ZD_po). Aether implementuje rovnako.",
    },
  ],
  axiomatic_core: [
    {
      name: "DPPO_SADZBA_STANDARD",
      definition: "Štandardná sadzba DPPO pre právnické osoby",
      value: "21 % (od 2017-01-01)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        pismeno: "b",
        effective_from: "2017-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Sadzba dane zo základu dane zníženého o daňovú stratu pre právnickú osobu je 21 %.",
      },
      effective_periods: [
        { from: "2004-01-01", to: "2012-12-31", value: "19 %" },
        { from: "2013-01-01", to: "2016-12-31", value: "23 %" },
        { from: "2017-01-01", value: "21 %" },
      ],
    },
    {
      name: "DPPO_SADZBA_MIKRO",
      definition:
        "Sadzba DPPO pre mikrodaňovníka (od 2025 obrat ≤ 60 000 EUR; pred 2025 ≤ 49 790 EUR)",
      value: "10 % (od 2025-01-01); 15 % (2020-01-01 až 2024-12-31)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        pismeno: "a",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Sadzba dane zo základu dane zníženého o daňovú stratu vo výške 10 % pre daňovníka, ktorého zdaniteľné príjmy (výnosy) za zdaňovacie obdobie neprevyšujú sumu 60 000 EUR.",
      },
      effective_periods: [
        {
          from: "2020-01-01",
          to: "2024-12-31",
          value: "15 %",
          note: "hranica obratu 49 790 EUR (pôvodne §2 písm. w))",
        },
        {
          from: "2025-01-01",
          value: "10 %",
          note: "hranica zdvihnutá na 60 000 EUR (novela 278/2024)",
        },
      ],
    },
    {
      name: "DPPO_SADZBA_VELKA",
      definition:
        "Sadzba DPPO pre veľkú právnickú osobu (od 2025 obrat > 5 000 000 EUR)",
      value: "24 % (od 2025-01-01)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        pismeno: "b",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Sadzba dane vo výške 24 % pre daňovníka, ktorého zdaniteľné príjmy (výnosy) za zdaňovacie obdobie prevyšujú sumu 5 000 000 EUR.",
      },
      effective_periods: [
        {
          from: "2025-01-01",
          value: "24 %",
          note: "nová tretia kategória (novela 278/2024)",
        },
      ],
    },
    {
      name: "MIKRO_OBRAT_PRAH",
      definition: "Maximálny obrat pre status mikrodaňovníka",
      value: "60 000 EUR (od 2025); 49 790 EUR (do 2024)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§2",
        pismeno: "w",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Mikrodaňovníkom je daňovník, ktorého zdaniteľné príjmy (výnosy) za zdaňovacie obdobie neprevyšujú sumu 60 000 EUR.",
      },
    },
    {
      name: "VELKA_OBRAT_PRAH",
      definition:
        "Minimálny obrat pre klasifikáciu ako veľká právnická osoba so sadzbou 24 %",
      value: "5 000 000 EUR (od 2025-01-01)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        pismeno: "b",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Sadzba 24 % sa uplatní, ak zdaniteľné príjmy (výnosy) prevyšujú 5 000 000 EUR.",
      },
    },
    {
      name: "STRATA_LIMIT_PCT",
      definition: "Maximálny podiel ZD, ktorý možno umoriť stratou v jednom roku",
      value: "50 % (od 2020-01-01)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§30",
        odsek: 1,
        effective_from: "2020-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Od základu dane možno odpočítať daňovú stratu počas najviac piatich bezprostredne po sebe nasledujúcich zdaňovacích období, najviac však do výšky 50 % základu dane.",
      },
    },
    {
      name: "STRATA_OBDOBIE_ROKOV",
      definition: "Maximálny počet rokov pre prenos straty",
      value: "5 rokov",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§30",
        odsek: 1,
        effective_from: "2020-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote: "počas najviac piatich bezprostredne po sebe nasledujúcich zdaňovacích období",
      },
    },
  ],
  execution_order: [
    "S1: Klasifikuj daňovníka (mikro / štandard / veľký) podľa rocne_prijmy a datum.",
    "S2: Vyber správnu sadzbu DPPO podľa klasifikácie + datum.",
    "S3: Vypočítaj ZD pred umorením straty (vstupný parameter).",
    "S4: Aplikuj umorenie straty §30 (najviac 50 % ZD, do 5 rokov).",
    "S5: Vypočítaj daň = max(0, ZD_po_umoreni × sadzba), zaokrúhli na eurocent (half-up).",
    "S6: Klasifikuj režim preddavkov §42 podľa výšky dane.",
  ],
  logic_flow: [
    {
      id: "S1",
      description: "Klasifikácia daňovníka podľa obratu a dátumu",
      pseudocode: `function klasifikuj_dannika(rocne_prijmy, datum):
    if datum < 2025-01-01:
        # 2-pásmový režim (mikro 15 % / štandard 21 %)
        if rocne_prijmy <= 49790: return :mikro
        else: return :standard
    else:
        # 3-pásmový režim od 2025
        if rocne_prijmy <= 60000: return :mikro
        elif rocne_prijmy > 5000000: return :velka
        else: return :standard`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§2",
        pismeno: "w",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Mikrodaňovníkom je daňovník, ktorého zdaniteľné príjmy (výnosy) za zdaňovacie obdobie neprevyšujú sumu 60 000 EUR.",
      },
      edge_cases: [
        {
          condition: "rocne_prijmy presne 60 000.00 EUR (na hranici mikro)",
          behaviour: "Klasifikuj ako :mikro (zákon používa 'neprevyšujú', t. j. ≤).",
        },
        {
          condition: "rocne_prijmy presne 5 000 000.00 EUR",
          behaviour:
            "Klasifikuj ako :standard (24 % platí ak 'prevyšujú', t. j. striktne >).",
        },
      ],
    },
    {
      id: "S2",
      description: "Výber sadzby DPPO podľa klasifikácie a dátumu",
      pseudocode: `function vyber_sadzbu(typ, datum):
    if typ == :mikro:
        if datum >= 2025-01-01: return 0.10
        if datum >= 2020-01-01: return 0.15
    if typ == :velka:  # iba od 2025
        return 0.24
    if typ == :standard:
        if datum >= 2017-01-01: return 0.21
        if datum >= 2013-01-01: return 0.23
        return 0.19  # 2004-2012
    raise InvalidClassification`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Sadzba dane zo základu dane zníženého o daňovú stratu je 10 %, 21 % alebo 24 % v závislosti od kategórie daňovníka.",
      },
    },
    {
      id: "S3",
      description: "Vstup: základ dane pred umorením straty (z účtovníctva po §17)",
      pseudocode: `# Predpokladáme, že vstupný ZD už zahŕňa:
#   - úpravu výsledku hospodárenia (§17 ods. 1)
#   - pripočítateľné/odpočítateľné položky (§17 ods. 19, §19, §21)
#   - presun cez rezervy, opravné položky, atď.
# Tento blueprint NEROBÍ tieto úpravy — sú zodpovednosťou účtovnej vrstvy.
zd_pred = input.zaklad_dane_pred_umorenim`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§17",
        odsek: 1,
        effective_from: "2004-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Pri zisťovaní základu dane sa vychádza u daňovníka účtujúceho v sústave podvojného účtovníctva z výsledku hospodárenia.",
      },
    },
    {
      id: "S4",
      description: "Umorenie daňovej straty §30",
      pseudocode: `function umor_stratu(zd_pred, dostupne_straty):
    # dostupne_straty: list of (rok_vzniku, suma_straty)
    if zd_pred <= 0:
        return zd_pred, 0  # nemozno umorovat keď strata
    max_limit = floor_cents(0.5 * zd_pred)
    # FIFO: najstaršie najprv (do 5 rokov staré)
    pouzite = 0
    for (rok, suma) in sort_by_year(dostupne_straty):
        if rok_aktualny - rok > 5: continue
        zostatok_limit = max_limit - pouzite
        if zostatok_limit <= 0: break
        pouzite += min(suma, zostatok_limit)
    return zd_pred - pouzite, pouzite`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§30",
        odsek: 1,
        effective_from: "2020-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Od základu dane možno odpočítať daňovú stratu počas najviac piatich bezprostredne po sebe nasledujúcich zdaňovacích období, najviac však do výšky 50 % základu dane.",
      },
      edge_cases: [
        {
          condition: "zd_pred ≤ 0 (daňová strata v aktuálnom roku)",
          behaviour:
            "Umorenie sa neaplikuje. Aktuálna strata sa prenáša ako nová položka do dostupne_straty pre ďalších 5 rokov.",
        },
      ],
    },
    {
      id: "S5",
      description: "Výpočet dane a zaokrúhlenie",
      pseudocode: `function vypocet_dppo(zd_po_umoreni, sadzba):
    if zd_po_umoreni <= 0:
        return 0
    dan_raw = zd_po_umoreni * sadzba
    return round_half_up_cents(dan_raw)  # eurocent presnosť`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote: "Daň sa zaokrúhľuje na eurocenty matematicky.",
      },
    },
    {
      id: "S6",
      description: "Klasifikácia režimu preddavkov §42",
      pseudocode: `function rezim_preddavkov(rocna_dan):
    if rocna_dan <= 5000: return :ziadne
    elif rocna_dan <= 16600: return :stvrtrocne  # 1/4 dane
    else: return :mesacne  # 1/12 dane`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§42",
        odsek: 1,
        effective_from: "2014-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Mesačné preddavky platí daňovník, ktorého daň presiahla 16 600 EUR. Štvrťročné preddavky 5 000 EUR až 16 600 EUR.",
      },
    },
  ],
  semantic_mapping: [
    {
      step_id: "S1",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§2",
        pismeno: "w",
        effective_from: "2025-01-01",
        quote: "Definícia mikrodaňovníka — hranica 60 000 EUR.",
      },
    },
    {
      step_id: "S2",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        effective_from: "2025-01-01",
        quote: "Sadzby DPPO 10 % / 21 % / 24 %.",
      },
    },
    {
      step_id: "S3",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§17",
        odsek: 1,
        effective_from: "2004-01-01",
        quote: "Definícia základu dane.",
      },
    },
    {
      step_id: "S4",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§30",
        odsek: 1,
        effective_from: "2020-01-01",
        quote: "Umorenie straty — limit 50 % / 5 rokov.",
      },
    },
    {
      step_id: "S5",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        effective_from: "2025-01-01",
        quote: "Zaokrúhlenie dane na eurocenty.",
      },
    },
    {
      step_id: "S6",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§42",
        odsek: 1,
        effective_from: "2014-01-01",
        quote: "Klasifikácia preddavkov podľa výšky dane.",
      },
    },
  ],
  tool: {
    name: "sk-b2b-dppo-rocna-dan",
    description:
      "Vypočíta ročnú DPPO podľa §15 zákona 595/2003. Vstupom je základ dane pred umorením straty, " +
      "ročné príjmy (pre klasifikáciu), dátum konca zdaňovacieho obdobia a voliteľne dostupné straty.",
    input_parameters: [
      {
        name: "zaklad_dane_pred_umorenim",
        type: "number",
        description: "Základ dane podľa §17 pred odpočtom straty (môže byť záporný)",
        required: true,
        unit: "EUR",
      },
      {
        name: "rocne_prijmy",
        type: "number",
        description: "Zdaniteľné príjmy (výnosy) za zdaňovacie obdobie (§2 písm. w))",
        required: true,
        unit: "EUR",
      },
      {
        name: "datum_konca_obdobia",
        type: "string",
        description: "Dátum konca zdaňovacieho obdobia (YYYY-MM-DD)",
        required: true,
      },
      {
        name: "dostupne_straty",
        type: "array",
        description:
          "Pole objektov {rok_vzniku, suma_straty} pre prenos straty (§30); ak NIL, žiadne umorenie",
        required: false,
      },
    ],
    calculation_steps: [
      "S1: Klasifikácia (mikro / standard / velka)",
      "S2: Výber sadzby",
      "S3: Vstupný ZD",
      "S4: Umorenie straty (max 50 % ZD)",
      "S5: ZD_po × sadzba → eurocenty",
      "S6: Klasifikácia preddavkov",
    ],
    audit_trail_template:
      "DPPO {datum_konca_obdobia}: rocne_prijmy={rocne_prijmy} EUR → typ={typ}, " +
      "sadzba={sadzba} %; ZD_pred={zd_pred} EUR, umorená strata={umorena} EUR → ZD_po={zd_po}; " +
      "daň = {zd_po} × {sadzba}% = {dan} EUR; preddavky = {rezim_preddavkov}.",
  },
  verification_cases: [
    {
      id: "VC1_standard_2025",
      source:
        "FS SR metodika DPPO 2025 — štandardný daňovník, syntetický príklad konsolidačný balíček",
      input: {
        zaklad_dane_pred_umorenim: 100000.0,
        rocne_prijmy: 800000.0,
        datum_konca_obdobia: "2025-12-31",
        dostupne_straty: [],
      },
      expected_output: {
        typ: "standard",
        sadzba_pct: 21,
        zd_po_umoreni: 100000.0,
        rocna_dan: 21000.0,
        rezim_preddavkov: "mesacne",
      },
      legal_reasoning:
        "rocne_prijmy 800 000 EUR > 60 000 (nie je mikro) a ≤ 5 000 000 (nie je veľká) → :standard. " +
        "Sadzba §15 písm. b) = 21 %. Žiadna strata na umorenie → ZD_po = 100 000 EUR. " +
        "Daň = 100 000 × 0.21 = 21 000.00 EUR. Daň > 16 600 EUR → mesačné preddavky (§42 ods. 1).",
    },
    {
      id: "VC2_mikrodannik_2025",
      source:
        "FS SR metodika 2025 — mikrodaňovník po zvýšení limitu na 60 000 EUR (novela 278/2024)",
      input: {
        zaklad_dane_pred_umorenim: 25000.0,
        rocne_prijmy: 55000.0,
        datum_konca_obdobia: "2025-12-31",
        dostupne_straty: [],
      },
      expected_output: {
        typ: "mikro",
        sadzba_pct: 10,
        zd_po_umoreni: 25000.0,
        rocna_dan: 2500.0,
        rezim_preddavkov: "ziadne",
      },
      legal_reasoning:
        "rocne_prijmy 55 000 EUR ≤ 60 000 EUR → :mikro (§2 písm. w) v znení od 2025-01-01). " +
        "Sadzba §15 písm. a) = 10 % od 2025. Daň = 25 000 × 0.10 = 2 500.00 EUR. " +
        "Daň < 5 000 EUR → žiadne preddavky (§42 ods. 1 prvá veta).",
    },
    {
      id: "VC3_velka_so_stratou",
      source:
        "FS SR metodika DPPO 2025 — veľký daňovník + umorenie straty na limite §30",
      input: {
        zaklad_dane_pred_umorenim: 1000000.0,
        rocne_prijmy: 7500000.0,
        datum_konca_obdobia: "2025-12-31",
        dostupne_straty: [{ rok_vzniku: 2022, suma_straty: 800000.0 }],
      },
      expected_output: {
        typ: "velka",
        sadzba_pct: 24,
        umorena_strata: 500000.0,
        zd_po_umoreni: 500000.0,
        rocna_dan: 120000.0,
        rezim_preddavkov: "mesacne",
      },
      legal_reasoning:
        "rocne_prijmy 7 500 000 EUR > 5 000 000 → :velka, sadzba 24 % (§15 písm. b) novela 278/2024). " +
        "Strata 800 000 EUR z 2022 (≤ 5 rokov stará) — limit §30 je 0.5 × 1 000 000 = 500 000 EUR. " +
        "Umor 500 000 EUR, zvyšok 300 000 sa prenesie. ZD_po = 500 000 EUR. " +
        "Daň = 500 000 × 0.24 = 120 000.00 EUR. > 16 600 → mesačné preddavky.",
    },
  ],
};

export default blueprint;
