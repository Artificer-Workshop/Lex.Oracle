/**
 * Blueprint: SK B2B — Daňové odpisy (§22 – §28 zákona 595/2003)
 *
 * Pokrýva: zaradenie do odpisových skupín (Príloha č. 1, §26), rovnomerné odpisy
 * §27 (s polovičným odpisom v 1. roku §27 ods. 2), zrýchlené odpisy §28
 * (povolené iba pre skupiny 2 a 3), odpisovanie nehmotného majetku §22 ods. 8
 * (max 5 rokov, lineárne).
 */

import type { Blueprint } from "./types.js";

const blueprint: Blueprint = {
  id: "sk-b2b-odpisy",
  title: "SK B2B — Daňové odpisy hmotného a nehmotného majetku (§22-§28 595/2003)",
  version: "1.0.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Výpočet daňových odpisov hmotného majetku §22-§28 zákona 595/2003: 7 odpisových " +
    "skupín (Príloha č. 1) s dobou odpisovania 2–40 rokov, rovnomerné odpisy §27 vrátane " +
    "pomerového odpisu v 1. roku, zrýchlené odpisy §28 (iba skupiny 2 a 3) a odpisy " +
    "nehmotného majetku §22 ods. 8 (max 5 rokov lineárne).",
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
        "Pomerový odpis v 1. roku (§27 ods. 2) — počítaná suma závisí od mesiaca zaradenia.",
      chosen_interpretation:
        "1. rok = (13 − mesiac_zaradenia) / 12 × ročný_odpis. Mesiac zaradenia = mesiac v ktorom bol majetok prvýkrát uvedený do užívania. Január = 1 → faktor 12/12, December = 12 → faktor 1/12.",
      rationale:
        "Aether.Logic rovnomerne.lisp implementuje rovnako. Zákon §27 ods. 2 explicitne hovorí o pomernej časti.",
    },
    {
      issue:
        "Zrýchlené odpisy §28 — od 2015 obmedzené iba na skupiny 2 a 3?",
      chosen_interpretation:
        "Áno, novela 595/2003 účinná od 2015-01-01 obmedzila zrýchlené odpisy iba na skupiny 2 a 3. Pre ostatné skupiny je dostupné iba rovnomerné odpisovanie.",
      rationale:
        "Aether.Logic zrychlene.lisp validuje vstup a vyhodí chybu pre skupiny 0, 1, 4, 5, 6.",
    },
  ],
  axiomatic_core: [
    {
      name: "SKUPINY_ODPISOVANIA",
      definition:
        "Tabuľka odpisových skupín — doba odpisovania v rokoch (Príloha č. 1)",
      value:
        "{0: 2, 1: 4, 2: 6, 3: 8, 4: 12, 5: 20, 6: 40} rokov",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§26",
        odsek: 1,
        effective_from: "2015-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Hmotný majetok sa zatrieďuje do odpisových skupín 0 až 6 podľa Prílohy č. 1, doby odpisovania 2, 4, 6, 8, 12, 20 a 40 rokov.",
      },
    },
    {
      name: "ZRYCHLENE_POVOLENE_SKUPINY",
      definition: "Skupiny pre ktoré je dostupné zrýchlené odpisovanie §28",
      value: "{2, 3} (od 2015-01-01)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§28",
        odsek: 1,
        effective_from: "2015-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Zrýchlené odpisovanie sa použije pre hmotný majetok zaradený v odpisovej skupine 2 alebo 3.",
      },
    },
    {
      name: "ZRYCHLENE_KOEFICIENTY",
      definition:
        "Koeficienty pre zrýchlené odpisovanie: (k1 pre 1. rok, k2 pre ďalšie roky)",
      value: "Skupina 2: k1=6, k2=7; Skupina 3: k1=8, k2=9",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§28",
        odsek: 2,
        effective_from: "2015-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Pre skupinu 2: koeficient pre 1. rok = 6, pre ďalšie roky = 7. " +
          "Pre skupinu 3: 1. rok = 8, ďalšie roky = 9.",
      },
    },
    {
      name: "NEHMOTNY_MAX_ROKOV",
      definition:
        "Maximálna doba odpisovania nehmotného majetku (lineárne podľa §22 ods. 8)",
      value: "5 rokov",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§22",
        odsek: 8,
        effective_from: "2015-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Nehmotný majetok sa odpíše rovnomerne, najviac však počas 5 rokov.",
      },
    },
  ],
  execution_order: [
    "S1: Zaraď majetok do odpisovej skupiny (vstupný parameter, validácia 0–6).",
    "S2: Vyber metódu odpisovania (rovnomerná / zrýchlená) — overenie povolenia §28.",
    "S3: Pre rovnomernú metódu — vypočítaj ročný odpis + 1. rok pomerne.",
    "S4: Pre zrýchlenú metódu — vypočítaj odpis 1. roku a ďalších rokov samostatne.",
    "S5: Pre nehmotný majetok — lineárne s max 5 rokov.",
    "S6: Sčítaj kumulatívne odpisy a vypočítaj zostatkovú cenu (ZC).",
  ],
  logic_flow: [
    {
      id: "S1",
      description: "Zaradenie do odpisovej skupiny a doba odpisovania",
      pseudocode: `function doba_odpisovania(skupina):
    table = {0: 2, 1: 4, 2: 6, 3: 8, 4: 12, 5: 20, 6: 40}
    if skupina not in table: raise InvalidGroup
    return table[skupina]`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§26",
        odsek: 1,
        effective_from: "2015-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote: "Doby odpisovania 2/4/6/8/12/20/40 rokov podľa zaradenia.",
      },
    },
    {
      id: "S2",
      description: "Výber metódy + validácia §28",
      pseudocode: `function vyber_metody(skupina, zvolena_metoda):
    if zvolena_metoda == :zrychlena and skupina not in {2, 3}:
        raise ZrychleneNepovoleneprSkupinu  # §28 ods. 1
    return zvolena_metoda  # default: :rovnomerna`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§28",
        odsek: 1,
        effective_from: "2015-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote: "Zrýchlené odpisovanie iba pre skupiny 2 a 3.",
      },
    },
    {
      id: "S3",
      description: "Rovnomerný odpis §27 (s pomerom v 1. roku)",
      pseudocode: `function rovnomerny_odpis(vstupna_cena, skupina, rok, mesiac_zaradenia):
    doba = doba_odpisovania(skupina)
    rocny_odpis = round_half_up_cents(vstupna_cena / doba)
    if rok == 1:
        # §27 ods. 2 — pomerná časť podľa mesiaca zaradenia
        # január (1) → 12/12, december (12) → 1/12
        faktor = (13 - mesiac_zaradenia) / 12
        return round_half_up_cents(rocny_odpis * faktor)
    elif rok <= doba:
        return rocny_odpis
    else:
        return 0  # plne odpísaný`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§27",
        odsek: 2,
        effective_from: "2004-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "V prvom roku odpisovania sa uplatní len pomerná časť ročného odpisu zodpovedajúca počtu mesiacov.",
      },
      edge_cases: [
        {
          condition: "mesiac_zaradenia = 12 (december)",
          behaviour:
            "Faktor (13−12)/12 = 1/12. Zvyšok ((11/12) × ročný_odpis) sa odpíše v roku doba+1 — odpisovanie sa de facto rozloží na (doba+1) rokov.",
        },
      ],
    },
    {
      id: "S4",
      description: "Zrýchlený odpis §28 (iba skupiny 2 a 3)",
      pseudocode: `function zrychleny_odpis(vstupna_cena, skupina, rok, kumulativne_predchadzajuce):
    # k1 = koeficient 1. roku, k2 = koeficient ďalších rokov
    if skupina == 2: (k1, k2) = (6, 7)
    elif skupina == 3: (k1, k2) = (8, 9)
    else: raise ZrychleneNepovoleneprSkupinu

    if rok == 1:
        return round_half_up_cents(vstupna_cena / k1)
    else:
        zc = vstupna_cena - kumulativne_predchadzajuce  # zostatková cena
        roky_uplynule = rok - 1
        denom = k2 - roky_uplynule
        if denom <= 0 or zc <= 0:
            return 0  # plne odpísaný
        return round_half_up_cents((2 * zc) / denom)`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§28",
        odsek: 2,
        effective_from: "2015-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "V 1. roku: vstupná cena / k1. V ďalších rokoch: (2 × zostatková cena) / (k2 − počet uplynulých rokov).",
      },
    },
    {
      id: "S5",
      description: "Odpisovanie nehmotného majetku §22 ods. 8",
      pseudocode: `function nehmotny_odpis(vstupna_cena, doba_zvolena, rok):
    doba = min(doba_zvolena, 5)  # max 5 rokov §22 ods. 8
    rocny = round_half_up_cents(vstupna_cena / doba)
    if rok <= doba: return rocny
    else: return 0`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§22",
        odsek: 8,
        effective_from: "2015-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote: "Nehmotný majetok rovnomerne, najviac 5 rokov.",
      },
    },
    {
      id: "S6",
      description: "Kumulatívne odpisy a zostatková cena",
      pseudocode: `kumulativne = sum(odpisy_za_vsetky_predchadzajuce_roky)
zostatkova_cena = vstupna_cena - kumulativne
# ZC sa použije v účtovníctve a pri likvidácii / predaji
# Súčet všetkých odpisov za celú dobu sa musí rovnať vstupnej cene (cents-perfect)`,
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§25",
        odsek: 3,
        effective_from: "2004-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/",
        quote:
          "Zostatková cena = vstupná cena znížená o uplatnené odpisy.",
      },
    },
  ],
  semantic_mapping: [
    {
      step_id: "S1",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§26",
        odsek: 1,
        effective_from: "2015-01-01",
        quote: "Odpisové skupiny 0–6 + doba odpisovania.",
      },
    },
    {
      step_id: "S2",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§28",
        odsek: 1,
        effective_from: "2015-01-01",
        quote: "Obmedzenie zrýchlených odpisov na skupiny 2 a 3.",
      },
    },
    {
      step_id: "S3",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§27",
        odsek: 2,
        effective_from: "2004-01-01",
        quote: "Pomerný odpis v 1. roku.",
      },
    },
    {
      step_id: "S4",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§28",
        odsek: 2,
        effective_from: "2015-01-01",
        quote: "Vzorce zrýchleného odpisovania.",
      },
    },
    {
      step_id: "S5",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§22",
        odsek: 8,
        effective_from: "2015-01-01",
        quote: "Nehmotný majetok lineárne max 5 rokov.",
      },
    },
    {
      step_id: "S6",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§25",
        odsek: 3,
        effective_from: "2004-01-01",
        quote: "Zostatková cena.",
      },
    },
  ],
  tool: {
    name: "sk-b2b-odpis-rocny",
    description:
      "Vypočíta ročný daňový odpis hmotného/nehmotného majetku podľa §22-§28. " +
      "Vstupom je vstupná cena, odpisová skupina, metóda, rok odpisovania a mesiac zaradenia.",
    input_parameters: [
      {
        name: "vstupna_cena",
        type: "number",
        description: "Vstupná cena majetku (€)",
        required: true,
        unit: "EUR",
      },
      {
        name: "skupina",
        type: "integer",
        description: "Odpisová skupina 0–6 (Príloha č. 1)",
        required: true,
      },
      {
        name: "metoda",
        type: "string",
        description: "Metóda odpisovania",
        required: true,
        enum: ["rovnomerna", "zrychlena", "nehmotny"] as const,
      },
      {
        name: "rok",
        type: "integer",
        description: "Poradové číslo roku odpisovania (1 = prvý rok)",
        required: true,
      },
      {
        name: "mesiac_zaradenia",
        type: "integer",
        description:
          "Mesiac v ktorom bol majetok uvedený do užívania (1–12) — určuje pomer v 1. roku",
        required: true,
      },
      {
        name: "kumulativne_predchadzajuce",
        type: "number",
        description:
          "Súčet odpisov uplatnených v predchádzajúcich rokoch — povinné pre zrýchlenú metódu od rok 2",
        required: false,
        unit: "EUR",
      },
    ],
    calculation_steps: [
      "S1: Zaradenie + doba",
      "S2: Validácia metódy",
      "S3/S4/S5: Výpočet podľa metódy",
      "S6: ZC = VC − kumulatívne",
    ],
    audit_trail_template:
      "Odpis rok {rok} skupina {skupina} {metoda}: VC={vstupna_cena} EUR → odpis={odpis} EUR " +
      "(kumulatívne {kumulativne}, ZC {zc}).",
  },
  verification_cases: [
    {
      id: "VC1_rovnomerne_skupina1_januar",
      source:
        "Aether.Logic test-depreciation-complete.lisp — rovnomerný odpis skupina 1, január (plný 1. rok)",
      input: {
        vstupna_cena: 12000.0,
        skupina: 1,
        metoda: "rovnomerna",
        rok: 1,
        mesiac_zaradenia: 1,
      },
      expected_output: {
        rocny_odpis: 3000.0,
      },
      legal_reasoning:
        "Skupina 1 → doba 4 roky. Ročný = 12 000 / 4 = 3 000 EUR. " +
        "Mesiac zaradenia 1 (január) → faktor (13−1)/12 = 12/12 = 1. " +
        "Odpis 1. roku = 3 000.00 EUR (plný).",
    },
    {
      id: "VC2_rovnomerne_skupina1_jul",
      source:
        "Aether.Logic test-depreciation-complete.lisp — pomerný odpis v 1. roku §27 ods. 2",
      input: {
        vstupna_cena: 12000.0,
        skupina: 1,
        metoda: "rovnomerna",
        rok: 1,
        mesiac_zaradenia: 7,
      },
      expected_output: {
        rocny_odpis: 1500.0,
      },
      legal_reasoning:
        "Skupina 1 → doba 4 roky, ročný 3 000 EUR. Mesiac zaradenia 7 → faktor (13−7)/12 = 6/12 = 0.5. " +
        "Odpis 1. roku = 3 000 × 0.5 = 1 500.00 EUR (§27 ods. 2).",
    },
    {
      id: "VC3_zrychlene_skupina2_rok2",
      source:
        "Aether.Logic test-depreciation-complete.lisp — zrýchlený odpis skupina 2, 2. rok",
      input: {
        vstupna_cena: 6000.0,
        skupina: 2,
        metoda: "zrychlena",
        rok: 2,
        mesiac_zaradenia: 1,
        kumulativne_predchadzajuce: 1000.0,
      },
      expected_output: {
        rocny_odpis: 1666.67,
      },
      legal_reasoning:
        "Skupina 2: k1=6, k2=7. Rok 1 odpis = 6 000/6 = 1 000 (kumulativne 1 000). " +
        "Rok 2: ZC = 6 000 − 1 000 = 5 000. Odpis = 2 × 5 000 / (7 − 1) = 10 000 / 6 = 1 666.666... " +
        "→ zaokrúhlené half-up na 1 666.67 EUR.",
    },
  ],
};

export default blueprint;
