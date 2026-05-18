/**
 * Blueprint: SK SZČO Ročné odvodové vyrovnanie
 * Laws: 461/2003 Z.z. (SP) + 580/2004 Z.z. (ZP)
 *
 * Based on the GOLD implementation in Aether.Logic:
 *   packs/sk/src/payroll/szco-vyrovnanie.lisp
 */

import type { Blueprint } from "./types.js";

const URL_461 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/461/";
const URL_580 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/";

const blueprint: Blueprint = {
  id: "sk-szco-annual-settlement",
  title:
    "SK SZČO Ročné odvodové vyrovnanie — SP (461/2003 §138 ods. 2) + ZP (580/2004 §13 ods. 2 + §19)",
  version: "1.0.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Ročné odvodové vyrovnanie pre SZČO (samostatne zárobkovo činnú osobu). " +
    "Po podaní daňového priznania sa vypočíta skutočný mesačný vymeriavací základ " +
    "zo základu dane, zaplateného SP a ZP (§138 ods. 2 / §13 ods. 2 — koeficient 1,486). " +
    "Porovnajú sa skutočné odvody s preddavkami — rozdiel je nedoplatok (> 0) alebo preplatok (< 0). " +
    "SP: delenie vždy /12; ZP: delenie /počet mesiacov SZČO aktivity.",
  legal_acts: [
    {
      act: "461/2003 Z.z.",
      title: "Zákon o sociálnom poistení",
      url: URL_461,
    },
    {
      act: "580/2004 Z.z.",
      title: "Zákon o zdravotnom poistení",
      url: URL_580,
    },
  ],
  interpretation_notes: [
    {
      issue:
        "SP VZ sa vždy delí /12 bez ohľadu na počet mesiacov SZČO aktivity",
      chosen_interpretation:
        "Aj keď SZČO bola aktívna len časť roka (napr. 6 mesiacov), SP vymeriavací základ " +
        "sa vypočíta delením /12 (nie /počet_mesiacov). Dôsledok: SP VZ je rovnaký bez ohľadu " +
        "na dĺžku trvania; mesačný preddavok × počet aktívnych mesiacov = ročné skutočné SP.",
      rationale:
        "§138 ods. 2 písm. a) explicitne hovorí o 'podiele jednej dvanástiny základu dane'. " +
        "Deliteľ je fixný 12 pre SP. ZP naopak §13 ods. 2 nehovorí o dvanástine — VZ sa berie " +
        "za celé rozhodujúce obdobie a mesačný ekvivalent = VZ / počet_mesiacov SZČO.",
    },
    {
      issue:
        "ZP sadzba SZČO — prechodné ustanovenie §38ezk (580/2004) platné 2026–2027",
      chosen_interpretation:
        "Pre roky 2026 a 2027 platí sadzba 16 % (8 % ZTP) podľa §38ezk. " +
        "Pre roky do 2025 (vrátane) platila 14 % (7 % ZTP). " +
        "Od 2028 platí trvalá sadzba 15 % (7,5 % ZTP) podľa §12 ods. 1 písm. c). " +
        "Algoritmus musí vybrať sadzbu podľa roka vyrovnania.",
      rationale:
        "§38ezk 580/2004 prechodné ustanovenie: 'Od 1. januára 2026 do 31. decembra 2027 je sadzba " +
        "poistného podľa § 12 ods. 1 písm. c) pre samostatne zárobkovo činnú osobu 16 % " +
        "z vymeriavacieho základu'. Po uplynutí §38ezk platí §12 ods. 1 písm. c): 15 %.",
    },
    {
      issue:
        "ZD_brutto — základ dane sa zvyšuje späť o zaplatené odvody pred výpočtom VZ",
      chosen_interpretation:
        "Vymeriavací základ = (ZD + zaplatené_SP + zaplatené_ZP) / 1,486 / deliteľ. " +
        "Základ dane (ZD) je ZD znížený o zaplatené odvody (zákon dovoľuje odpočet SP a ZP " +
        "pri výpočte základu dane). Pred výpočtom VZ pre odvody musíme ZD 'hrubovať' " +
        "— prirátame späť zaplatené SP a ZP.",
      rationale:
        "§138 ods. 2 písm. a) 461/2003: 'základ dane... nezníženého o zaplatené poistné na povinné " +
        "verejné zdravotné poistenie, poistné na povinné nemocenské poistenie, poistné na povinné " +
        "dôchodkové poistenie... a koeficientu 1,486'. Analogicky §13 ods. 2 580/2004: " +
        "'ktorý nie je znížený o zaplatené poistné'.",
    },
  ],
  axiomatic_core: [
    {
      name: "SZCO_KOEFICIENT",
      definition: "Koeficient na výpočet vymeriavacieho základu SZČO",
      value: "1.486",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(2) Vymeriavací základ povinne nemocensky poistenej a povinne dôchodkovo poistenej samostatne " +
          "zárobkovo činnej osoby je a) podiel jednej dvanástiny základu dane z príjmov samostatne zárobkovo " +
          "činnej osoby uvedených v § 3 ods. 1 písm. b) a ods. 2 a 3 nezníženého o zaplatené poistné na povinné " +
          "verejné zdravotné poistenie, poistné na povinné nemocenské poistenie, poistné na povinné dôchodkové " +
          "poistenie a príspevky na starobné dôchodkové sporenie, ktoré sa platia spolu s poistným na starobné " +
          "poistenie z povinného dôchodkového poistenia, poistné do rezervného fondu solidarity povinne " +
          "dôchodkovo poistenej samostatne zárobkovo činnej osoby a upraveného o príjmy a výdavky, " +
          "ktoré sa nezahŕňajú do vymeriavacieho základu, a koeficientu 1,486...",
      },
    },
    {
      name: "SP_SZCO_SADZBA",
      definition:
        "Celková sadzba SP pre SZČO = nemocenské 4,4 % + starobné 18 % + invalidné 6 % + rezervný fond 4,75 %",
      value: "0.3315",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§130",
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "[§130 písm. c)] Sadzba poistného na nemocenské poistenie je pre c) povinne nemocensky poistenú " +
          "samostatne zárobkovo činnú osobu 4,4 % z vymeriavacieho základu. " +
          "[§131 ods. 1 písm. c)] Sadzba poistného na starobné poistenie je pre c) povinne dôchodkovo poistenú " +
          "samostatne zárobkovo činnú osobu 18 % z vymeriavacieho základu. " +
          "[§132 písm. c)] Sadzba poistného na invalidné poistenie je pre c) povinne dôchodkovo poistenú " +
          "samostatne zárobkovo činnú osobu 6 % z vymeriavacieho základu. " +
          "[§137 písm. b)] Sadzba poistného do rezervného fondu solidarity je pre b) povinne dôchodkovo poistenú " +
          "samostatne zárobkovo činnú osobu 4,75 % z vymeriavacieho základu.",
      },
    },
    {
      name: "SP_MIN_VZ_KOEFICIENT",
      definition:
        "Minimálny mesačný VZ SP SZČO = 60 % jednej dvanástiny VVZ za rok R-2 (= 50 % priemernej mesačnej mzdy za rok R-2)",
      value: "0.60 × (1/12 × VVZ_R-2)",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 8,
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(8) Minimálny mesačný vymeriavací základ je 60 % jednej dvanástiny všeobecného vymeriavacieho " +
          "základu platného v kalendárnom roku, ktorý dva roky predchádza kalendárnemu roku, za ktorý " +
          "a) povinne nemocensky poistená a povinne dôchodkovo poistená samostatne zárobkovo činná " +
          "osoba, ktorá má vymeriavací základ podľa odseku 2 písm. a), a dobrovoľne nemocensky poistená " +
          "osoba, dobrovoľne dôchodkovo poistená osoba alebo dobrovoľne poistená osoba v nezamestnanosti " +
          "platí poistné...",
      },
    },
    {
      name: "SP_MAX_VZ_KOEFICIENT",
      definition:
        "Maximálny mesačný VZ SP SZČO = 11-násobok jednej dvanástiny VVZ za rok R-2",
      value: "11 × (1/12 × VVZ_R-2)",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 9,
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(9) Maximálny mesačný vymeriavací základ v úhrne je 11-násobok jednej dvanástiny všeobecného " +
          "vymeriavacieho základu platného v kalendárnom roku, ktorý dva roky predchádza kalendárnemu roku, " +
          "za ktorý zamestnanec, povinne nemocensky poistená a povinne dôchodkovo poistená samostatne zárobkovo " +
          "činná osoba a dobrovoľne nemocensky poistená osoba, dobrovoľne dôchodkovo poistená osoba alebo " +
          "dobrovoľne poistená osoba v nezamestnanosti platí poistné.",
      },
      effective_periods: [
        {
          from: "2004-01-01",
          value: "11 × (1/12 × VVZ_R-2)",
          note: "platí nepretržite",
        },
      ],
    },
    {
      name: "ZP_SZCO_SADZBA",
      definition: "Sadzba zdravotného poistenia pre SZČO",
      value: "0.16 (pre 2026–2027); 0.14 (do 2025); 0.15 (od 2028)",
      citation: {
        act: "580/2004 Z.z.",
        paragraph: "§12",
        odsek: 1,
        pismeno: "c",
        effective_from: "2004-01-01",
        url: URL_580,
        quote:
          "(1) Sadzba poistného je pre c) samostatne zárobkovo činnú osobu 15 % z vymeriavacieho základu; " +
          "ak je samostatne zárobkovo činná osoba osoba so zdravotným postihnutím, sadzba poistného je 7,5 % " +
          "z vymeriavacieho základu.",
      },
      effective_periods: [
        {
          from: "2004-01-01",
          to: "2025-12-31",
          value: "0.14",
          note: "14 % (7 % ZTP) — sadzba platná do 31.12.2025",
        },
        {
          from: "2026-01-01",
          to: "2027-12-31",
          value: "0.16",
          note:
            "16 % (8 % ZTP) — prechodné ustanovenie §38ezk 580/2004 účinné od 1.1.2026 do 31.12.2027",
        },
        {
          from: "2028-01-01",
          value: "0.15",
          note:
            "15 % (7,5 % ZTP) — trvalá sadzba §12 ods. 1 písm. c) po uplynutí §38ezk",
        },
      ],
    },
    {
      name: "ZP_MIN_VZ_KOEFICIENT",
      definition:
        "Minimálny základ ZP SZČO = 50 % priemernej mesačnej mzdy za rozhodujúce obdobie",
      value: "0.50 × priemerná_mesačná_mzda_R-2",
      citation: {
        act: "580/2004 Z.z.",
        paragraph: "§13",
        odsek: 10,
        effective_from: "2004-01-01",
        url: URL_580,
        quote:
          "(10) Na účely tohto zákona sa pojmom minimálny základ samostatne zárobkovo činnej osoby " +
          "a poistenca podľa § 11 ods. 2 rozumie 50 % z priemernej mesačnej mzdy.",
      },
    },
  ],
  execution_order: [
    "S1: Validácia vstupov (rok, zaklad_dane, zaplatene_sp, zaplatene_zp, pocet_mesiacov)",
    "S2: ZD_brutto = zaklad_dane + zaplatene_sp + zaplatene_zp (hrubovanie pre §138 ods. 2)",
    "S3: SP VZ raw = ZD_brutto / 1,486 / 12 → zaokrúhliť eurocent nadol",
    "S4: Clamp SP VZ do [sp_min_vz, sp_max_vz]",
    "S5: SP mesačný preddavok = sp_vz_mes × 33,15 % → eurocent nadol",
    "S6: SP ročné skutočné = sp_mes × pocet_mesiacov; SP vyrovnanie = sp_rocne − zaplatene_sp",
    "S7: ZP VZ raw = ZD_brutto / 1,486 / pocet_mesiacov → zaokrúhliť eurocent nadol",
    "S8: Clamp ZP VZ: zp_vz_mes = max(zp_min_vz, zp_vz_zaokr)",
    "S9: ZP mesačný preddavok = zp_vz_mes × zp_sadzba → eurocent nadol",
    "S10: ZP ročné skutočné = zp_mes × pocet_mesiacov; ZP vyrovnanie = zp_rocne − zaplatene_zp",
  ],
  logic_flow: [
    {
      id: "S2",
      description:
        "ZD_brutto — základ dane zvýšený späť o zaplatené odvody (§138 ods. 2: 'nezníženého o zaplatené poistné')",
      pseudocode:
        "ZD_brutto = zaklad_dane + zaplatene_sp + zaplatene_zp\n" +
        "// zaklad_dane je ZD po odpočte SP+ZP v daňovom priznaní\n" +
        "// VZ sa počíta z hrubého ZD (pred odpočtom odvodov)",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(2) Vymeriavací základ povinne nemocensky poistenej a povinne dôchodkovo poistenej samostatne " +
          "zárobkovo činnej osoby je a) podiel jednej dvanástiny základu dane z príjmov... " +
          "nezníženého o zaplatené poistné na povinné verejné zdravotné poistenie, poistné na povinné " +
          "nemocenské poistenie, poistné na povinné dôchodkové poistenie... a koeficientu 1,486...",
      },
    },
    {
      id: "S3",
      description:
        "SP mesačný VZ = ZD_brutto / 1,486 / 12 (vždy /12 pre SP bez ohľadu na počet aktívnych mesiacov)",
      pseudocode:
        "sp_vz_raw = ZD_brutto / 1.486 / 12\n" +
        "sp_vz_zaokr = floor(sp_vz_raw, eurocent)  // eurocent nadol",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 2,
        pismeno: "a",
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(2) Vymeriavací základ... je a) podiel jednej dvanástiny základu dane z príjmov " +
          "samostatne zárobkovo činnej osoby... a koeficientu 1,486...",
      },
      edge_cases: [
        {
          condition: "sp_vz_zaokr < sp_min_vz (rok R, min VZ = 60 % × VVZ_R-2 / 12)",
          behaviour:
            "sp_vz_mes = sp_min_vz (§138 ods. 8 — minimálny mesačný VZ; pre 2026 = 762 EUR, pre 2025 = 700,80 EUR)",
        },
        {
          condition: "sp_vz_zaokr > sp_max_vz (rok R, max VZ = 11 × PM_R-2)",
          behaviour:
            "sp_vz_mes = sp_max_vz (§138 ods. 9 — maximálny mesačný VZ; pre 2026 = 16 764 EUR, pre 2025 = 15 730 EUR)",
        },
      ],
    },
    {
      id: "S4-S6",
      description:
        "SP preddavok a ročné vyrovnanie — sadzba 33,15 %, mesačný preddavok × počet mesiacov",
      pseudocode:
        "sp_mes = floor(sp_vz_mes × 0.3315, eurocent)  // 4,4% + 18% + 6% + 4,75% = 33,15%\n" +
        "sp_rocne = sp_mes × pocet_mesiacov              // ročné skutočné odvody\n" +
        "sp_vyrovnanie = sp_rocne - zaplatene_sp\n" +
        "// > 0 → nedoplatok (SZČO doplatí SP)\n" +
        "// < 0 → preplatok  (SZČO dostane vrátené)",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§130",
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "[§130 písm. c)] Sadzba poistného na nemocenské poistenie je pre c) povinne nemocensky poistenú " +
          "samostatne zárobkovo činnú osobu 4,4 % z vymeriavacieho základu. " +
          "[§131 ods. 1 písm. c)] Sadzba poistného na starobné poistenie je pre c) povinne dôchodkovo poistenú " +
          "samostatne zárobkovo činnú osobu 18 % z vymeriavacieho základu. " +
          "[§132 písm. c)] Sadzba poistného na invalidné poistenie je pre c) povinne dôchodkovo poistenú " +
          "samostatne zárobkovo činnú osobu 6 % z vymeriavacieho základu. " +
          "[§137 písm. b)] Sadzba poistného do rezervného fondu solidarity je pre b) povinne dôchodkovo " +
          "poistenú samostatne zárobkovo činnú osobu 4,75 % z vymeriavacieho základu.",
      },
    },
    {
      id: "S7",
      description:
        "ZP mesačný VZ = ZD_brutto / 1,486 / pocet_mesiacov (ZP delí skutočným počtom mesiacov SZČO aktivity)",
      pseudocode:
        "zp_vz_raw = ZD_brutto / 1.486 / pocet_mesiacov\n" +
        "zp_vz_zaokr = floor(zp_vz_raw, eurocent)  // eurocent nadol",
      citation: {
        act: "580/2004 Z.z.",
        paragraph: "§13",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_580,
        quote:
          "(2) Vymeriavací základ samostatne zárobkovo činnej osoby je vo výške podielu základu " +
          "dane z príjmov fyzických osôb zo zárobkovej činnosti podľa § 10b ods. 1 písm. b) a ods. 2 až 4 " +
          "dosiahnutého v rozhodujúcom období, ktorý nie je znížený o zaplatené poistné na povinné " +
          "verejné zdravotné poistenie, poistné na povinné nemocenské poistenie, poistné na povinné " +
          "dôchodkové poistenie a povinné príspevky na starobné dôchodkové sporenie, ktoré sa platia " +
          "spolu s poistným na povinné dôchodkové poistenie, poistné do rezervného fondu solidarity " +
          "povinne dôchodkovo poistenej samostatne zárobkovo činnej osoby, a koeficientu 1,486.",
      },
      edge_cases: [
        {
          condition:
            "zp_vz_zaokr < zp_min_vz (50 % × priemerná mesačná mzda za rok R-2; pre 2026 = 762 EUR)",
          behaviour:
            "zp_vz_mes = zp_min_vz (§13 ods. 10 — minimálny základ SZČO ZP)",
        },
      ],
    },
    {
      id: "S8-S10",
      description:
        "ZP preddavok a ročné vyrovnanie — sadzba podľa roka (16 % v 2026–2027, 14 % do 2025, 15 % od 2028)",
      pseudocode:
        "zp_sadzba = get_zp_szco_rate(rok)  // temporal: §38ezk pre 2026-2027\n" +
        "zp_mes = floor(zp_vz_mes × zp_sadzba, eurocent)\n" +
        "zp_rocne = zp_mes × pocet_mesiacov\n" +
        "zp_vyrovnanie = zp_rocne - zaplatene_zp\n" +
        "// > 0 → nedoplatok; < 0 → preplatok",
      citation: {
        act: "580/2004 Z.z.",
        paragraph: "§38ezk",
        effective_from: "2026-01-01",
        effective_to: "2027-12-31",
        url: URL_580,
        quote:
          "Od 1. januára 2026 do 31. decembra 2027 je sadzba poistného podľa § 12 ods. 1 " +
          "b) písm. c) pre samostatne zárobkovo činnú osobu 16 % z vymeriavacieho základu; " +
          "ak je samostatne zárobkovo činná osoba osobou so zdravotným postihnutím, sadzba poistného " +
          "je 8 % z vymeriavacieho základu.",
      },
    },
  ],
  semantic_mapping: [
    {
      step_id: "S2",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 2,
        pismeno: "a",
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(2) Vymeriavací základ... je a) podiel jednej dvanástiny základu dane... " +
          "nezníženého o zaplatené poistné na povinné verejné zdravotné poistenie, poistné na povinné " +
          "nemocenské poistenie, poistné na povinné dôchodkové poistenie... a koeficientu 1,486...",
      },
    },
    {
      step_id: "S3",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 2,
        pismeno: "a",
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(2) Vymeriavací základ... je a) podiel jednej dvanástiny základu dane... a koeficientu 1,486...",
      },
    },
    {
      step_id: "S4 (SP min VZ)",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 8,
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(8) Minimálny mesačný vymeriavací základ je 60 % jednej dvanástiny všeobecného vymeriavacieho " +
          "základu platného v kalendárnom roku, ktorý dva roky predchádza kalendárnemu roku, za ktorý " +
          "a) povinne nemocensky poistená a povinne dôchodkovo poistená samostatne zárobkovo činná " +
          "osoba... platí poistné...",
      },
    },
    {
      step_id: "S4 (SP max VZ)",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§138",
        odsek: 9,
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "(9) Maximálny mesačný vymeriavací základ v úhrne je 11-násobok jednej dvanástiny všeobecného " +
          "vymeriavacieho základu platného v kalendárnom roku, ktorý dva roky predchádza kalendárnemu roku, " +
          "za ktorý zamestnanec, povinne nemocensky poistená a povinne dôchodkovo poistená samostatne zárobkovo " +
          "činná osoba... platí poistné.",
      },
    },
    {
      step_id: "S5",
      citation: {
        act: "461/2003 Z.z.",
        paragraph: "§130",
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "[§130 c)] nemocenské SZČO 4,4 %; [§131 ods. 1 c)] starobné SZČO 18 %; " +
          "[§132 c)] invalidné SZČO 6 %; [§137 b)] rezervný fond SZČO 4,75 % = celkom 33,15 %",
      },
    },
    {
      step_id: "S7",
      citation: {
        act: "580/2004 Z.z.",
        paragraph: "§13",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_580,
        quote:
          "(2) Vymeriavací základ samostatne zárobkovo činnej osoby je vo výške podielu základu " +
          "dane... ktorý nie je znížený o zaplatené poistné... a koeficientu 1,486.",
      },
    },
    {
      step_id: "S8 (ZP min VZ)",
      citation: {
        act: "580/2004 Z.z.",
        paragraph: "§13",
        odsek: 10,
        effective_from: "2004-01-01",
        url: URL_580,
        quote:
          "(10) Na účely tohto zákona sa pojmom minimálny základ samostatne zárobkovo činnej osoby " +
          "a poistenca podľa § 11 ods. 2 rozumie 50 % z priemernej mesačnej mzdy.",
      },
    },
    {
      step_id: "S9 (ZP sadzba 2026-2027)",
      citation: {
        act: "580/2004 Z.z.",
        paragraph: "§38ezk",
        effective_from: "2026-01-01",
        effective_to: "2027-12-31",
        url: URL_580,
        quote:
          "Od 1. januára 2026 do 31. decembra 2027 je sadzba poistného podľa § 12 ods. 1 " +
          "písm. c) pre samostatne zárobkovo činnú osobu 16 % z vymeriavacieho základu...",
      },
    },
  ],
  tool: {
    name: "sk-szco-annual-settlement",
    description:
      "Ročné odvodové vyrovnanie SZČO — vypočíta skutočné SP a ZP, porovná so zaplatenými preddavkami " +
      "a vráti nedoplatok (> 0) alebo preplatok (< 0) pre SP aj ZP zvlášť.",
    input_parameters: [
      {
        name: "zaklad_dane",
        type: "number",
        description:
          "Základ dane z príjmov SZČO za rozhodujúce obdobie (EUR). " +
          "Základ po odpočte SP+ZP (tj. základ dane v daňovom priznaní). " +
          "Systém ho hrubuje: ZD_brutto = zaklad_dane + zaplatene_sp + zaplatene_zp.",
        required: true,
        unit: "EUR",
      },
      {
        name: "rok",
        type: "integer",
        description:
          "Rok, za ktorý sa vyrovnanie vykonáva (napr. 2026). Určuje výber sadzieb a VZ limít.",
        required: true,
      },
      {
        name: "zaplatene_sp",
        type: "number",
        description:
          "Celková suma SP zaplatená ako preddavky počas roku (EUR). Výchozí: 0.",
        required: false,
        unit: "EUR",
      },
      {
        name: "zaplatene_zp",
        type: "number",
        description:
          "Celková suma ZP zaplatená ako preddavky počas roku (EUR). Výchozí: 0.",
        required: false,
        unit: "EUR",
      },
      {
        name: "pocet_mesiacov_szco",
        type: "integer",
        description:
          "Počet kalendárnych mesiacov, počas ktorých bola osoba SZČO v danom roku (1–12). " +
          "Ovplyvňuje ZP VZ (delenie) a celkové ročné odvody. SP VZ sa vždy delí /12.",
        required: false,
        unit: "mesiace",
      },
      {
        name: "ztp",
        type: "boolean",
        description:
          "True = osoba so zdravotným postihnutím (ZTP). Znižuje ZP sadzbu na polovicu " +
          "(8 % v 2026–2027, 7 % do 2025, 7,5 % od 2028). SP nie je ovplyvnené.",
        required: false,
      },
    ],
    calculation_steps: [
      "S1: Overenie vstupov — rok ∈ [2004, 9999], zaklad_dane ≥ 0, zaplatene_sp ≥ 0, zaplatene_zp ≥ 0, pocet_mesiacov ∈ [1, 12]",
      "S2: ZD_brutto = zaklad_dane + zaplatene_sp + zaplatene_zp",
      "S3: SP VZ raw = ZD_brutto / 1,486 / 12 → zaokrúhliť eurocent nadol",
      "S4: Clamp SP VZ: sp_vz_mes = max(sp_min_vz, min(sp_vz_zaokr, sp_max_vz))",
      "S5: SP mes = floor(sp_vz_mes × 0,3315 × 100) / 100",
      "S6: SP ročné = SP mes × pocet_mesiacov; SP vyrovnanie = SP ročné − zaplatene_sp",
      "S7: ZP VZ raw = ZD_brutto / 1,486 / pocet_mesiacov → zaokrúhliť eurocent nadol",
      "S8: Clamp ZP VZ: zp_vz_mes = max(zp_min_vz, zp_vz_zaokr)",
      "S9: ZP sadzba = get_temporal_rate(rok, ztp); ZP mes = floor(zp_vz_mes × ZP sadzba × 100) / 100",
      "S10: ZP ročné = ZP mes × pocet_mesiacov; ZP vyrovnanie = ZP ročné − zaplatene_zp",
    ],
    audit_trail_template:
      "SZČO ročné vyrovnanie {rok}:\n" +
      "  Základ dane: {zaklad_dane} EUR; ZD_brutto (+ SP {zaplatene_sp} + ZP {zaplatene_zp}): {zd_brutto} EUR\n" +
      "  SP (461/2003 §138 ods. 2 + §130/§131/§132/§137):\n" +
      "    VZ raw = {zd_brutto} / 1,486 / 12 = {sp_vz_vypoctovy} EUR/mes → po clampe: {sp_vz_mesacny} EUR/mes\n" +
      "    (limity: min {sp_min_vz} EUR, max {sp_max_vz} EUR; §138 ods. 8-9)\n" +
      "    preddavok = {sp_vz_mesacny} × 33,15 % = {sp_mesacny_preddavok} EUR/mes\n" +
      "    skutočné ročné = {sp_mesacny_preddavok} × {pocet_mesiacov} mes = {sp_skutocne_rocne} EUR\n" +
      "    zaplatené preddavky: {zaplatene_sp} EUR → SP vyrovnanie: {sp_vyrovnanie} EUR\n" +
      "  ZP (580/2004 §13 ods. 2 + §12/§38ezk):\n" +
      "    VZ raw = {zd_brutto} / 1,486 / {pocet_mesiacov} = {zp_vz_vypoctovy} EUR/mes → po clampe: {zp_vz_mesacny} EUR/mes\n" +
      "    (min VZ: {zp_min_vz} EUR; §13 ods. 10)\n" +
      "    preddavok = {zp_vz_mesacny} × {zp_sadzba_pct} % = {zp_mesacny_preddavok} EUR/mes\n" +
      "    skutočné ročné = {zp_mesacny_preddavok} × {pocet_mesiacov} mes = {zp_skutocne_rocne} EUR\n" +
      "    zaplatené preddavky: {zaplatene_zp} EUR → ZP vyrovnanie: {zp_vyrovnanie} EUR\n" +
      "  Výsledok: SP {sp_typ} {sp_abs} EUR; ZP {zp_typ} {zp_abs} EUR",
  },
  verification_cases: [
    {
      id: "VC1",
      source:
        "Aether.Logic GOLD test suite (tests/logic-sk/test-payroll-complete.lisp) — " +
        "SZČO plný rok 2026, základ 20 000 EUR, bez preddavkov. " +
        "PM (priemerná mzda) 2024 = 1 524 EUR/mes (zdroj: ŠÚ SR). " +
        "min VZ SP 2026 = 50 % × PM_2024 = 762 EUR; max VZ SP 2026 = 11 × PM_2024 = 16 764 EUR.",
      input: {
        zaklad_dane: 20000.0,
        rok: 2026,
        zaplatene_sp: 0.0,
        zaplatene_zp: 0.0,
        pocet_mesiacov_szco: 12,
        ztp: false,
      },
      expected_output: {
        sp_vymeriavaci_zaklad_mesacny: 1121.57,
        sp_vymeriavaci_zaklad_vypoctovy: 1121.57,
        sp_min_vymeriavaci_zaklad: 762.0,
        sp_max_vymeriavaci_zaklad: 16764.0,
        sp_sadzba: 0.3315,
        sp_mesacny_preddavok: 371.8,
        sp_skutocne_rocne: 4461.6,
        sp_zaplatene: 0.0,
        sp_vyrovnanie: 4461.6,
        zp_vymeriavaci_zaklad_mesacny: 1121.57,
        zp_min_vymeriavaci_zaklad: 762.0,
        zp_sadzba: 0.16,
        zp_mesacny_preddavok: 179.45,
        zp_skutocne_rocne: 2153.4,
        zp_zaplatene: 0.0,
        zp_vyrovnanie: 2153.4,
        pocet_mesiacov_szco: 12,
        typ: "NEDOPLATOK (SP aj ZP)",
      },
      legal_reasoning:
        "ZD_brutto = 20 000 + 0 + 0 = 20 000 EUR.\n" +
        "SP VZ raw (§138 ods. 2 písm. a): 20 000 / 1,486 / 12 = 1 121,57 EUR/mes (eurocent nadol).\n" +
        "min VZ SP (§138 ods. 8): 50 % × PM_2024 (1 524 EUR) = 762 EUR; 1 121,57 > 762 → bez clampu.\n" +
        "SP mes (§130/§131/§132/§137): floor(1 121,57 × 0,3315 × 100)/100 = floor(371,80)/100 × 100 = 371,80 EUR.\n" +
        "SP ročné: 371,80 × 12 = 4 461,60 EUR. SP vyrovnanie = 4 461,60 − 0 = 4 461,60 EUR (nedoplatok).\n" +
        "ZP VZ raw (§13 ods. 2): 20 000 / 1,486 / 12 = 1 121,57 EUR/mes (rovnaké, lebo pocet_mes=12).\n" +
        "min VZ ZP (§13 ods. 10): 50 % × 1 524 = 762 EUR; bez clampu.\n" +
        "ZP sadzba (§38ezk, rok 2026): 16 %. ZP mes = floor(1 121,57 × 0,16 × 100)/100 = 179,45 EUR.\n" +
        "ZP ročné: 179,45 × 12 = 2 153,40 EUR. ZP vyrovnanie = 2 153,40 − 0 = 2 153,40 EUR (nedoplatok).",
    },
    {
      id: "VC2",
      source:
        "Aether.Logic GOLD test suite — minimálny VZ (základ dane 1 000 EUR). " +
        "VZ raw 56,08 EUR < min VZ 762 EUR → clamp na minimum. " +
        "PM 2024 = 1 524 EUR, min VZ = 50 % × 1 524 = 762 EUR.",
      input: {
        zaklad_dane: 1000.0,
        rok: 2026,
        zaplatene_sp: 0.0,
        zaplatene_zp: 0.0,
        pocet_mesiacov_szco: 12,
        ztp: false,
      },
      expected_output: {
        sp_vymeriavaci_zaklad_mesacny: 762.0,
        sp_vymeriavaci_zaklad_vypoctovy: 56.08,
        sp_min_vymeriavaci_zaklad: 762.0,
        sp_mesacny_preddavok: 252.6,
        sp_skutocne_rocne: 3031.2,
        sp_vyrovnanie: 3031.2,
        zp_vymeriavaci_zaklad_mesacny: 762.0,
        zp_min_vymeriavaci_zaklad: 762.0,
        zp_mesacny_preddavok: 121.92,
        zp_skutocne_rocne: 1463.04,
        zp_vyrovnanie: 1463.04,
        typ: "NEDOPLATOK (SP aj ZP) — min VZ uplatnené",
      },
      legal_reasoning:
        "ZD_brutto = 1 000 + 0 + 0 = 1 000 EUR.\n" +
        "SP VZ raw (§138 ods. 2): 1 000 / 1,486 / 12 = 56,08 EUR/mes.\n" +
        "min VZ SP (§138 ods. 8): 762 EUR; 56,08 < 762 → clamp: sp_vz_mes = 762 EUR.\n" +
        "SP mes (§130/§131/§132/§137): floor(762 × 0,3315 × 100)/100 = floor(252,603)/100 × 100 = 252,60 EUR.\n" +
        "SP ročné: 252,60 × 12 = 3 031,20 EUR (nedoplatok).\n" +
        "ZP VZ raw (§13 ods. 2): 1 000 / 1,486 / 12 = 56,08 EUR/mes.\n" +
        "min VZ ZP (§13 ods. 10): 762 EUR; clamp: zp_vz_mes = 762 EUR.\n" +
        "ZP mes (§38ezk 2026): floor(762 × 0,16 × 100)/100 = floor(121,92)/100 × 100 = 121,92 EUR.\n" +
        "ZP ročné: 121,92 × 12 = 1 463,04 EUR (nedoplatok).\n" +
        "Záver: SZČO s nízkym ZD stále platí minimálne odvody z minimálneho VZ — ochrana poistného systému.",
    },
    {
      id: "VC3",
      source:
        "Aether.Logic GOLD test suite — čiastočný rok (6 mesiacov SZČO aktivity). " +
        "SP VZ = /12 (fixné), ZP VZ = /6 → ZP VZ je 2× väčší ako SP VZ.",
      input: {
        zaklad_dane: 20000.0,
        rok: 2026,
        zaplatene_sp: 0.0,
        zaplatene_zp: 0.0,
        pocet_mesiacov_szco: 6,
        ztp: false,
      },
      expected_output: {
        sp_vymeriavaci_zaklad_mesacny: 1121.57,
        sp_mesacny_preddavok: 371.8,
        sp_skutocne_rocne: 2230.8,
        sp_vyrovnanie: 2230.8,
        zp_vymeriavaci_zaklad_mesacny: 2243.15,
        zp_mesacny_preddavok: 358.9,
        zp_skutocne_rocne: 2153.4,
        zp_vyrovnanie: 2153.4,
        pocet_mesiacov_szco: 6,
        typ: "NEDOPLATOK — 6 mesiacov, SP /12 vs ZP /6",
      },
      legal_reasoning:
        "ZD_brutto = 20 000 EUR.\n" +
        "SP VZ raw (§138 ods. 2): 20 000 / 1,486 / 12 = 1 121,57 EUR/mes (SP vždy /12).\n" +
        "SP ročné = 371,80 × 6 = 2 230,80 EUR (len 6 mesiacov aktivity).\n" +
        "ZP VZ raw (§13 ods. 2): 20 000 / 1,486 / 6 = 2 243,15 EUR/mes (ZP delí skutočným počtom mes).\n" +
        "ZP mes (§38ezk 2026, 16 %): floor(2 243,15 × 0,16 × 100)/100 = 358,90 EUR.\n" +
        "ZP ročné = 358,90 × 6 = 2 153,40 EUR.\n" +
        "Záver: ZP VZ pre čiastočný rok je 2× vyšší ako SP VZ (§138 ods. 2: fixný /12 pre SP; " +
        "§13 ods. 2: variabilný /pocet_mesiacov pre ZP). Ročné SP < ročné ZP napriek nižšiemu VZ " +
        "(33,15 % × 6 mes vs 16 % × 6 mes × 2× vyšší VZ).",
    },
  ],
};

export default blueprint;
