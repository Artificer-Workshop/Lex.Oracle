/**
 * Blueprint: SK Ročné zúčtovanie — §38 zákona 595/2003
 *
 * Jurisdiction:  SK
 * Topic:         Ročné zúčtovanie preddavkov na daň z príjmov zo závislej činnosti
 * Legal acts:    Zákon NR SR 595/2003 Z. z. (Daň z príjmov) — §5, §11, §15, §33, §35, §38, §47
 *                Zákon NR SR 601/2003 Z. z. (Životné minimum) — §2
 *
 * Scope: zamestnanec, ročné zúčtovanie preddavkov (nie SZČO, nie daňové priznanie §32).
 * Out of scope: SZČO (§32), nerezidenti bez 90% SR podmienky, §33a (hypotekárny bonus),
 *               zamestnanecká prémia §32a.
 */

import type { Blueprint } from "./types.js";

const URL_595 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/";
const URL_601 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/601/";

const blueprint: Blueprint = {
  id: "sk-annual-tax-reconciliation",
  title: "SK Ročné zúčtovanie preddavkov na daň zo závislej činnosti — §38",
  version: "1.0.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Algoritmus ročného zúčtovania preddavkov na daň z príjmov zamestnanca (§38 zákona 595/2003). " +
    "Agreguje 12 mesiacov zdaniteľných príjmov, SP a ZP odvodov a zaplatených preddavkov. " +
    "Aplikuje ročné nezdaniteľné časti základu dane: NČZD na daňovníka (§11 ods. 2, 21× ŽM), " +
    "NČZD na manžela/manželku (§11 ods. 3, 19,2× ŽM), DDS/PEPP príspevky (§11 ods. 8, max 180 EUR). " +
    "Vypočíta ročnú daň 4-pásmovou sadzbou (§15), uplatní daňový bonus na deti (§33). " +
    "Výsledok: PREPLATOK (zamestnávateľ vráti) alebo NEDOPLATOK (zamestnanec doplatí).",

  legal_acts: [
    {
      act: "595/2003 Z. z.",
      title: "Zákon o dani z príjmov",
      url: URL_595,
    },
    {
      act: "601/2003 Z. z.",
      title: "Zákon o životnom minime",
      url: URL_601,
    },
  ],

  interpretation_notes: [
    {
      issue:
        "NČZD na daňovníka (§11 ods. 2) pri ročnom zúčtovaní sa počíta z ROČNÉHO základu dane, " +
        "nie zo súčtu mesačných NČZD. Výsledok môže byť iný ako 12 × mesačná NČZD pre príjmy " +
        "nad prahovú hodnotu 91,8 × ŽM (fázové znižovanie).",
      chosen_interpretation:
        "Ročná NČZD = max(0, 21×ŽM) pre ZD ≤ 91,8×ŽM; " +
        "= max(0, 51,6×ŽM − ZD/3) pre ZD > 91,8×ŽM. " +
        "ŽM = životné minimum k 1. januáru zdaňovacieho roka.",
      rationale:
        "§11 ods. 2 zákona 595/2003: explicitná formula pre obidva prípady. " +
        "Aether.Logic compute-nczd-dannik-rocne presne implementuje toto rozlíšenie.",
    },
    {
      issue:
        "NČZD na manžela/manželku (§11 ods. 3) je podmienená ročným základom dane daňovníka " +
        "(nie mesačným) a príjmom manžela/manželky. Nie je dostupná pri mesačných preddavkoch. " +
        "Ak podmienky (starostlivosť o dieťa, ÚP, ŤZP) trvali len časť roka, " +
        "maximálna suma sa kráti o 1/12 za každý mesiac bez splnenia podmienok (§11 ods. 3).",
      chosen_interpretation:
        "NČZD na manžela sa uplatňuje len pri ročnom zúčtovaní. " +
        "Pre ZD ≤ 154,8×ŽM: NČZD_max_ročná = 19,2×ŽM; " +
        "pre ZD > 154,8×ŽM: NČZD_max_ročná = max(0, 70,8×ŽM − ZD/3). " +
        "Krátenie: NČZD_max = NČZD_max_ročná × (pocet_mesiacov_manzel / 12). " +
        "NČZD_manžel = max(0, NČZD_max − príjem_manžela).",
      rationale:
        "§11 ods. 3 zákona 595/2003: explicitná formula s dvoma pásmami. " +
        "Nerezident bez 90% SR príjmovej podmienky nemôže uplatniť NČZD na manžela (§11 ods. 7).",
    },
    {
      issue:
        "Daňový bonus §33 pri ročnom zúčtovaní: od 2025-01-01 sú sumy 100 EUR (dieťa do 15) " +
        "a 50 EUR (dieťa 15–25 rokov). Bonus je obmedzený percentom ročného ZD (§33 ods. 6).",
      chosen_interpretation:
        "Ročný bonus = počet_do_15 × 1200 + počet_15_25 × 600 EUR. " +
        "Obmedzenie §33 ods. 6: bonus ≤ percentuálny_limit × rocny_zd (= ČZD PRED odpočtom NČZD; " +
        "29%/36%/43%/50%/57%/64% pre 1/2/3/4/5/6+ detí). " +
        "Ak bonus > daň → bonus-preplatok, daňová povinnosť = 0.",
      rationale:
        "§33 ods. 1 a ods. 6 zákona 595/2003. Tabuľka percentuálnych limitov v §33 ods. 6. " +
        "Percentuálna základňa = čiastkový základ dane (§5 ods. 8) PRED odpočtom NČZD — nie zd_po_nczd.",
    },
    {
      issue:
        "DDS/PEPP príspevky (§11 ods. 8): odpočet príspevkov na doplnkové dôchodkové sporenie " +
        "a PEPP zaplatených zamestnancom — maximálne 180 EUR ročne.",
      chosen_interpretation:
        "NČZD_DDS = min(180, skutočne zaplatené príspevky). " +
        "Len príspevky platené priamo zamestnancom (nie zamestnávateľom).",
      rationale:
        "§11 ods. 8 zákona 595/2003: 'príspevky na doplnkové dôchodkové sporenie... najviac 180 eur'.",
    },
  ],

  axiomatic_core: [
    {
      name: "RZ_NCZD_DANNIK",
      definition:
        "Ročná nezdaniteľná časť základu dane na daňovníka (§11 ods. 2 zákona 595/2003). " +
        "Závisí od ročného ZD daňovníka. ŽM = životné minimum k 1. januáru zdaňovacieho roka.",
      value:
        "ZD ≤ 91,8×ŽM: NČZD = 21×ŽM | ZD > 91,8×ŽM: NČZD = max(0, 51,6×ŽM − ZD/3)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Ak daňovník v príslušnom zdaňovacom období dosiahne základ dane, ktorý " +
          "a) sa rovná alebo je nižší ako 91,8-násobok sumy životného minima platného k 1. januáru " +
          "príslušného zdaňovacieho obdobia, nezdaniteľná časť základu dane ročne na daňovníka je " +
          "suma zodpovedajúca 21,0-násobku sumy životného minima platného k 1. januáru príslušného " +
          "zdaňovacieho obdobia; " +
          "b) je vyšší ako 91,8-násobok platného životného minima, nezdaniteľná časť základu dane " +
          "ročne na daňovníka je suma zodpovedajúca rozdielu 51,6-násobku platného životného minima " +
          "a jednej tretiny základu dane; ak táto suma je nižšia ako nula, nezdaniteľná časť základu " +
          "dane ročne na daňovníka sa rovná nule.",
      },
      effective_periods: [
        { from: "2024-01-01", to: "2024-12-31", value: "max: 5 750,88 EUR (21×268,88; ŽM 2024-01-01=268,88 EUR)" },
        { from: "2025-01-01", to: "2025-12-31", value: "max: 5 753,79 EUR (21×273,99; ŽM 2025-01-01=273,99 EUR)" },
        { from: "2026-01-01", value: "max: 5 966,73 EUR (21×284,13; ŽM 2026-01-01=284,13 EUR — Opatrenie MPSVR SR 168/2025 Z. z.)" },
      ],
    },
    {
      name: "RZ_NCZD_MANZEL",
      definition:
        "Ročná nezdaniteľná časť základu dane na manžela/manželku (§11 ods. 3 zákona 595/2003). " +
        "Podmienka: manžel/manželka spĺňa podmienky §11 ods. 4 (starostlivosť o dieťa atď.).",
      value:
        "ZD ≤ 154,8×ŽM: NČZD_manžel = max(0, 19,2×ŽM − príjem_manžela) | " +
        "ZD > 154,8×ŽM: NČZD_manžel = max(0, 70,8×ŽM − ZD/3 − príjem_manžela)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 3,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Ak daňovník v príslušnom zdaňovacom období dosiahne základ dane " +
          "a) rovnajúci sa alebo nižší ako 154,8-násobok platného životného minima a jeho manželka " +
          "(manžel) žijúca s daňovníkom v domácnosti v tomto zdaňovacom období " +
          "1. nemá vlastný príjem, nezdaniteľná časť základu dane ročne na manželku (manžela) je " +
          "suma zodpovedajúca 19,2-násobku platného životného minima, " +
          "2. má vlastný príjem nepresahujúci sumu zodpovedajúcu 19,2-násobku platného životného " +
          "minima, nezdaniteľná časť základu dane ročne na manželku (manžela) je rozdiel medzi " +
          "sumou zodpovedajúcou 19,2-násobku platného životného minima a vlastným príjmom manželky (manžela)",
      },
      effective_periods: [
        { from: "2025-01-01", value: "max: 5 260,61 EUR (19,2×273,99; pri príjme manžela = 0)" },
      ],
    },
    {
      name: "RZ_NCZD_DDS",
      definition:
        "Nezdaniteľná časť základu dane — príspevky na doplnkové dôchodkové sporenie " +
        "(DDS) a PEPP (§11 ods. 8 zákona 595/2003). Maximum 180 EUR ročne.",
      value: "min(180, zaplatené_príspevky_DDS_PEPP)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 8,
        effective_from: "2013-01-01",
        url: URL_595,
        quote:
          "Od základu dane možno odpočítať príspevky zaplatené daňovníkom na doplnkové dôchodkové " +
          "sporenie podľa osobitného predpisu a na celoeurópsky osobný penzijný produkt podľa " +
          "osobitného predpisu v úhrne najviac 180 eur za zdaňovacie obdobie.",
      },
      effective_periods: [
        { from: "2013-01-01", value: "max. 180 EUR/rok (stabilné)" },
      ],
    },
    {
      name: "RZ_TAX_ANNUAL",
      definition:
        "Ročná daň zo základu dane po NČZD (§15 + §47 zákona 595/2003). " +
        "4-pásmová progresívna sadzba, hranice v násobkoch ŽM.",
      value:
        "Do 2025-12-31 (2-pásmová): 19 % do 176,8×ŽM/rok | 25 % nad 176,8×ŽM. " +
        "Od 2026-01-01 (4-pásmová, novela 309/2023): " +
        "19 % do 154,8×ŽM | 25 % od 154,8× do 212,4× | 30 % od 212,4× do 264× | 35 % nad 264×ŽM",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        effective_from: "2026-01-01",
        url: URL_595,
        quote:
          "Sadzba dane je, okrem § 15a, § 43 a 44, pre fyzickú osobu 1. zo základu dane zisteného " +
          "podľa § 4 ods. 1 písm. a): " +
          "1a. 19 % z tej časti základu dane, ktorá nepresiahne 154,8-násobok sumy platného životného minima vrátane, " +
          "1b. 25 % z tej časti základu dane, ktorá presiahne 154,8-násobok sumy platného životného minima " +
          "a nepresiahne 212,4-násobok sumy platného životného minima vrátane, " +
          "1c. 30 % z tej časti základu dane, ktorá presiahne 212,4-násobok sumy platného životného minima " +
          "a nepresiahne 264-násobok sumy platného životného minima vrátane, " +
          "1d. 35 % z tej časti základu dane, ktorá presiahne 264-násobok sumy platného životného minima.",
      },
      effective_periods: [
        {
          from: "2013-01-01",
          to: "2025-12-31",
          value: "2-pásmová: 19 % do 176,8×ŽM | 25 % nad 176,8×ŽM",
        },
        {
          from: "2026-01-01",
          value: "4-pásmová (novela 309/2023): 19/25/30/35 % pri 154,8/212,4/264×ŽM",
        },
      ],
    },
    {
      name: "RZ_DANOVY_BONUS",
      definition:
        "Ročný daňový bonus na vyživované deti (§33 zákona 595/2003). " +
        "Obmedzený percentom ročného ZD podľa počtu detí (§33 ods. 6).",
      value:
        "dieťa ≤ 15 r.: 1 200 EUR/rok (100 EUR/mes) | dieťa 15–18/25 r.: 600 EUR/rok (50 EUR/mes) od 2025",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§33",
        odsek: 1,
        effective_from: "2025-01-01",
        url: URL_595,
        quote:
          "Daňovník, ktorý v zdaňovacom období dosiahol zdaniteľné príjmy podľa § 5 alebo § 6 ods. 1 a 2, " +
          "si môže uplatniť daňový bonus na každé vyživované dieťa žijúce v domácnosti s daňovníkom, " +
          "pričom suma daňového bonusu, o ktorú sa znižuje daň, je " +
          "a) 50 eur mesačne, ak vyživované dieťa dovŕšilo 15 rokov veku a nedovŕšilo 18 rokov veku, " +
          "a to poslednýkrát za kalendárny mesiac, v ktorom dieťa dovŕši 18 rokov veku, alebo " +
          "b) 100 eur mesačne, ak vyživované dieťa nedovŕšilo 15 rokov veku, a to poslednýkrát " +
          "za kalendárny mesiac, v ktorom dieťa dovŕši 15 rokov veku.",
      },
      effective_periods: [
        { from: "2024-01-01", to: "2024-12-31", value: "≤15 r.: 1 680 EUR/rok (140/mes) | 15–18 r.: 600 EUR/rok (50/mes)" },
        { from: "2025-01-01", value: "≤15 r.: 1 200 EUR/rok (100/mes) | 15–25 r. (študent): 600 EUR/rok (50/mes)" },
      ],
    },
  ],

  execution_order: [
    "STEP_R1: Overenie vstupov; určenie zdaňovacieho roka z datum_do.",
    "STEP_R2: Agregácia: Σpríjmy, ΣSP, ΣZP, Σpreddavky zo vstupných mesiacov.",
    "STEP_R3: Ročný základ dane = max(0, Σpríjmy − ΣSP − ΣZP). §5 ods. 8 + §38 ods. 4.",
    "STEP_R4: NČZD na daňovníka — §11 ods. 2 (závisí od ročného ZD a ŽM_1jan).",
    "STEP_R5: NČZD na manžela/manželku — §11 ods. 3 (voliteľná, závisí od ZD a príjmu manžela).",
    "STEP_R6: NČZD DDS/PEPP — §11 ods. 8 (min(180, zaplatené); voliteľné).",
    "STEP_R7: Základ dane po NČZD = max(0, ZD − NČZD_celkom).",
    "STEP_R8: Ročná daň = 4-pásmová sadzba §15 aplikovaná na ZD_po_NČZD.",
    "STEP_R9: Daňový bonus §33 — ročný (počet detí × mesačné sumy × 12). Obmedzenie §33 ods. 6: limit % × rocny_zd (ČZD pred NČZD).",
    "STEP_R10: Dan_po_bonuse = max(0, daň − bonus). Bonus_preplatok = max(0, bonus − daň).",
    "STEP_R11: Vyrovnanie = Σpreddavky − dan_po_bonuse. Kladné = PREPLATOK, záporné = NEDOPLATOK.",
  ],

  logic_flow: [
    {
      id: "R2",
      description: "Agregácia ročných súm z mesačných záznamov",
      pseudocode: `
function agregujRok(mesiace):
    # mesiace: zoznam max 12 plistov s kľúčmi:
    #   :zdanitelny-prijem — zdaniteľný príjem daného mesiaca
    #   :sp-zamestnanec    — SP zamestnanca zrazené v danom mesiaci
    #   :zp-zamestnanec    — ZP zamestnanca zrazené v danom mesiaci
    #   :preddavok         — preddavok na daň zrazený v danom mesiaci (môže byť záporný)

    prijem-celkom   = sum(m[:zdanitelny-prijem] for m in mesiace)
    sp-celkom       = sum(m[:sp-zamestnanec]    for m in mesiace)
    zp-celkom       = sum(m[:zp-zamestnanec]    for m in mesiace)
    preddavky-spolu = sum(m[:preddavok]         for m in mesiace)  # záporné preddavky (bonusové mesiace) sú OK

    return {prijem-celkom, sp-celkom, zp-celkom, preddavky-spolu}
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§38",
        odsek: 4,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Zamestnávateľ, ktorý je platiteľom dane, vykoná výpočet dane a súčasne prihliadne " +
          "na príjmy oslobodené od dane, pri ktorých neboli splnené podmienky na oslobodenie, " +
          "na zrazené preddavky na daň, na nezdaniteľnú časť základu dane na daňovníka podľa " +
          "§ 11 ods. 2 písm. a) alebo písm. b), na nezdaniteľnú časť základu dane na manželku (manžela) " +
          "podľa § 11 ods. 3, na nezdaniteľnú časť základu dane podľa § 11 ods. 6 a 8, " +
          "na zamestnaneckú prémiu, na daňový bonus",
      },
    },

    {
      id: "R3",
      description: "Ročný základ dane pred NČZD",
      pseudocode: `
rocny_zd = max(0, prijem_celkom - sp_celkom - zp_celkom)
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§5",
        odsek: 8,
        effective_from: "2013-01-01",
        url: URL_595,
        quote:
          "Základom dane (čiastkovým základom dane) sú zdaniteľné príjmy zo závislej činnosti " +
          "znížené o poistné a príspevky, ktoré je povinný platiť zamestnanec, alebo príspevky " +
          "na zahraničné poistenie zamestnanca, na ktorého sa vzťahuje povinné zahraničné poistenie " +
          "rovnakého druhu.",
      },
    },

    {
      id: "R4",
      description: "NČZD na daňovníka (§11 ods. 2) — ročná",
      pseudocode: `
function computeNczdDannikRocne(rocny_zd, datum_do, dochodok_rocny=0):
    ZM = lookupZmK1Januaru(zdanovaci_rok(datum_do))

    HRANICA_A = (918/10) × ZM    # 91,8 × ZM
    if rocny_zd <= HRANICA_A:
        nczd_plne = 21 × ZM
    else:
        nczd_plne = max(0, (516/10) × ZM - rocny_zd / 3)   # 51,6 × ZM − ZD/3

    # §11 ods. 6: dôchodca znižuje NCZD o sumu dôchodku (iba ak dôchodok ≥ NČZD → NČZD = 0)
    if dochodok_rocny is not None:
        nczd = max(0, nczd_plne - dochodok_rocny)
    else:
        nczd = nczd_plne

    return nczd
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Ak daňovník v príslušnom zdaňovacom období dosiahne základ dane, ktorý " +
          "a) sa rovná alebo je nižší ako 91,8-násobok sumy životného minima platného k 1. januáru " +
          "príslušného zdaňovacieho obdobia, nezdaniteľná časť základu dane ročne na daňovníka je " +
          "suma zodpovedajúca 21,0-násobku sumy životného minima platného k 1. januáru príslušného " +
          "zdaňovacieho obdobia; " +
          "b) je vyšší ako 91,8-násobok platného životného minima, nezdaniteľná časť základu dane " +
          "ročne na daňovníka je suma zodpovedajúca rozdielu 51,6-násobku platného životného minima " +
          "a jednej tretiny základu dane; ak táto suma je nižšia ako nula, nezdaniteľná časť základu " +
          "dane ročne na daňovníka sa rovná nule.",
      },
      edge_cases: [
        {
          condition: "Dôchodca (poberateľ starobného alebo predčasného starobného dôchodku)",
          behaviour:
            "NČZD sa znižuje o sumu ročného dôchodku. Ak dôchodok ≥ NČZD_plné → NČZD = 0. " +
            "Zákon §11 ods. 6: 'znižuje sa o sumu vyplateného dôchodku'.",
          citation: {
            act: "595/2003 Z. z.",
            paragraph: "§11",
            odsek: 6,
            effective_from: "2004-01-01",
            url: URL_595,
            quote:
              "Nezdaniteľná časť základu dane podľa odseku 2 sa znižuje o sumu vyplateného " +
              "dôchodku zo zdrojov v zahraničí a z prostriedkov Sociálnej poisťovne.",
          },
        },
        {
          condition: "Nerezident (daňovník s bydliskom mimo SR)",
          behaviour:
            "NČZD na daňovníka je dostupná len ak aspoň 90 % celkových príjmov plynie zo SR. " +
            "Inak NČZD = 0.",
          citation: {
            act: "595/2003 Z. z.",
            paragraph: "§11",
            odsek: 7,
            effective_from: "2004-01-01",
            url: URL_595,
            quote:
              "Nezdaniteľnú časť základu dane podľa odsekov 2 a 3 môže uplatniť daňovník " +
              "s obmedzenou daňovou povinnosťou iba vtedy, ak úhrn jeho zdaniteľných príjmov " +
              "zo zdrojov na území Slovenskej republiky tvorí najmenej 90 % zo všetkých " +
              "príjmov tohto daňovníka.",
          },
        },
      ],
    },

    {
      id: "R5",
      description: "NČZD na manžela/manželku (§11 ods. 3) — voliteľná",
      pseudocode: `
function computeNczdManzelRocne(rocny_zd, prijem_manzel, datum_do, pocet_mesiacov_manzel=12):
    # pocet_mesiacov_manzel: počet mesiacov v roku, kedy manžel/manželka spĺňal podmienky §11 ods. 4
    # (0–12; default 12 = celý rok)
    ZM = lookupZmK1Januaru(zdanovaci_rok(datum_do))

    HRANICA_B = (1548/10) × ZM   # 154,8 × ZM

    if rocny_zd <= HRANICA_B:
        nczd_max_rocna = (192/10) × ZM     # 19,2 × ZM
    else:
        nczd_max_rocna = max(0, (708/10) × ZM - rocny_zd / 3)  # 70,8×ZM − ZD/3

    # §11 ods. 3: krátiť o 1/12 za každý mesiac bez splnenia podmienok
    nczd_max = nczd_max_rocna × pocet_mesiacov_manzel / 12

    nczd_manzel = max(0, nczd_max - prijem_manzel)
    return nczd_manzel
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 3,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Ak daňovník v príslušnom zdaňovacom období dosiahne základ dane " +
          "a) rovnajúci sa alebo nižší ako 154,8-násobok platného životného minima a jeho manželka " +
          "(manžel) žijúca s daňovníkom v domácnosti v tomto zdaňovacom období " +
          "1. nemá vlastný príjem, nezdaniteľná časť základu dane ročne na manželku (manžela) je " +
          "suma zodpovedajúca 19,2-násobku platného životného minima, " +
          "2. má vlastný príjem nepresahujúci sumu zodpovedajúcu 19,2-násobku platného životného " +
          "minima, nezdaniteľná časť základu dane ročne na manželku (manžela) je rozdiel medzi " +
          "sumou zodpovedajúcou 19,2-násobku platného životného minima a vlastným príjmom manželky (manžela)",
      },
      edge_cases: [
        {
          condition: "Manžel/manželka nespĺňa podmienky §11 ods. 4 (starostlivosť o dieťa atď.)",
          behaviour: "NČZD na manžela = 0. Podmienky sú: starostlivosť o maloleté dieťa, poberanie príspevku na opatrovanie, v evidencii ÚP, ŤZP.",
        },
        {
          condition: "Podmienky §11 ods. 4 splnené len časť roka (pocet_mesiacov_manzel < 12)",
          behaviour:
            "Maximálna NČZD sa kráti proporcionálne: nczd_max = nczd_max_ročná × (pocet_mesiacov / 12). " +
            "Príklad: podmienky splnené 6 mesiacov → nczd_max = 19,2×ŽM × 6/12 = 9,6×ŽM.",
        },
      ],
    },

    {
      id: "R6",
      description: "NČZD DDS/PEPP príspevky (§11 ods. 8) — voliteľná",
      pseudocode: `
function computeNczdDds(prispevky_dds):
    MAX_DDS = 180    # EUR/rok — maximálny odpočet
    return min(MAX_DDS, prispevky_dds)
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 8,
        effective_from: "2013-01-01",
        url: URL_595,
        quote:
          "Od základu dane možno odpočítať príspevky zaplatené daňovníkom na doplnkové dôchodkové " +
          "sporenie podľa osobitného predpisu a na celoeurópsky osobný penzijný produkt podľa " +
          "osobitného predpisu v úhrne najviac 180 eur za zdaňovacie obdobie.",
      },
    },

    {
      id: "R7-R8",
      description: "Základ dane po NČZD a ročná daň (§15)",
      pseudocode: `
nczd_celkom = nczd_dannik + nczd_manzel + nczd_dds
zd_po_nczd  = max(0, rocny_zd - nczd_celkom)

# Ročná daň (§15) — temporálny dispatch
function computeIncomeAnnualTax(zd_po_nczd, datum_do):
    rok = zdanovaci_rok(datum_do)
    ZM  = lookupZmK1Januaru(rok)

    if rok <= 2025:
        # 2-pásmová: 19 % do 176,8×ŽM, 25 % nad
        h1 = (1768/10) × ZM
        pasmo1 = min(zd_po_nczd, h1)
        pasmo2 = max(0, zd_po_nczd - h1)
        dan = pasmo1 × 0.19 + pasmo2 × 0.25
    else:
        # 4-pásmová od 2026 (novela 309/2023)
        h1 = (1548/10) × ZM   # 154,8 × ZM
        h2 = (2124/10) × ZM   # 212,4 × ZM
        h3 = 264 × ZM
        pasmo1 = min(zd_po_nczd, h1)
        pasmo2 = max(0, min(zd_po_nczd - h1, h2 - h1))
        pasmo3 = max(0, min(zd_po_nczd - h2, h3 - h2))
        pasmo4 = max(0, zd_po_nczd - h3)
        dan = pasmo1 × 0.19 + pasmo2 × 0.25 + pasmo3 × 0.30 + pasmo4 × 0.35

    return round_eurocent_standard(dan)   # §47: zaokrúhlenie na eurocent
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        effective_from: "2026-01-01",
        url: URL_595,
        quote:
          "Sadzba dane je... pre fyzickú osobu 1. zo základu dane... " +
          "1a. 19 % z tej časti základu dane, ktorá nepresiahne 154,8-násobok sumy platného životného minima vrátane, " +
          "1b. 25 %... ktorá presiahne 154,8-násobok... a nepresiahne 212,4-násobok... vrátane, " +
          "1c. 30 %... ktorá presiahne 212,4-násobok... a nepresiahne 264-násobok... vrátane, " +
          "1d. 35 % z tej časti základu dane, ktorá presiahne 264-násobok sumy platného životného minima.",
      },
    },

    {
      id: "R9",
      description: "Ročný daňový bonus §33 a jeho obmedzenie",
      pseudocode: `
function computeDanovyBonusRocny(datum_do, n_do_15, n_15_25, rocny_zd):
    # POZOR: percentuálny limit §33 ods. 6 sa počíta z rocny_zd (ČZD pred NČZD), nie z zd_po_nczd!
    bonus_do15  = lookupBonusRocny(datum_do, "do_15")   # 1200 EUR (od 2025)
    bonus_od15  = lookupBonusRocny(datum_do, "15_25")   # 600 EUR (od 2025)

    bonus_raw = n_do_15 × bonus_do15 + n_15_25 × bonus_od15

    # §33 ods. 6: percentuálny limit z ročného ČZD (pred NČZD)
    n_deti = n_do_15 + n_15_25
    pct_limit = lookupBonusPercentLimit(n_deti)   # 29%, 36%, 43%, 50%, 57%, 64%
    bonus_max = rocny_zd × pct_limit

    return min(bonus_raw, bonus_max)
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§33",
        odsek: 1,
        effective_from: "2025-01-01",
        url: URL_595,
        quote:
          "Daňovník, ktorý v zdaňovacom období dosiahol zdaniteľné príjmy podľa § 5 alebo § 6 ods. 1 a 2, " +
          "si môže uplatniť daňový bonus na každé vyživované dieťa žijúce v domácnosti s daňovníkom, " +
          "pričom suma daňového bonusu, o ktorú sa znižuje daň, je " +
          "a) 50 eur mesačne, ak vyživované dieťa dovŕšilo 15 rokov veku a nedovŕšilo 18 rokov veku, alebo " +
          "b) 100 eur mesačne, ak vyživované dieťa nedovŕšilo 15 rokov veku.",
      },
      edge_cases: [
        {
          condition: "Bonus > ročná daň",
          behaviour:
            "dan_po_bonuse = 0; bonus_preplatok = bonus − daň. " +
            "Zamestnávateľ vyplatí bonus_preplatok zamestnancovi pri ročnom zúčtovaní (§38 ods. 6).",
          citation: {
            act: "595/2003 Z. z.",
            paragraph: "§38",
            odsek: 6,
            effective_from: "2004-01-01",
            url: URL_595,
            quote:
              "Zamestnávateľ, ktorý je platiteľom dane, zamestnancovi po vykonaní ročného zúčtovania, " +
              "najneskôr však pri zúčtovaní mzdy za apríl v roku, v ktorom sa ročné zúčtovanie vykonáva, " +
              "vráti rozdiel medzi vypočítanou daňou a úhrnom zrazených preddavkov na daň v prospech " +
              "zamestnanca a vyplatí... daňový bonus alebo jeho časť (§ 33)",
          },
        },
      ],
    },

    {
      id: "R10-R11",
      description: "Vyrovnanie — preplatok alebo nedoplatok",
      pseudocode: `
dan_po_bonuse   = max(0, rocna_dan - danovy_bonus)
bonus_preplatok = max(0, danovy_bonus - rocna_dan)

# Vyrovnanie oproti zaplateným preddavkom
vyrovnanie = preddavky_spolu - dan_po_bonuse

if vyrovnanie > 0:
    typ = "PREPLATOK"   # zamestnávateľ vráti zamestnancovi
elif vyrovnanie < 0:
    typ = "NEDOPLATOK"  # zamestnanec doplatí (ak > 5 EUR)
else:
    typ = "VYROVNANE"

# Nedoplatok ≤ 5 EUR sa nevymáha (§38 ods. 7)
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§38",
        odsek: 6,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Zamestnávateľ, ktorý je platiteľom dane, zamestnancovi po vykonaní ročného zúčtovania, " +
          "najneskôr však pri zúčtovaní mzdy za apríl v roku, v ktorom sa ročné zúčtovanie vykonáva, " +
          "vráti rozdiel medzi vypočítanou daňou a úhrnom zrazených preddavkov na daň v prospech zamestnanca.",
      },
      edge_cases: [
        {
          condition: "Nedoplatok ≤ 5 EUR",
          behaviour: "Nedoplatok sa nevymáha a zamestnanec ho nedoplatí (§38 ods. 7).",
          citation: {
            act: "595/2003 Z. z.",
            paragraph: "§38",
            odsek: 7,
            effective_from: "2004-01-01",
            url: URL_595,
            quote:
              "Daňový nedoplatok vyplývajúci z ročného zúčtovania presahujúci sumu 5 eur zráža " +
              "zamestnávateľ, ktorý je platiteľom dane, zamestnancovi zo zdaniteľnej mzdy najneskôr " +
              "do konca zdaňovacieho obdobia, v ktorom sa vykonalo ročné zúčtovanie.",
          },
        },
        {
          condition: "Záporné preddavky vstupné (mesiace s bonus > mesačná daň)",
          behaviour:
            "Preddavky_spolu môže byť záporné. Vyrovnanie = záporné preddavky − dan_po_bonuse " +
            "(výsledok kladný = preplatok). Záporné preddavky nastávajú keď zamestnávateľ " +
            "mesačne vypláca bonus presahujúci mesačnú daň.",
        },
      ],
    },
  ],

  semantic_mapping: [
    {
      step_id: "R2",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§38",
        odsek: 4,
        effective_from: "2004-01-01",
        url: URL_595,
        quote: "Zamestnávateľ vykoná výpočet dane a súčasne prihliadne na zrazené preddavky na daň, na nezdaniteľnú časť základu dane...",
      },
    },
    {
      step_id: "R3",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§5",
        odsek: 8,
        effective_from: "2013-01-01",
        url: URL_595,
        quote:
          "Základom dane (čiastkovým základom dane) sú zdaniteľné príjmy zo závislej činnosti " +
          "znížené o poistné a príspevky, ktoré je povinný platiť zamestnanec",
      },
    },
    {
      step_id: "R4",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "nezdaniteľná časť základu dane ročne na daňovníka je suma zodpovedajúca 21,0-násobku " +
          "sumy životného minima platného k 1. januáru príslušného zdaňovacieho obdobia",
      },
    },
    {
      step_id: "R5",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 3,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "nezdaniteľná časť základu dane ročne na manželku (manžela) je rozdiel medzi " +
          "sumou zodpovedajúcou 19,2-násobku platného životného minima a vlastným príjmom manželky (manžela)",
      },
    },
    {
      step_id: "R6",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 8,
        effective_from: "2013-01-01",
        url: URL_595,
        quote:
          "Od základu dane možno odpočítať príspevky zaplatené daňovníkom na doplnkové dôchodkové " +
          "sporenie... v úhrne najviac 180 eur za zdaňovacie obdobie.",
      },
    },
    {
      step_id: "R7-R8",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        effective_from: "2013-01-01",
        url: URL_595,
        quote: "Sadzba dane je... 19 % / 25 % / 30 % / 35 % zo základu dane v pásmach 154,8×/212,4×/264× ŽM.",
      },
    },
    {
      step_id: "R9",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§33",
        odsek: 1,
        effective_from: "2025-01-01",
        url: URL_595,
        quote:
          "Daňovník... si môže uplatniť daňový bonus na každé vyživované dieťa... " +
          "a) 50 eur mesačne (dieťa 15–18 r.) alebo b) 100 eur mesačne (dieťa do 15 r.).",
      },
    },
    {
      step_id: "R10-R11",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§38",
        odsek: 6,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Zamestnávateľ... vráti rozdiel medzi vypočítanou daňou a úhrnom zrazených preddavkov " +
          "na daň v prospech zamestnanca",
      },
    },
  ],

  tool: {
    name: "get_annual_tax_reconciliation_logic",
    description:
      "Vráti kompletný blueprint pre ročné zúčtovanie preddavkov na daň zo závislej činnosti " +
      "na Slovensku (§38 zákona 595/2003). " +
      "Pokrýva: agregáciu ročných príjmov/odvodov/preddavkov, " +
      "NČZD na daňovníka (§11 ods. 2), na manžela/manželku (§11 ods. 3), DDS/PEPP (§11 ods. 8), " +
      "ročnú daň §15, daňový bonus §33, výsledné vyrovnanie (preplatok/nedoplatok).",
    input_parameters: [
      {
        name: "datum_do",
        type: "string",
        description: "Posledný deň zdaňovacieho obdobia (spravidla RRRR-12-31). Určuje verzie sadzieb a ŽM.",
        required: true,
      },
      {
        name: "mesiace",
        type: "array",
        description:
          "Zoznam mesačných záznamov (max 12). Každý obsahuje: zdanitelny_prijem, sp_zamestnanec, " +
          "zp_zamestnanec, preddavok.",
        required: true,
      },
      {
        name: "nczd_manzel_prijem",
        type: "number",
        description: "Vlastný príjem manžela/manželky za zdaňovacie obdobie (EUR). Null ak sa neuplatňuje.",
        required: false,
        unit: "EUR",
      },
      {
        name: "dds_prispevky",
        type: "number",
        description: "Príspevky zamestnanca na DDS/PEPP za rok (EUR, max 180 EUR odpočet).",
        required: false,
        unit: "EUR",
      },
      {
        name: "dochodok_rocny",
        type: "number",
        description: "Suma ročného dôchodku (EUR) — znižuje NČZD na daňovníka (§11 ods. 6).",
        required: false,
        unit: "EUR",
      },
      {
        name: "pocet_deti_do_15",
        type: "integer",
        description: "Počet vyživovaných detí do 15 rokov pre daňový bonus §33.",
        required: false,
      },
      {
        name: "pocet_deti_15_18",
        type: "integer",
        description: "Počet vyživovaných detí vo veku 15–18 (resp. 15–25 pre študentov od 2025) pre bonus §33.",
        required: false,
      },
      {
        name: "pocet_mesiacov_manzel",
        type: "integer",
        description:
          "Počet mesiacov v roku, kedy manžel/manželka spĺňal podmienky §11 ods. 4 (0–12). " +
          "Default 12 = celý rok. Zadať ak podmienky trvali len časť roka — NČZD sa kráti o 1/12 za chýbajúci mesiac.",
        required: false,
      },
      {
        name: "dochodca_k_1_januaru",
        type: "boolean",
        description:
          "True ak bol zamestnanec poberateľom starobného alebo predčasného starobného dôchodku k 1. januáru " +
          "zdaňovacieho roka (alebo mu bol dôchodok priznaný spätne k tomuto dátumu). " +
          "Ovplyvňuje, či sa NČZD znižuje o dochodok_rocny (§11 ods. 6). " +
          "Ak sa stal dôchodcom počas roka (napr. v marci), NČZD sa neskracuje — zadať false.",
        required: false,
      },
    ],
    calculation_steps: [
      "R2: Agregácia Σpríjmy + ΣSP + ΣZP + Σpreddavky z mesačných záznamov.",
      "R3: Ročný ZD = max(0, Σpríjmy − ΣSP − ΣZP). §5 ods. 8.",
      "R4: NČZD_daňník = 21×ŽM (ZD ≤ 91,8×ŽM) alebo max(0, 51,6×ŽM − ZD/3) §11 ods. 2.",
      "R5: NČZD_manžel = max(0, 19,2×ŽM − príjem_manžela) pri ZD ≤ 154,8×ŽM; inak §11 ods. 3b.",
      "R6: NČZD_DDS = min(180, príspevky). §11 ods. 8.",
      "R7: ZD_po_NČZD = max(0, ZD − NČZD_celkom).",
      "R8: Ročná daň = 4-pásmová sadzba §15 z ZD_po_NČZD. Zaokrúhlenie §47.",
      "R9: Bonus = §33 ods. 1 × počet detí, obmedzený §33 ods. 6 percentami rocny_zd (ČZD pred NČZD).",
      "R10: Dan_po_bonuse = max(0, daň − bonus).",
      "R11: Vyrovnanie = Σpreddavky − dan_po_bonuse. > 0 = PREPLATOK, < 0 = NEDOPLATOK.",
    ],
    audit_trail_template:
      "Ročné zúčtovanie {rok}: príjmy = {prijem_celkom} EUR, SP = {sp_celkom} EUR, ZP = {zp_celkom} EUR. " +
      "§5 ods. 8: ročný ZD = {rocny_zd} EUR. " +
      "§11 ods. 2: NČZD_danník = {nczd_dannik} EUR. " +
      "§11 ods. 3: NČZD_manžel = {nczd_manzel} EUR. " +
      "§11 ods. 8: NČZD_DDS = {nczd_dds} EUR. " +
      "ZD po NČZD = {zd_po_nczd} EUR. §15: ročná daň = {rocna_dan} EUR. " +
      "§33: bonus = {danovy_bonus} EUR. Dan po bonuse = {dan_po_bonuse} EUR. " +
      "Σpreddavky = {preddavky_spolu} EUR. Vyrovnanie = {vyrovnanie} EUR ({typ_vyrovnania}).",
  },

  verification_cases: [
    {
      id: "VC1_standard_full_year_2025",
      source:
        "Manuálny výpočet pre celý rok 2025. Zamestnanec 1 800 EUR hrubý každý mesiac, " +
        "bez manžela/DDS/detí. Sadzby overené voči §11 ods. 2, §15, §38 zákona 595/2003. " +
        "ŽM k 2025-01-01 = 273,99 EUR.",
      input: {
        datum_do: "2025-12-31",
        mesiace: "12× {zdanitelny_prijem: 1540.80, sp_zamestnanec: 169.20, zp_zamestnanec: 90.0, preddavok: 201.65}",
        nczd_manzel_prijem: null,
        dds_prispevky: null,
        dochodok_rocny: null,
        pocet_deti_do_15: 0,
        pocet_deti_15_18: 0,
      },
      expected_output: {
        prijem_celkom: 18489.60,    // 12 × 1540.80
        sp_celkom: 2030.40,         // 12 × 169.20
        zp_celkom: 1080.0,          // 12 × 90.0
        rocny_zd: 15379.20,         // 18489.60 − 2030.40 − 1080.0
        // NČZD: ZD 15379.20 vs 91,8×273,99 = 25152.28 → ZD < hranica → plná NČZD
        nczd_dannik: 5753.79,       // 21 × 273,99
        nczd_manzel: 0,
        nczd_dds: 0,
        zd_po_nczd: 9625.41,        // 15379.20 − 5753.79
        // §15: h1 = 154,8×273,99 = 42393.25 EUR → celé v 19% pásme
        rocna_dan: 1828.83,         // round(9625.41 × 0.19) = round(1828.828) = 1828.83
        danovy_bonus: 0,
        dan_po_bonuse: 1828.83,
        preddavky_spolu: 2419.80,   // 12 × 201.65
        vyrovnanie: 590.97,         // 2419.80 − 1828.83
        typ_vyrovnania: "PREPLATOK",
      },
      legal_reasoning:
        "§38 ods. 4/595/2003: agregácia 12 mesiacov. §5 ods. 8: ZD = 18489,60−2030,40−1080 = 15379,20 EUR. " +
        "§11 ods. 2 písm. a): ZD 15379,20 < 91,8×273,99=25152,28 → plná NČZD = 21×273,99 = 5753,79 EUR. " +
        "ZD po NČZD = 9625,41 EUR. §15 ods. 1a: 9625,41 < 154,8×273,99=42393,25 → celé 19 %. " +
        "Ročná daň = round(9625,41×0,19) = 1828,83 EUR. Bez bonusu. " +
        "§38 ods. 6: vyrovnanie = 2419,80−1828,83 = 590,97 EUR PREPLATOK.",
    },
    {
      id: "VC2_with_children_and_manzel_2025",
      source:
        "Zamestnanec 3000 EUR hrubý celý rok 2025. Dve deti do 15 rokov, manžel bez príjmu. " +
        "Overenie NČZD na manžela (§11 ods. 3) a ročného bonusu 2×1200=2400 EUR.",
      input: {
        datum_do: "2025-12-31",
        mesiace: "12× {zdanitelny_prijem: 2624.0, sp_zamestnanec: 282.0, zp_zamestnanec: 150.0, preddavok: 359.46}",
        nczd_manzel_prijem: 0,
        dds_prispevky: null,
        dochodok_rocny: null,
        pocet_deti_do_15: 2,
        pocet_deti_15_18: 0,
      },
      expected_output: {
        prijem_celkom: 31488.0,     // 12 × 2624.0
        sp_celkom: 3384.0,          // 12 × 282.0
        zp_celkom: 1800.0,          // 12 × 150.0
        rocny_zd: 26304.0,          // 31488 − 3384 − 1800
        // NČZD daňník: ZD 26304 > 91,8×273,99=25152,28 → fázové znižovanie
        // nczd_dannik = max(0, 51,6×273,99 − 26304/3) = max(0, 14137,88 − 8768) = 5369,88
        nczd_dannik: 5369.88,
        // NČZD manžel: ZD 26304 < 154,8×273,99=42393,25 → nczd_manzel = max(0, 19,2×273,99−0) = 5260,61
        nczd_manzel: 5260.61,
        nczd_dds: 0,
        zd_po_nczd: 15673.51,       // 26304 − 5369,88 − 5260,61
        // §15: 15673,51 < 42393,25 → celé 19 %
        rocna_dan: 2977.97,         // round(15673,51 × 0.19)
        // bonus = 2×1200 = 2400; limit = 36% × 15673,51 = 5642,46 (§33 ods. 6, 2 deti) → bonus = 2400 (pod limitom)
        danovy_bonus: 2400.0,
        dan_po_bonuse: 577.97,      // 2977.97 − 2400
        preddavky_spolu: 4313.52,   // 12 × 359.46
        vyrovnanie: 3735.55,        // 4313.52 − 577.97
        typ_vyrovnania: "PREPLATOK",
      },
      legal_reasoning:
        "§5 ods. 8: ZD = 31488−3384−1800 = 26304 EUR. " +
        "§11 ods. 2 písm. b): ZD 26304 > 91,8×273,99=25152,28 → NČZD_daňník = 51,6×273,99−26304/3 = 14137,88−8768 = 5369,88 EUR. " +
        "§11 ods. 3 písm. a) bod 1.: ZD < 154,8×ŽM → NČZD_manžel = 19,2×273,99 = 5260,61 EUR (príjem=0). " +
        "ZD po NČZD = 26304−5369,88−5260,61 = 15673,51 EUR. §15: celé 19 % → daň = 2977,97 EUR. " +
        "§33 ods. 1 písm. b): bonus = 2×1200 = 2400 EUR (≤ 36%×15673,51=5642 EUR, limit pre 2 deti §33 ods. 6). " +
        "Dan po bonuse = 577,97 EUR. Preddavky = 4313,52 EUR. §38 ods. 6: PREPLATOK = 3735,55 EUR.",
    },
    {
      id: "VC3_high_income_4_bands_2026",
      source:
        "Vysoko-príjmový zamestnanec za rok 2026 — overuje 4-pásmovú daň §15 (novela 309/2023). " +
        "ŽM k 2026-01-01 = 284,13 EUR (Opatrenie MPSVR SR 168/2025 Z. z.). " +
        "Mesačný hrubý 5 500 EUR celých 12 mesiacov, bez detí/manžela/DDS.",
      input: {
        datum_do: "2026-12-31",
        mesiace: "12× {zdanitelny_prijem: 4691.0, sp_zamestnanec: 517.0, zp_zamestnanec: 275.0, preddavok: 0}",
        nczd_manzel_prijem: null,
        dds_prispevky: null,
        dochodok_rocny: null,
        pocet_deti_do_15: 0,
        pocet_deti_15_18: 0,
      },
      expected_output: {
        prijem_celkom: 66000.0,        // 12 × 5500
        sp_celkom: 6204.0,             // 12 × 517 (9,4 % × 5500 = 517)
        zp_celkom: 3300.0,             // 12 × 275 (5 % × 5500)
        rocny_zd: 56496.0,             // 66000 − 6204 − 3300
        // NČZD: ZD 56496 > 91,8×284,13 = 26083,13 → tapering
        // nczd_dannik = max(0, 51,6×284,13 − 56496/3) = max(0, 14661,11 − 18832) = 0
        nczd_dannik: 0,
        nczd_manzel: 0,
        nczd_dds: 0,
        zd_po_nczd: 56496.0,
        // §15 4-pásmová od 2026:
        //   h1 = 154,8×284,13 = 43983,32; h2 = 212,4×284,13 = 60349,21
        //   pásmo1 = 43983,32 × 0,19 = 8356,8308
        //   pásmo2 = (56496 − 43983,32) × 0,25 = 12512,68 × 0,25 = 3128,17
        //   ročná daň = round(8356,8308 + 3128,17) = round(11485,0008) = 11485,00
        rocna_dan: 11485.0,
        danovy_bonus: 0,
        dan_po_bonuse: 11485.0,
        preddavky_spolu: 0,             // (záloha simulácia: 0 pre demonštráciu typu NEDOPLATOK)
        vyrovnanie: -11485.0,           // 0 − 11485 = NEDOPLATOK
        typ_vyrovnania: "NEDOPLATOK",
      },
      legal_reasoning:
        "§38 ods. 4: agregácia 12 mesiacov, príjem celkom = 66 000 EUR. " +
        "§5 ods. 8: ZD = 66 000 − 6 204 − 3 300 = 56 496 EUR. " +
        "§11 ods. 2 písm. b): ZD 56 496 > 91,8×284,13 = 26 083,13 → fázové znižovanie: " +
        "NČZD_daňník = max(0, 51,6×284,13 − 56 496/3) = max(0, 14 661,11 − 18 832,00) = 0 EUR. " +
        "ZD po NČZD = 56 496 EUR. " +
        "§15 (4-pásmová od 2026-01-01, novela 309/2023): " +
        "h1 = 154,8×284,13 = 43 983,32 EUR; pásmo1 daň = 43 983,32 × 19 % = 8 356,83 EUR. " +
        "Nad h1: 56 496 − 43 983,32 = 12 512,68 EUR × 25 % = 3 128,17 EUR (pásmo2). " +
        "Ročná daň = round(8 356,83 + 3 128,17) = 11 485,00 EUR. " +
        "Bez bonusu na deti. §38 ods. 6: vyrovnanie = 0 − 11 485,00 = −11 485,00 EUR (NEDOPLATOK).",
    },
  ],
};

export default blueprint;
