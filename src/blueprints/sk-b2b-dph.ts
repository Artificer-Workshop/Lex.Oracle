/**
 * Blueprint: SK B2B — Daň z pridanej hodnoty (DPH) podľa zákona 222/2004 Z. z.
 *
 * Pokrýva sadzby §27 (23 % / 19 % / 5 % / 0 % od 2025-01-01), výpočet dane na
 * výstupe §19, odpočet dane §49 (plný/krátený), koeficient §50, reverse-charge
 * (prenos daňovej povinnosti §69) a EU plnenia §43 / §11.
 */

import type { Blueprint } from "./types.js";

const blueprint: Blueprint = {
  id: "sk-b2b-dph",
  title: "SK B2B — Daň z pridanej hodnoty (§19, §27, §49, §50, §69 222/2004 Z. z.)",
  version: "1.0.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Výpočet DPH podľa zákona 222/2004 Z. z. od 2025-01-01: 4 sadzby §27 " +
    "(zákl. 23 %, stredná 19 %, znížená 5 %, nulová 0 %), daň na výstupe §19, " +
    "odpočet dane §49 (plný/krátený), koeficient §50 (ceiling na 2 desatinné), " +
    "reverse-charge §69 (predef. zoznam plnení) a EU intra-community §43/§11 " +
    "(oslobodenie pri platnom IČ DPH odberateľa).",
  legal_acts: [
    {
      act: "222/2004 Z. z.",
      title: "Zákon o dani z pridanej hodnoty",
      url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
    },
  ],
  interpretation_notes: [
    {
      issue:
        "Sadzby 2025+ — kde presne sú definované zákl. 23 %, stredná 19 %, znížená 5 %?",
      chosen_interpretation:
        "§27 ods. 1 (zákl. 23 %) a §27 ods. 2 (znížená 5 % na vybrané plnenia podľa prílohy č. 7) " +
        "v znení účinnom od 2025-01-01. Stredná 19 % je nová tretia úroveň zavedená " +
        "konsolidačným balíčkom pre vybrané reštauračné a podobné služby.",
      rationale:
        "Aether.Logic dph/sadzby.lisp:21-23 explicitne deklaruje rate-table {2025-01-01: " +
        "(zákl 23 %, stred 19 %, zníž 5 %, nul 0 %)}. Source = '222/2004 §27 (konsolidácia 2025)'.",
    },
    {
      issue:
        "Koeficient §50 — zaokrúhľuje sa nahor (ceiling) alebo matematicky?",
      chosen_interpretation:
        "Ceiling na 2 desatinné miesta (vždy nahor). Napr. 0.7501 → 0.76; 0.75 → 0.75.",
      rationale:
        "§50 ods. 4 zákona 222/2004 explicitne hovorí 'zaokrúhli na dve desatinné miesta " +
        "smerom nahor'. Aether.Logic dph/domaci-rezim.lisp implementuje rovnako.",
    },
    {
      issue:
        "Reverse-charge §69 — ktoré plnenia sú v zozname?",
      chosen_interpretation:
        "Predef. zoznam zahŕňa: stavebné práce (§69 ods. 12 písm. j), kovový odpad, " +
        "obchodovanie s emisnými kvótami, mobilné telefóny / integrované obvody pri " +
        "fakturácii ≥ 5 000 EUR, poľnohospodárske plodiny, kovy. Konzument MUSÍ poskytnúť " +
        "klasifikáciu plnenia — Lex.Oracle nedrží KN kódy.",
      rationale:
        "Zoznam je dynamický (zmeny v §69 ods. 12). Blueprint dokumentuje princíp, " +
        "konzument validuje subjekt voči aktuálnemu znutiu §69.",
    },
  ],
  axiomatic_core: [
    {
      name: "DPH_SADZBA_ZAKLADNA",
      definition: "Základná sadzba DPH",
      value: "23 % (od 2025-01-01); 20 % (2011-01-01 až 2024-12-31); 19 % (2004-05-01 až 2010-12-31)",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§27",
        odsek: 1,
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Základná sadzba dane na tovary a služby je 23 % zo základu dane.",
      },
      effective_periods: [
        { from: "2004-05-01", to: "2010-12-31", value: "19 %" },
        { from: "2011-01-01", to: "2024-12-31", value: "20 %" },
        { from: "2025-01-01", value: "23 %", note: "konsolidačný balíček 2025" },
      ],
    },
    {
      name: "DPH_SADZBA_STREDNA",
      definition:
        "Stredná sadzba DPH (od 2025) — vybrané reštauračné a podobné služby",
      value: "19 % (od 2025-01-01)",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§27",
        odsek: 2,
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Znížená sadzba dane vo výške 19 % sa uplatňuje na tovary a služby uvedené v prílohe č. 7a.",
      },
    },
    {
      name: "DPH_SADZBA_ZNIZENA",
      definition:
        "Znížená sadzba DPH na tovary podľa prílohy č. 7 (od 2025 5 %; predtým 10 %)",
      value: "5 % (od 2025-01-01); 10 % (2011-01-01 až 2024-12-31)",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§27",
        odsek: 2,
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Znížená sadzba dane vo výške 5 % sa uplatňuje na tovary uvedené v prílohe č. 7 (knihy, lieky, vybrané potraviny, ubytovanie).",
      },
      effective_periods: [
        { from: "2011-01-01", to: "2024-12-31", value: "10 %" },
        { from: "2025-01-01", value: "5 %" },
      ],
    },
    {
      name: "DPH_SADZBA_NULOVA",
      definition: "Nulová sadzba DPH (oslobodenie s nárokom na odpočet)",
      value: "0 %",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§43",
        effective_from: "2004-05-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Dodanie tovaru do iného členského štátu osobe identifikovanej pre daň v inom členskom štáte je oslobodené od dane.",
      },
    },
    {
      name: "DPH_KOEFICIENT_ZAOKR",
      definition:
        "Spôsob zaokrúhlenia koeficientu §50 (krátený odpočet)",
      value: "ceiling na 2 desatinné miesta (vždy nahor)",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§50",
        odsek: 4,
        effective_from: "2004-05-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Koeficient sa zaokrúhli na dve desatinné miesta smerom nahor.",
      },
    },
  ],
  execution_order: [
    "S1: Klasifikuj plnenie (domáce / EU intra-community / reverse-charge / oslobodené).",
    "S2: Pre domáce — vyber sadzbu §27 podľa datumu a typu plnenia.",
    "S3: Vypočítaj daň na výstupe §19 = zaklad × sadzba (eurocenty, half-up).",
    "S4: Pre odpočet §49 — over plný vs krátený režim podľa charakteru použitia.",
    "S5: Pre krátený — vypočítaj koeficient §50 = obrat_s_narokom / celkovy_obrat (ceiling 2dp).",
    "S6: Pre reverse-charge §69 — daň vyznačí príjemca (na výstupe i odpočet), dodávateľ fakturuje netto.",
    "S7: Pre EU intra-community §43 — dodávka oslobodená pri platnom IČ DPH odberateľa.",
  ],
  logic_flow: [
    {
      id: "S1",
      description: "Klasifikácia typu plnenia",
      pseudocode: `enum TypPlnenia:
    DOMACE              # plnenie v tuzemsku, štandardný režim
    REVERSE_CHARGE      # §69 prenos daňovej povinnosti
    EU_DODANIE          # §43 oslobodené dodanie do EU
    EU_NADOBUDNUTIE     # §11 nadobudnutie z EU (príjemca samovymeria)
    OSLOBODENE_BEZ_ODPOCTU  # §28-§42 oslobodené plnenia bez nároku
    NULOVA_SADZBA       # §43 (vývoz, EU dodanie) — 0 % s nárokom

# Vstupný parameter — konzument klasifikuje pri volaní`,
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§2",
        effective_from: "2004-05-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Predmetom dane sú plnenia uvedené v §2 — dodanie tovaru, dodanie služby, nadobudnutie z EU, dovoz.",
      },
    },
    {
      id: "S2",
      description: "Výber sadzby §27 (temporálny dispatch)",
      pseudocode: `function vyber_sadzbu(typ_sadzby, datum):
    rok = year(datum)
    if rok >= 2025:
        if typ_sadzby == :zakladna: return 0.23
        if typ_sadzby == :stredna: return 0.19  # §27 ods. 2 príloha č. 7a
        if typ_sadzby == :znizena: return 0.05  # príloha č. 7
        if typ_sadzby == :nulova: return 0.00
    elif rok >= 2011:
        if typ_sadzby == :zakladna: return 0.20
        if typ_sadzby == :znizena: return 0.10
        # stredná sa pre 2011-2024 NEEXISTUJE → raise
    elif rok >= 2004:
        if typ_sadzby == :zakladna: return 0.19  # jednotná
        # iné typy 2004-2010 → raise
    raise InvalidSadzba`,
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§27",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Sadzby DPH od 2025-01-01: základná 23 %, stredná 19 %, znížená 5 %, nulová 0 %.",
      },
      edge_cases: [
        {
          condition: "datum < 2004-05-01",
          behaviour: "Pred vstupom SR do EU — mimo rozsahu zákona 222/2004. Validation error.",
        },
        {
          condition: "typ_sadzby = :stredna a rok < 2025",
          behaviour: "Stredná sadzba 19 % existuje IBA od 2025-01-01 — pre staršie obdobia chyba.",
        },
      ],
    },
    {
      id: "S3",
      description: "Daň na výstupe §19",
      pseudocode: `function dan_na_vystupe(zaklad, sadzba):
    if zaklad < 0: raise NegativeBase
    dan_raw = zaklad * sadzba
    return round_half_up_cents(dan_raw)`,
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§19",
        odsek: 1,
        effective_from: "2004-05-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Daňová povinnosť vzniká dňom dodania tovaru alebo služby; daň sa vypočíta zo základu dane príslušnou sadzbou.",
      },
    },
    {
      id: "S4",
      description: "Odpočet dane §49 — plný vs krátený režim",
      pseudocode: `function rezim_odpoctu(pouzitie):
    # pouzitie ∈ {:plne_zdanitelne, :zmiesane, :len_oslobodene_bez_naroku}
    if pouzitie == :plne_zdanitelne:
        return :plny     # 100 % vstupnej dane
    elif pouzitie == :zmiesane:
        return :kraateny # použiť koeficient §50
    else:
        return :ziadny   # 0 % — oslobodené plnenia bez nároku §28-§42`,
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§49",
        odsek: 2,
        effective_from: "2004-05-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Platiteľ môže odpočítať daň, ak tovar alebo službu použije na účely svojich zdaniteľných plnení.",
      },
    },
    {
      id: "S5",
      description: "Koeficient §50 — krátený odpočet",
      pseudocode: `function koeficient(obrat_s_narokom, celkovy_obrat):
    if celkovy_obrat <= 0: raise ZeroTurnover
    raw = obrat_s_narokom / celkovy_obrat
    # §50 ods. 4: ceiling na 2 desatinné
    return ceiling(raw * 100) / 100

function kraateny_odpocet(vstupna_dan, koef):
    return round_half_up_cents(vstupna_dan * koef)`,
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§50",
        odsek: 4,
        effective_from: "2004-05-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Koeficient sa vypočíta ako podiel obratu z plnení s nárokom na odpočet a celkového obratu, zaokrúhli sa na dve desatinné miesta smerom nahor.",
      },
      edge_cases: [
        {
          condition: "Koeficient ≥ 0.95",
          behaviour:
            "§50 ods. 5 — krátený odpočet sa nepočíta, považuje sa za plný (100 %). Konzument volí.",
        },
      ],
    },
    {
      id: "S6",
      description: "Reverse-charge §69 — prenos daňovej povinnosti",
      pseudocode: `function reverse_charge(zaklad, sadzba, typ_plnenia):
    # Dodávateľ: fakturuje BEZ DPH, na faktúre vyznačí "prenos daňovej povinnosti"
    # Príjemca: samovymeria daň + súčasne uplatní odpočet (ak má nárok)
    if typ_plnenia not in PREDEF_REVERSE_LIST:
        raise NotReverseSubject
    dan = round_half_up_cents(zaklad * sadzba)
    return {
        dodavatel_fakturuje: zaklad,        # netto na faktúre
        prijemca_samovymeria_dan: dan,      # daň na výstupe
        prijemca_odpocet: dan,              # ak plný režim
    }`,
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§69",
        odsek: 12,
        effective_from: "2014-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Daňovú povinnosť pri dodaní tovaru alebo služby v tuzemsku je povinný platiť platiteľ — príjemca plnenia, ak ide o stavebné práce, dodanie odpadu z kovov, mobilné telefóny ≥ 5 000 EUR a iné plnenia uvedené v zozname.",
      },
    },
    {
      id: "S7",
      description: "EU intra-community §43 / §11",
      pseudocode: `function eu_dodanie(zaklad, ic_dph_odberatela):
    # §43 ods. 1 — oslobodené, ak odberateľ je identifikovaný pre DPH v inom MŠ
    if not validate_vies(ic_dph_odberatela):
        raise InvalidVATId  # bez platného IČ DPH → sadzba domáca
    return {sadzba: 0, dan: 0, mode: "intra_community_supply"}

function eu_nadobudnutie(zaklad, sadzba_domaca):
    # §11 — nadobúdateľ samovymeria slovenskú daň (na výstupe i odpočet)
    dan = round_half_up_cents(zaklad * sadzba_domaca)
    return {dan_na_vystupe: dan, odpocet: dan}  # ak plný režim`,
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§43",
        odsek: 1,
        effective_from: "2004-05-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/",
        quote:
          "Oslobodené od dane je dodanie tovaru do iného členského štátu nadobúdateľovi, ktorý je identifikovaný pre daň v inom členskom štáte.",
      },
      edge_cases: [
        {
          condition: "IČ DPH odberateľa neplatné v VIES",
          behaviour:
            "Oslobodenie neaplikuje — dodávateľ fakturuje s domácou sadzbou §27.",
        },
      ],
    },
  ],
  semantic_mapping: [
    {
      step_id: "S1",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§2",
        effective_from: "2004-05-01",
        quote: "Predmet dane — klasifikácia plnení.",
      },
    },
    {
      step_id: "S2",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§27",
        effective_from: "2025-01-01",
        quote: "Sadzby 23 / 19 / 5 / 0 %.",
      },
    },
    {
      step_id: "S3",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§19",
        odsek: 1,
        effective_from: "2004-05-01",
        quote: "Vznik daňovej povinnosti.",
      },
    },
    {
      step_id: "S4",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§49",
        odsek: 2,
        effective_from: "2004-05-01",
        quote: "Odpočet — plný vs krátený režim.",
      },
    },
    {
      step_id: "S5",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§50",
        odsek: 4,
        effective_from: "2004-05-01",
        quote: "Koeficient — ceiling 2 dp.",
      },
    },
    {
      step_id: "S6",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§69",
        odsek: 12,
        effective_from: "2014-01-01",
        quote: "Reverse-charge — prenos daňovej povinnosti.",
      },
    },
    {
      step_id: "S7",
      citation: {
        act: "222/2004 Z. z.",
        paragraph: "§43",
        odsek: 1,
        effective_from: "2004-05-01",
        quote: "EU intra-community oslobodenie.",
      },
    },
  ],
  tool: {
    name: "sk-b2b-dph-vypocet",
    description:
      "Vypočíta DPH pre jednu transakciu podľa zákona 222/2004 Z. z. Vstupom je " +
      "základ dane, typ plnenia, typ sadzby a dátum dodania. Vráti daň, sadzbu " +
      "a režim (domáce / reverse-charge / EU).",
    input_parameters: [
      {
        name: "zaklad",
        type: "number",
        description: "Základ dane (€) — fakturovaná suma bez DPH",
        required: true,
        unit: "EUR",
      },
      {
        name: "typ_plnenia",
        type: "string",
        description: "Klasifikácia plnenia",
        required: true,
        enum: [
          "domace",
          "reverse-charge",
          "eu-dodanie",
          "eu-nadobudnutie",
          "oslobodene-bez-naroku",
        ] as const,
      },
      {
        name: "typ_sadzby",
        type: "string",
        description:
          "Typ sadzby §27 (relevantné pre domáce, reverse-charge, eu-nadobudnutie)",
        required: false,
        enum: ["zakladna", "stredna", "znizena", "nulova"] as const,
      },
      {
        name: "datum",
        type: "string",
        description: "Dátum dodania (YYYY-MM-DD) — určuje výber sadzby",
        required: true,
      },
      {
        name: "ic_dph_odberatela",
        type: "string",
        description:
          "IČ DPH odberateľa v inom MŠ (povinné pre eu-dodanie, validuje sa cez VIES)",
        required: false,
      },
    ],
    calculation_steps: [
      "S1: Klasifikácia plnenia",
      "S2: Výber sadzby §27",
      "S3: Daň = zaklad × sadzba (eurocenty)",
      "S4-S5: Režim odpočtu (plný/krátený + koeficient)",
      "S6: Reverse-charge — prenos na príjemcu",
      "S7: EU — oslobodenie/samovymeranie",
    ],
    audit_trail_template:
      "DPH {datum} typ={typ_plnenia} sadzba={sadzba}%: zaklad={zaklad} EUR × " +
      "{sadzba}% = daň {dan} EUR; režim={rezim}.",
  },
  verification_cases: [
    {
      id: "VC1_domace_zakladna_2026",
      source:
        "Aether.Logic accounting/dph/domaci-rezim.lisp — domáce plnenie štandardná sadzba",
      input: {
        zaklad: 1000.0,
        typ_plnenia: "domace",
        typ_sadzby: "zakladna",
        datum: "2026-03-15",
      },
      expected_output: {
        sadzba_pct: 23,
        dan: 230.0,
        suma_s_dph: 1230.0,
      },
      legal_reasoning:
        "Dátum 2026-03-15 → §27 ods. 1 zákl. sadzba 23 % (od 2025-01-01). " +
        "Daň = 1 000 × 0.23 = 230.00 EUR. Suma s DPH = 1 230.00 EUR.",
    },
    {
      id: "VC2_znizena_2026",
      source:
        "Aether.Logic accounting/dph/sadzby.lisp — znížená sadzba 5 % na knihy/lieky",
      input: {
        zaklad: 200.0,
        typ_plnenia: "domace",
        typ_sadzby: "znizena",
        datum: "2026-06-01",
      },
      expected_output: {
        sadzba_pct: 5,
        dan: 10.0,
        suma_s_dph: 210.0,
      },
      legal_reasoning:
        "Plnenie podľa prílohy č. 7 (knihy/lieky) → §27 ods. 2 znížená 5 % od 2025-01-01. " +
        "Daň = 200 × 0.05 = 10.00 EUR.",
    },
    {
      id: "VC3_reverse_charge_stavebne",
      source:
        "Aether.Logic accounting/dph/reverse-charge.lisp — stavebné práce §69 ods. 12 písm. j)",
      input: {
        zaklad: 50000.0,
        typ_plnenia: "reverse-charge",
        typ_sadzby: "zakladna",
        datum: "2026-04-10",
      },
      expected_output: {
        sadzba_pct: 23,
        dan_samovymeria_prijemca: 11500.0,
        dodavatel_fakturuje: 50000.0,
        rezim: "reverse_charge",
      },
      legal_reasoning:
        "Stavebné práce v tuzemsku medzi platiteľmi → §69 ods. 12 písm. j) prenos daňovej " +
        "povinnosti. Dodávateľ fakturuje 50 000 EUR bez DPH; príjemca samovymeria " +
        "50 000 × 0.23 = 11 500.00 EUR a (pri plnom režime) si tú istú sumu odpočíta.",
    },
  ],
};

export default blueprint;
