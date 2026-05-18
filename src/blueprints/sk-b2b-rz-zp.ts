/**
 * Blueprint: SK B2B — Ročné zúčtovanie zdravotného poistenia (RZ ZP)
 *
 * Zákon č. 580/2004 Z. z. §19 (ročné zúčtovanie) + §12, §13a (sadzby) + §38ezk
 * (prechodné zvýšenie sadzby SZČO na 16 % pre 2026-2027). Vypočíta ročnú
 * poistnú povinnosť, porovná s odvodenými preddavkami a určí nedoplatok / preplatok.
 */

import type { Blueprint } from "./types.js";

const blueprint: Blueprint = {
  id: "sk-b2b-rz-zp",
  title: "SK B2B — Ročné zúčtovanie zdravotného poistenia (§19 580/2004 Z. z.)",
  version: "1.0.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Ročné zúčtovanie zdravotného poistenia podľa §19 zákona 580/2004: výpočet " +
    "ročnej poistnej povinnosti zo všetkých vymeriavacích základov (zamestnanec, " +
    "SZČO, dividendy, iné príjmy), porovnanie s odvedenými preddavkami a určenie " +
    "nedoplatku/preplatku. Pokrýva temporálnu sadzbu SZČO: 14 % do 2025, 16 % " +
    "v 2026–2027 (§38ezk prechodné), 15 % od 2028.",
  legal_acts: [
    {
      act: "580/2004 Z. z.",
      title: "Zákon o zdravotnom poistení",
      url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
    },
  ],
  interpretation_notes: [
    {
      issue:
        "Sadzba SZČO 16 % v 2026–2027 — kde presne je legálne ukotvená?",
      chosen_interpretation:
        "Prechodné ustanovenie §38ezk zákona 580/2004 (zavedené konsolidačným balíčkom). Trvalá sadzba §12 je 15 %, ale §38ezk ods. 1 ustanovuje 16 % pre obdobia 2026 a 2027.",
      rationale:
        "Aether.Logic zdravotné-sadzby.lisp explicitne rozlišuje §12 trvalá vs §38ezk prechodná. " +
        "Konzument musí použiť dátum konca obdobia pre výber sadzby.",
    },
    {
      issue:
        "Dividendy — uplatňuje sa nová sadzba 16 % alebo zostáva 14 %?",
      chosen_interpretation:
        "Dividendy podľa §10b zákona 580/2004 zostávajú na 14 % bez ohľadu na §38ezk (ten upravuje LEN sadzbu SZČO).",
      rationale:
        "§38ezk explicitne mení sadzbu §12, NIE §10b. Dividendy sú samostatný režim.",
    },
  ],
  axiomatic_core: [
    {
      name: "ZP_SADZBA_ZAMESTNANEC",
      definition: "Sadzba ZP pre zamestnanca (zrážka zo mzdy)",
      value: "4 %",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§12",
        odsek: 1,
        pismeno: "a",
        effective_from: "2005-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote: "Sadzba poistného pre zamestnanca je 4 % z vymeriavacieho základu.",
      },
    },
    {
      name: "ZP_SADZBA_ZAMESTNAVATEL",
      definition: "Sadzba ZP pre zamestnávateľa",
      value: "11 % (od 2025-01-01)",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§12",
        odsek: 1,
        pismeno: "b",
        effective_from: "2025-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote: "Sadzba poistného pre zamestnávateľa je 11 % z vymeriavacieho základu.",
      },
      effective_periods: [
        { from: "2005-01-01", to: "2024-12-31", value: "10 %" },
        { from: "2025-01-01", value: "11 %", note: "konsolidačný balíček 2025" },
      ],
    },
    {
      name: "ZP_SADZBA_SZCO",
      definition:
        "Sadzba ZP pre SZČO — temporálne pásma: 14 % do 2025, 16 % v 2026–2027 (§38ezk), 15 % od 2028",
      value: "16 % (2026–2027 prechodne, §38ezk)",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§38ezk",
        odsek: 1,
        effective_from: "2026-01-01",
        effective_to: "2027-12-31",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote:
          "Sadzba poistného pre samostatne zárobkovo činnú osobu za obdobia rokov 2026 a 2027 je 16 % z vymeriavacieho základu.",
      },
      effective_periods: [
        { from: "2005-01-01", to: "2024-12-31", value: "14 %" },
        {
          from: "2025-01-01",
          to: "2025-12-31",
          value: "14 %",
          note: "ešte pôvodná §12 sadzba",
        },
        {
          from: "2026-01-01",
          to: "2027-12-31",
          value: "16 %",
          note: "§38ezk prechodné zvýšenie",
        },
        {
          from: "2028-01-01",
          value: "15 %",
          note: "trvalá §12 v platnom znení",
        },
      ],
    },
    {
      name: "ZP_SADZBA_DIVIDENDY",
      definition: "Sadzba ZP na dividendy podľa §10b (nezávislá od §38ezk)",
      value: "14 %",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§10b",
        odsek: 1,
        effective_from: "2011-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote: "Vymeriavací základ z dividend sa zdaňuje sadzbou 14 %.",
      },
    },
    {
      name: "ZP_ZTP_KOEFICIENT",
      definition:
        "Polovičná sadzba pre poistenca so zdravotným postihnutím (§12 ods. 2)",
      value: "0.5 (polovičná sadzba)",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§12",
        odsek: 2,
        effective_from: "2005-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote:
          "Pre osobu so zdravotným postihnutím sa sadzba poistného znižuje na polovicu.",
      },
    },
  ],
  execution_order: [
    "S1: Sumarizuj všetky ročné vymeriavacie základy (zamestnanec, SZČO, dividendy).",
    "S2: Vyber sadzbu pre každý typ základu podľa datum_konca_obdobia.",
    "S3: Vypočítaj ročnú poistnú povinnosť pre každý typ samostatne.",
    "S4: Sčítaj čiastkové povinnosti = celková ročná povinnosť.",
    "S5: Porovnaj s odvedenými preddavkami → určí rozdiel.",
    "S6: Klasifikuj rozdiel: nedoplatok (kladný) / preplatok (záporný) / vyrovnané.",
  ],
  logic_flow: [
    {
      id: "S1",
      description: "Agregácia vymeriavacích základov",
      pseudocode: `vz_zamestnanec = input.rocny_vz_zo_zavislej_cinnosti
vz_szco = input.rocny_vz_szco
vz_dividendy = input.rocny_vz_dividendy
vz_iny = input.rocny_vz_iny  # napr. §10b iné príjmy

# Validácia: VZ ≥ 0
assert all(vz >= 0 for vz in [vz_zamestnanec, vz_szco, vz_dividendy, vz_iny])`,
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§13",
        effective_from: "2005-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote:
          "Vymeriavací základ je súhrn všetkých príjmov, z ktorých sa platí poistné.",
      },
    },
    {
      id: "S2",
      description: "Výber sadzby SZČO podľa dátumu (temporálny dispatch §38ezk)",
      pseudocode: `function sadzba_szco(datum_konca_obdobia):
    rok = year(datum_konca_obdobia)
    if rok <= 2025: return 0.14  # §12 v pôvodnom znení
    if 2026 <= rok <= 2027: return 0.16  # §38ezk prechodné
    return 0.15  # §12 trvalá od 2028

sadzba_zam = 0.04
sadzba_szco_aktualna = sadzba_szco(datum_konca_obdobia)
sadzba_div = 0.14  # §10b nezávislé od §38ezk`,
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§38ezk",
        odsek: 1,
        effective_from: "2026-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote: "Sadzba SZČO 16 % platí pre obdobia rokov 2026 a 2027.",
      },
      edge_cases: [
        {
          condition: "Poistenec ZŤP",
          behaviour:
            "Všetky uvedené sadzby sa násobia koeficientom 0.5 podľa §12 ods. 2 — okrem dividend.",
        },
      ],
    },
    {
      id: "S3",
      description: "Čiastkové ročné povinnosti",
      pseudocode: `koef_ztp = 0.5 if input.je_ztp else 1.0

povinnost_zam = round_half_up_cents(vz_zamestnanec * sadzba_zam * koef_ztp)
povinnost_szco = round_half_up_cents(vz_szco * sadzba_szco_aktualna * koef_ztp)
povinnost_div = round_half_up_cents(vz_dividendy * sadzba_div)  # ZŤP neaplikuje
povinnost_iny = round_half_up_cents(vz_iny * sadzba_zam * koef_ztp)`,
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§19",
        odsek: 1,
        effective_from: "2005-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote:
          "Ročné poistné je súčin vymeriavacieho základu a sadzby poistného.",
      },
    },
    {
      id: "S4",
      description: "Celková ročná povinnosť",
      pseudocode: `rocna_povinnost = povinnost_zam + povinnost_szco + povinnost_div + povinnost_iny`,
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§19",
        odsek: 2,
        effective_from: "2005-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote:
          "Súčet ročných poistných za jednotlivé typy príjmov tvorí celkovú ročnú poistnú povinnosť.",
      },
    },
    {
      id: "S5",
      description: "Rozdiel voči preddavkom",
      pseudocode: `rozdiel = rocna_povinnost - input.odvedene_preddavky_celkom`,
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§19",
        odsek: 5,
        effective_from: "2005-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote:
          "Rozdiel medzi ročným poistným a sumou zaplatených preddavkov je nedoplatok alebo preplatok.",
      },
    },
    {
      id: "S6",
      description: "Klasifikácia rozdielu",
      pseudocode: `function klasifikuj(rozdiel):
    if rozdiel > 0: return :nedoplatok
    if rozdiel < 0: return :preplatok
    return :vyrovnane

# Pozor: rozdiel < 1 EUR sa zvyčajne neuhrádza (§19 ods. 6) — caller decision`,
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§19",
        odsek: 6,
        effective_from: "2005-01-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/",
        quote: "Nedoplatok do 1 EUR poistenec neuhrádza.",
      },
      edge_cases: [
        {
          condition: "|rozdiel| < 1.00 EUR",
          behaviour:
            "Nedoplatok/preplatok pod 1 EUR sa neuhrádza (§19 ods. 6). Blueprint vráti hodnotu a flag 'pod_limitom' — rozhodnutie o úhrade je na konzumentovi.",
        },
      ],
    },
  ],
  semantic_mapping: [
    {
      step_id: "S1",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§13",
        effective_from: "2005-01-01",
        quote: "Vymeriavací základ — agregácia všetkých zdrojov.",
      },
    },
    {
      step_id: "S2",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§38ezk",
        odsek: 1,
        effective_from: "2026-01-01",
        quote: "Sadzba SZČO 16 % pre 2026–2027.",
      },
    },
    {
      step_id: "S3",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§19",
        odsek: 1,
        effective_from: "2005-01-01",
        quote: "Ročné poistné = VZ × sadzba.",
      },
    },
    {
      step_id: "S4",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§19",
        odsek: 2,
        effective_from: "2005-01-01",
        quote: "Súčet čiastkových povinností.",
      },
    },
    {
      step_id: "S5",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§19",
        odsek: 5,
        effective_from: "2005-01-01",
        quote: "Rozdiel voči preddavkom.",
      },
    },
    {
      step_id: "S6",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§19",
        odsek: 6,
        effective_from: "2005-01-01",
        quote: "Nedoplatok/preplatok pod 1 EUR sa neuhrádza.",
      },
    },
  ],
  tool: {
    name: "sk-b2b-rz-zp-vypocet",
    description:
      "Vypočíta ročné zúčtovanie zdravotného poistenia podľa §19 zákona 580/2004. " +
      "Vstupom sú ročné VZ pre jednotlivé typy príjmov, odvedené preddavky a dátum konca obdobia.",
    input_parameters: [
      {
        name: "rocny_vz_zo_zavislej_cinnosti",
        type: "number",
        description: "Ročný VZ zo zamestnaneckého pomeru",
        required: true,
        unit: "EUR",
      },
      {
        name: "rocny_vz_szco",
        type: "number",
        description: "Ročný VZ z podnikania (SZČO)",
        required: true,
        unit: "EUR",
      },
      {
        name: "rocny_vz_dividendy",
        type: "number",
        description: "VZ z dividend (§10b)",
        required: true,
        unit: "EUR",
      },
      {
        name: "rocny_vz_iny",
        type: "number",
        description: "Iné VZ (napr. §10b ostatné)",
        required: false,
        unit: "EUR",
      },
      {
        name: "odvedene_preddavky_celkom",
        type: "number",
        description: "Súčet všetkých odvedených preddavkov za rok",
        required: true,
        unit: "EUR",
      },
      {
        name: "datum_konca_obdobia",
        type: "string",
        description: "YYYY-MM-DD — určuje výber sadzby (§12 vs §38ezk)",
        required: true,
      },
      {
        name: "je_ztp",
        type: "boolean",
        description: "True ak poistenec má ZŤP (sadzby × 0.5, okrem dividend)",
        required: false,
      },
    ],
    calculation_steps: [
      "S1: Agregácia VZ",
      "S2: Výber sadzieb (temporálne)",
      "S3: Čiastkové povinnosti",
      "S4: Celková ročná povinnosť",
      "S5: Rozdiel voči preddavkom",
      "S6: Klasifikácia (nedoplatok / preplatok / vyrovnané)",
    ],
    audit_trail_template:
      "RZ ZP {datum_konca_obdobia}: VZ_zam={vz_zam}×{sad_zam}% + VZ_szco={vz_szco}×{sad_szco}% + " +
      "VZ_div={vz_div}×14% = {rocna_povinnost} EUR; preddavky {preddavky} EUR; " +
      "rozdiel {rozdiel} EUR → {klasifikacia}.",
  },
  verification_cases: [
    {
      id: "VC1_szco_2026_nedoplatok",
      source:
        "Aether.Logic tests/logic-sk/test-rz-zp-complete.lisp — SZČO 2026 s 16 % §38ezk",
      input: {
        rocny_vz_zo_zavislej_cinnosti: 0,
        rocny_vz_szco: 30000.0,
        rocny_vz_dividendy: 0,
        rocny_vz_iny: 0,
        odvedene_preddavky_celkom: 4000.0,
        datum_konca_obdobia: "2026-12-31",
        je_ztp: false,
      },
      expected_output: {
        sadzba_szco_pct: 16,
        rocna_povinnost: 4800.0,
        rozdiel: 800.0,
        klasifikacia: "nedoplatok",
      },
      legal_reasoning:
        "datum_konca_obdobia 2026-12-31 → sadzba SZČO §38ezk = 16 %. " +
        "Povinnosť = 30 000 × 0.16 = 4 800.00 EUR. Preddavky 4 000 → rozdiel +800 EUR → nedoplatok (§19 ods. 5).",
    },
    {
      id: "VC2_kombinacia_szco_dividendy_2026",
      source:
        "Aether.Logic tests/logic-sk/test-rz-zp-complete.lisp — SZČO + dividendy 2026, kontrola separácie sadzieb",
      input: {
        rocny_vz_zo_zavislej_cinnosti: 0,
        rocny_vz_szco: 25000.0,
        rocny_vz_dividendy: 5000.0,
        rocny_vz_iny: 0,
        odvedene_preddavky_celkom: 4500.0,
        datum_konca_obdobia: "2026-12-31",
        je_ztp: false,
      },
      expected_output: {
        povinnost_szco: 4000.0,
        povinnost_dividendy: 700.0,
        rocna_povinnost: 4700.0,
        rozdiel: 200.0,
        klasifikacia: "nedoplatok",
      },
      legal_reasoning:
        "SZČO časť: 25 000 × 0.16 = 4 000.00 (§38ezk). Dividendy: 5 000 × 0.14 = 700.00 EUR (§10b — " +
        "§38ezk sa NEAPLIKUJE na dividendy). Spolu 4 700.00 EUR. Rozdiel = 4 700 − 4 500 = +200 EUR → nedoplatok.",
    },
    {
      id: "VC3_szco_2028_navrat_15pct",
      source:
        "Aether.Logic zdravotné-sadzby.lisp — návrat na trvalú sadzbu §12 (15 %) po expirovaní §38ezk",
      input: {
        rocny_vz_zo_zavislej_cinnosti: 0,
        rocny_vz_szco: 30000.0,
        rocny_vz_dividendy: 0,
        rocny_vz_iny: 0,
        odvedene_preddavky_celkom: 4500.0,
        datum_konca_obdobia: "2028-12-31",
        je_ztp: false,
      },
      expected_output: {
        sadzba_szco_pct: 15,
        rocna_povinnost: 4500.0,
        rozdiel: 0.0,
        klasifikacia: "vyrovnane",
      },
      legal_reasoning:
        "datum_konca 2028-12-31 → §38ezk vypršal, vracia sa trvalá §12 = 15 %. " +
        "Povinnosť = 30 000 × 0.15 = 4 500.00 EUR. Rozdiel = 0 → vyrovnané.",
    },
  ],
};

export default blueprint;
