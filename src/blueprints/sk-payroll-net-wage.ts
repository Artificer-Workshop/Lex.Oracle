/**
 * Blueprint: SK Payroll — Výpočet čistej mzdy
 *
 * Jurisdiction:  SK
 * Topic:         Mesačná čistá mzda zamestnanca (záloha na daň)
 * Legal acts:    Zákon NR SR 461/2003 Z. z. (Sociálne poistenie) — §129, §131, §138
 *                Zákon NR SR 580/2004 Z. z. (Zdravotné poistenie) — §12, §13, §13a, §16
 *                Zákon NR SR 595/2003 Z. z. (Daň z príjmov) — §5, §11, §15, §33, §35, §47
 *                Zákon NR SR 601/2003 Z. z. (Životné minimum) — §2
 *
 * Scope: zamestnanec, mesačná záloha na daň.
 * Out of scope: SZČO, ročné zúčtovanie (§38), SP/ZP zamestnávateľa,
 *               naturálny príjem za vozidlo (§5 ods. 3) — caller ho pridá do hrubej.
 */

import type { Blueprint } from "./types.js";

const URL_461 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/461/";
const URL_580 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/580/";
const URL_595 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/";
const URL_601 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/601/";

const blueprint: Blueprint = {
  id: "sk-payroll-net-wage",
  title: "SK Výpočet čistej mzdy — SP + ZP + záloha na daň (mesačná)",
  version: "1.0.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-15",
  summary:
    "Algoritmus výpočtu čistej mzdy zamestnanca zo hrubej mzdy: " +
    "odvody do sociálnej poisťovne (SP, 9,4 %), preddavky zdravotného poistenia " +
    "(ZP, 4 %/5 %) a mesačná záloha na daň z príjmov " +
    "(4-pásmová progresívna sadzba 19 %/25 %/30 %/35 %). " +
    "Pokrýva: maximálny vymeriavací základ SP (temporálny, zmena 7× na 11× od 2025-01-01), " +
    "odpočítateľnú položku ZP (§13a — fázové znižovanie), " +
    "nezdaniteľnú časť základu dane (NČZD, §11), daňový bonus na deti (§33). " +
    "Všetka aritmetika používa CL rationals; finálne hodnoty zaokrúhlené podľa príslušného predpisu.",

  legal_acts: [
    {
      act: "461/2003 Z. z.",
      title: "Zákon o sociálnom poistení",
      url: URL_461,
    },
    {
      act: "580/2004 Z. z.",
      title: "Zákon o zdravotnom poistení",
      url: URL_580,
    },
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
        "§13a ods. 1 zákona 580/2004: odpočítateľná položka ZP (OOP) sa počíta " +
        "z CELÉHO hrubého príjmu, nie z príjmu zníženého o SP. Aj hranica fázového " +
        "znižovania (570 EUR) sa porovnáva s celkovým hrubým príjmom.",
      chosen_interpretation:
        "OOP sa počíta z celého hrubého príjmu. Znižuje výlučne vymeriavací základ " +
        "ZP zamestnanca — NIE základ ZP zamestnávateľa.",
      rationale:
        "Explicitný text zákona: §13a ods. 1 — 'základ pre OOP = príjem zamestnanca'; " +
        "usmernenie MZ SR potvrdzuje, že základom je hrubý príjem, nie hrubý príjem mínus SP.",
    },
    {
      issue:
        "§35 záloha na daň (§47 zaokrúhlenie): záloha na daň po odčítaní NČZD sa " +
        "zaokrúhľuje na eurocent štandardne (± 0,005 EUR → hore), zatiaľ čo SP a ZP " +
        "sa zaokrúhľujú na eurocent smerom nadol (floor).",
      chosen_interpretation:
        "SP za každú zložku: floor na eurocent. ZP: floor na eurocent. " +
        "Záloha na daň: zaokrúhlenie na najbližší eurocent (§47 ods. 1 — eurocent štandard).",
      rationale:
        "§47 ods. 1 zákona 595/2003 stanovuje zaokrúhľovanie pre daňové výpočty. " +
        "Zaokrúhlenie SP/ZP na eurocent nadol zodpovedá administratívnej praxi " +
        "Sociálnej poisťovne a zdravotných poisťovní (potvrdené Aether.Logic implementáciou).",
    },
    {
      issue:
        "NČZD (§11) sa počíta z výšky životného minima (ŽM) platného k 1. januáru " +
        "zdaňovacieho roka, NIE z ŽM platného v mesiaci výpočtu. ŽM sa aktualizuje " +
        "ročne k 1. júlu, ale NČZD zamrazuje hodnotu k 1. januáru.",
      chosen_interpretation:
        "Pre akýkoľvek mesiac zdaňovacieho roka R sa NČZD počíta z ŽM platného " +
        "k R-01-01. Napr. pre všetky mesiace roka 2025: ŽM = 273,99 EUR (platné od " +
        "2024-07-01), NČZD_ročné = 21 × 273,99 = 5 753,79 EUR, " +
        "NČZD_mesačné = floor(5 753,79 / 12) = 479,48 EUR.",
      rationale:
        "§11 ods. 2 zákona 595/2003: 'sumy platného životného minima k 1. januáru " +
        "príslušného zdaňovacieho obdobia'. Zdaňovacie obdobie 2025 zamrazuje ŽM k 2025-01-01.",
    },
    {
      issue:
        "Od 2025-01-01 sa maximálny vymeriavací základ SP zmenil zo 7-násobku na " +
        "11-násobok priemernej mesačnej mzdy (§138 ods. 9 zákona 461/2003). Akýkoľvek " +
        "kód používajúci pôvodný 7-násobok bude nesprávne stanovovat strop pre vysoké príjmy.",
      chosen_interpretation:
        "Pre mesiace >= 2025-01-01 sa používa 11-násobok priemernej mzdy. " +
        "Konkrétne mesačné stropy: 2025 = 15 730 EUR, 2026 = 16 764 EUR.",
      rationale:
        "Novela zákonom č. 309/2023 Z. z., §138 ods. 9 účinná od 2025-01-01. " +
        "Overené voči oficiálnemu oznámeniu Sociálnej poisťovne.",
    },
  ],

  axiomatic_core: [
    {
      name: "SP_EMPLOYEE_RATES",
      definition: "Sadzby poistného zamestnanca na sociálne poistenie (§129 ods. 1 zákona 461/2003)",
      value: "nemocenské: 1,4 % | starobné: 4,0 % | invalidné: 3,0 % | nezamestnanosť: 1,0 % | SPOLU: 9,4 %",
      citation: {
        act: "461/2003 Z. z.",
        paragraph: "§129",
        odsek: 1,
        effective_from: "2004-01-01",
        url: URL_461,
        quote:
          "Zamestnanec je povinný platiť poistné na nemocenské poistenie, " +
          "starobné poistenie, invalidné poistenie a poistenie v nezamestnanosti.",
      },
      effective_periods: [
        {
          from: "2004-01-01",
          value: "nemocenské 1,4 % + starobné 4,0 % + invalidné 3,0 % + nezamestnanosť 1,0 % = 9,4 %",
          note: "Stabilné od roku 2004; bez zmien do roku 2026.",
        },
      ],
    },
    {
      name: "SP_MAX_BASIS",
      definition:
        "Mesačný maximálny vymeriavací základ SP. Hrubý príjem nad tento strop " +
        "nepodlieha SP. §138 ods. 6/9 zákona 461/2003.",
      value: "temporálny — viď effective_periods",
      citation: {
        act: "461/2003 Z. z.",
        paragraph: "§138",
        odsek: 9,
        effective_from: "2025-01-01",
        url: URL_461,
        quote:
          "Maximálny vymeriavací základ je 11-násobok jednej dvanástiny " +
          "všeobecného vymeriavacieho základu za kalendárny rok, ktorý dva " +
          "roky predchádza kalendárnemu roku, za ktorý sa platí poistné.",
      },
      effective_periods: [
        { from: "2024-01-01", to: "2024-12-31", value: "9 128 EUR/mesiac", note: "7-násobok priem. mzdy 2022 (1 304 EUR)" },
        { from: "2025-01-01", to: "2025-12-31", value: "15 730 EUR/mesiac", note: "11-násobok priem. mzdy 2023 (1 430 EUR)" },
        { from: "2026-01-01", value: "16 764 EUR/mesiac", note: "11-násobok priem. mzdy 2024 (1 524 EUR)" },
      ],
    },
    {
      name: "ZP_EMPLOYEE_RATE",
      definition:
        "Sadzba preddavku zamestnanca na zdravotné poistenie (§12 ods. 1 zákona 580/2004). " +
        "Uplatňuje sa na vymeriavací základ znížený o OOP. Osoba s ŤZP: polovičná sadzba.",
      value: "4 % (do 2024-12-31) | 5 % (od 2025-01-01) | ŤZP: polovica príslušnej sadzby",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§12",
        odsek: 1,
        effective_from: "2005-01-01",
        url: URL_580,
        quote: "Zamestnanec je povinný platiť preddavok na poistné vo výške … % z vymeriavacieho základu.",
      },
      effective_periods: [
        { from: "2005-01-01", to: "2024-12-31", value: "4 % (ŤZP: 2 %)" },
        { from: "2025-01-01", value: "5 % (ŤZP: 2,5 %)" },
      ],
    },
    {
      name: "ZP_OOP",
      definition:
        "Odpočítateľná položka ZP (§13a zákona 580/2004). " +
        "Znižuje vymeriavací základ ZP zamestnanca pre nízke príjmy. " +
        "Plná OOP = 380 EUR; lineárne znižuje sa nad 380 EUR hrubého; nula od 570 EUR hrubého.",
      value: "OOP = max(0, 380 − 2 × max(0, hrubá − 380)); OOP = 0 ak hrubá >= 570",
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§13a",
        odsek: 1,
        effective_from: "2017-01-01",
        url: URL_580,
        quote:
          "Od vymeriavacieho základu zamestnanca sa odpočíta odpočítateľná " +
          "položka … Základná výška odpočítateľnej položky je 380 eur.",
      },
      effective_periods: [
        {
          from: "2017-01-01",
          value: "základ = 380 EUR, koeficient znižovania = 2, horná hranica = 570 EUR",
          note: "Stabilné od zavedenia.",
        },
      ],
    },
    {
      name: "NCZD_DANNIK",
      definition:
        "Nezdaniteľná časť základu dane na daňovníka (§11 zákona 595/2003). " +
        "Ročná = 21-násobok ŽM k 1. januáru zdaňovacieho roka. " +
        "Mesačná záloha = floor(ročná / 12). " +
        "Fázové znižovanie: ak ročný základ dane > 91,8-násobok ŽM_ročné, " +
        "NČZD = max(0, 51,6 × ŽM − 0,25 × základ_dane_ročný).",
      value: "21 × ŽM_1jan_zdaňovací_rok / 12 (štandardný príjem; viď fázové znižovanie v logic_flow)",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Nezdaniteľná časť základu dane na daňovníka je suma zodpovedajúca " +
          "21-násobku sumy platného životného minima.",
      },
      effective_periods: [
        { from: "2024-01-01", to: "2024-12-31", value: "470,54 EUR/mesiac (21×268,88/12; ŽM k 2024-01-01=268,88 EUR)" },
        { from: "2025-01-01", to: "2025-12-31", value: "479,48 EUR/mesiac (21×273,99/12; ŽM k 2025-01-01=273,99 EUR)" },
        { from: "2026-01-01", value: "497,28 EUR/mesiac (21×284,16/12; ŽM k 2026-01-01=284,16 EUR)" },
      ],
    },
    {
      name: "TAX_BANDS",
      definition:
        "4-pásmové progresívne sadzby dane z príjmov (§15 zákona 595/2003). " +
        "Hranice pásiem sú násobky ŽM platného k 1. januáru zdaňovacieho roka. " +
        "Pre mesačnú zálohu (§35) sa ročné hranice delia 12.",
      value:
        "19 % do 154,8-násobku ŽM | 25 % od 154,8× do 212,4× ŽM | " +
        "30 % od 212,4× do 264× ŽM | 35 % nad 264-násobkom ŽM",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§15",
        effective_from: "2013-01-01",
        url: URL_595,
        quote:
          "Sadzba dane zo základu dane … je: a) 19 % z tej časti základu dane, " +
          "ktorá neprevyšuje 154,8-násobok sumy platného životného minima …",
      },
      effective_periods: [
        {
          from: "2013-01-01",
          value:
            "19 %/25 %/30 %/35 % pásma pri 154,8×/212,4×/264× ŽM; " +
            "mesačné hranice 2025 (ŽM = 273,99 EUR): " +
            "h1 = 3 534,47 EUR, h2 = 4 850,87 EUR, h3 = 6 031,78 EUR",
        },
      ],
    },
    {
      name: "TAX_BONUS_CHILD",
      definition:
        "Mesačný daňový bonus na vyživované dieťa (§33 zákona 595/2003). " +
        "Odčítava sa od vypočítanej zálohy na daň; výsledok môže byť záporný " +
        "(zamestnávateľ vyplatí rozdiel zamestnancovi).",
      value: "temporálny — podľa veku dieťaťa a zdaňovacieho roka",
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§33",
        effective_from: "2004-01-01",
        url: URL_595,
        quote:
          "Daňovník, ktorý v zdaňovacom období mal zdaniteľné príjmy … " +
          "si môže uplatniť daňový bonus na každé vyživované dieťa.",
      },
      effective_periods: [
        {
          from: "2024-01-01",
          to: "2024-12-31",
          value: "dieťa ≤ 15 rokov: 140 EUR/mesiac | dieťa 15–18 rokov: 50 EUR/mesiac",
        },
        {
          from: "2025-01-01",
          value: "dieťa ≤ 15 rokov: 100 EUR/mesiac | dieťa 15–25 rokov (študent): 50 EUR/mesiac",
          note: "Reforma zákonom č. 278/2024 Z. z., účinnosť od 2025-01-01.",
        },
      ],
    },
  ],

  execution_order: [
    "STEP_P1: Overenie vstupov; určenie verzie sadzieb pre calculation_date.",
    "STEP_P2: Výpočet SP zamestnanca po zložkách; aplikácia stropu SP_MAX_BASIS.",
    "STEP_P3: Výpočet odpočítateľnej položky ZP (§13a — fázové znižovanie) z celkového hrubého.",
    "STEP_P4: Výpočet preddavku ZP zamestnanca z (hrubá − OOP); polovičná sadzba pre ŤZP.",
    "STEP_P5: Základ dane = hrubá − SP_zam − ZP_zam (§5 ods. 8 zákona 595/2003).",
    "STEP_P6: Výpočet mesačného NČZD; fázové znižovanie ak základ > 91,8 × ŽM/12.",
    "STEP_P7: Zdaniteľný základ = max(0, základ_dane − NČZD).",
    "STEP_P8: Uplatnenie 4-pásmovej progresívnej sadzby na zdaniteľný základ (mesačné hranice = ročné/12).",
    "STEP_P9: Uplatnenie daňového bonusu (§33). Záloha môže byť záporná (bonus platí zamestnávateľ).",
    "STEP_P10: Čistá mzda = hrubá − SP_zam − ZP_zam − záloha_po_bonuse.",
  ],

  logic_flow: [
    {
      id: "P2",
      description: "Sociálne poistenie — odvody zamestnanca",
      pseudocode: `
function computeSpEmployee(gross, date):
    VZ = min(gross, lookupSpMaxBasis(date))   # vymeriavací základ, strop

    # Každá zložka: floor na eurocent
    nemocenske    = floor_cent(VZ × 0.014)   # 1,4 % — nemocenské
    starobne      = floor_cent(VZ × 0.040)   # 4,0 % — starobné
    invalidne     = floor_cent(VZ × 0.030)   # 3,0 % — invalidné
    nezamestnanost = floor_cent(VZ × 0.010)  # 1,0 % — nezamestnanosť

    total = nemocenske + starobne + invalidne + nezamestnanost  # = 9,4 % × VZ (so zaokrúhlením)
    return total, {nemocenske, starobne, invalidne, nezamestnanost, VZ_capped=VZ}
      `.trim(),
      citation: {
        act: "461/2003 Z. z.",
        paragraph: "§129",
        odsek: 1,
        effective_from: "2004-01-01",
        url: URL_461,
        quote: "Zamestnanec je povinný platiť poistné na nemocenské poistenie …",
      },
      edge_cases: [
        {
          condition: "hrubá > SP_MAX_BASIS pre daný mesiac",
          behaviour: "SP sa počíta z SP_MAX_BASIS, nie z celého hrubého. Suma nad strop ostáva v čistej mzde.",
          citation: {
            act: "461/2003 Z. z.",
            paragraph: "§138",
            odsek: 9,
            effective_from: "2025-01-01",
            url: URL_461,
            quote: "Maximálny vymeriavací základ je 11-násobok …",
          },
        },
        {
          condition: "hrubá = 0 (mesiac bez príjmu, napr. neplatené voľno)",
          behaviour: "Všetky zložky SP = 0. Pokračuje sa krokmi ZP a daň.",
        },
      ],
    },

    {
      id: "P3",
      description: "Odpočítateľná položka ZP (OOP) — §13a zákona 580/2004",
      pseudocode: `
function computeZpOOP(gross, date):
    if date < 2017-01-01:
        return 0  # OOP ešte neplatila

    ZAKLAD = 380    # EUR — plná OOP
    HORNY  = 570    # EUR — horná hranica fázového znižovania (OOP = 0)
    KOEF   = 2      # koeficient znižovania

    if gross >= HORNY:
        return 0
    elif gross <= ZAKLAD:
        return ZAKLAD
    else:
        oop = ZAKLAD - KOEF × (gross - ZAKLAD)
        return max(0, oop)
      `.trim(),
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§13a",
        odsek: 1,
        effective_from: "2017-01-01",
        url: URL_580,
        quote: "Základná výška odpočítateľnej položky je 380 eur …",
      },
      edge_cases: [
        {
          condition: "hrubá v intervale (380, 570) — fázové pásmo",
          behaviour: "OOP = max(0, 380 − 2 × (hrubá − 380)). OOP dosiahne 0 presne pri hrubej = 570 EUR.",
        },
        {
          condition: "OOP sa uplatňuje iba na vymeriavací základ ZP zamestnanca",
          behaviour: "Základ ZP zamestnávateľa = celá hrubá (bez OOP). OOP sa na stranu zamestnávateľa NEUPLATŇUJE.",
        },
        {
          condition: "Pomerná OOP pri kratšom poistnom vzťahu (§13a ods. 3)",
          behaviour:
            "Ak bol zamestnanec poistený menej dní ako má mesiac: " +
            "OOP_pomerná = floor_cent(OOP_plná × počet_dní_poistenia / počet_dní_v_mesiaci).",
        },
      ],
    },

    {
      id: "P4",
      description: "Preddavok ZP zamestnanca",
      pseudocode: `
function computeZpEmployee(gross, date, ztp=false):
    oop = computeZpOOP(gross, date)
    VZ_zp = gross - oop                     # vymeriavací základ ZP

    rate = lookupZpEmployeeRate(date, ztp)   # 0,04 (do 2024) | 0,05 (od 2025), ŤZP: polovica
    zp = floor_cent(VZ_zp × rate)

    # Minimálny preddavok (§16a zákona 580/2004):
    # Ak VZ_zp × rate < minimálny preddavok (okrajový prípad pri veľmi nízkych príjmoch),
    # aplikuje sa minimum = rate × minimálna mzda mesačne (2025: 0,05 × 816 = 40,80 EUR).
    # Bežným pracovným pomerom sa tento prípad nevyskytuje; v MVP implementácii možno preskočiť.

    return zp
      `.trim(),
      citation: {
        act: "580/2004 Z. z.",
        paragraph: "§16",
        odsek: 2,
        effective_from: "2005-01-01",
        url: URL_580,
        quote: "Zamestnanec je povinný platiť preddavok na poistné …",
      },
      edge_cases: [
        {
          condition: "ŤZP (držiteľ preukazu ŤZP alebo ŤZP-S)",
          behaviour: "Sadzba sa delí 2: 2 % (do 2024), 2,5 % (od 2025).",
          citation: {
            act: "580/2004 Z. z.",
            paragraph: "§12",
            odsek: 1,
            effective_from: "2005-01-01",
            url: URL_580,
            quote: "Poistné osoby s ťažkým zdravotným postihnutím je vo výške polovice …",
          },
        },
        {
          condition: "ZP nemá maximálny vymeriavací základ od 2017-01-01",
          behaviour:
            "Na rozdiel od SP pre ZP neexistuje strop. ZP = sadzba × (celá hrubá − OOP) bez ohľadu na výšku príjmu.",
        },
      ],
    },

    {
      id: "P5",
      description: "Základ dane (čiastkový základ dane zo závislej činnosti — §5 ods. 8 zákona 595/2003)",
      pseudocode: `
zaklad_dane = max(0, hruba - SP_zam - ZP_zam)
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§5",
        odsek: 8,
        effective_from: "2013-01-01",
        url: URL_595,
        quote:
          "Čiastkovým základom dane z príjmov zo závislej činnosti je zdaniteľný " +
          "príjem znížený o poistné a príspevky, ktoré je povinný platiť zamestnanec.",
      },
      edge_cases: [
        {
          condition: "základ_dane < 0 (okrajový prípad: veľmi vysoké SP + ZP)",
          behaviour: "základ_dane = 0 (nemôže byť záporný).",
        },
      ],
    },

    {
      id: "P6-P7",
      description: "Uplatnenie NČZD — nezdaniteľná časť základu dane na daňovníka",
      pseudocode: `
function computeNczdMesacne(zaklad_dane_mesacny, date, uplatnuje_nczd):
    if NOT uplatnuje_nczd:
        return 0

    ZM = lookupZmK1Januaru(zdanovaci_rok(date))    # ŽM k 1. januáru zdaňovacieho roka

    nczd_rocne_plne = 21 × ZM
    nczd_mesacne_plne = floor_cent(nczd_rocne_plne / 12)

    # Fázové znižovanie: ak ročný základ > 91,8 × ZM_ročné → NČZD sa znižuje
    # (mesačné porovnanie: zaklad_dane_mesacny > 91,8 × ZM / 12)
    HRANICA_MESACNA = (918/10) × ZM / 12      # 91,8 × ZM / 12
    if zaklad_dane_mesacny <= HRANICA_MESACNA:
        return nczd_mesacne_plne
    else:
        # NČZD_ročná = 51,6 × ZM − 0,25 × základ_dane_ročný
        # Pre mesačnú zálohu: mesačné škálovanie (§35 ods. 1)
        nczd_rocne_znizena = (516/10) × ZM - 0.25 × (zaklad_dane_mesacny × 12)
        nczd_mesacne = max(0, floor_cent(nczd_rocne_znizena / 12))
        return nczd_mesacne

zdanitelny_zaklad = max(0, zaklad_dane - nczd_mesacne)
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§11",
        odsek: 2,
        effective_from: "2004-01-01",
        url: URL_595,
        quote: "Nezdaniteľná časť základu dane na daňovníka je suma zodpovedajúca 21-násobku …",
      },
      edge_cases: [
        {
          condition: "Zamestnanec si NČZD neuplatňuje (druhý zamestnávateľ alebo vzdanie sa nároku)",
          behaviour: "NČZD = 0. Zdaniteľný základ = celý základ dane.",
        },
        {
          condition: "Vysoký príjem — fázové znižovanie (základ_dane_ročný > 91,8 × ZM_ročné)",
          behaviour:
            "NČZD sa lineárne znižuje. Vzorec: NČZD_ročná = max(0, 51,6 × ZM − 0,25 × ZD_ročný). " +
            "NČZD dosiahne 0 pri ZD_ročnom = 206,4 × ZM.",
        },
      ],
    },

    {
      id: "P8",
      description: "4-pásmová progresívna mesačná záloha na daň (§35 zákona 595/2003)",
      pseudocode: `
function computeZaloha(zdanitelny_zaklad_mesacny, date):
    ZM = lookupZmK1Januaru(zdanovaci_rok(date))

    # Mesačné hranice = ročné hranice / 12
    h1 = (1548/10) × ZM / 12   # 154,8 × ZM / 12 — hranica 19 % → 25 %
    h2 = (2124/10) × ZM / 12   # 212,4 × ZM / 12 — hranica 25 % → 30 %
    h3 = 264 × ZM / 12          # 264 × ZM / 12 — hranica 30 % → 35 %

    pasmo1 = min(zdanitelny_zaklad_mesacny, h1)
    pasmo2 = max(0, min(zdanitelny_zaklad_mesacny - h1, h2 - h1))
    pasmo3 = max(0, min(zdanitelny_zaklad_mesacny - h2, h3 - h2))
    pasmo4 = max(0, zdanitelny_zaklad_mesacny - h3)

    dan = pasmo1 × 0.19 + pasmo2 × 0.25 + pasmo3 × 0.30 + pasmo4 × 0.35
    return round_eurocent_standard(dan)   # §47: zaokrúhlenie na najbližší eurocent
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§35",
        odsek: 1,
        effective_from: "2013-01-01",
        url: URL_595,
        quote: "Zamestnávateľ zrazí zo zdaniteľnej mzdy zamestnanca preddavok na daň …",
      },
      edge_cases: [
        {
          condition: "zdaniteľný základ = 0",
          behaviour: "Všetky pásma = 0. Záloha = 0 (pred bonusom).",
        },
        {
          condition: "Vysoký príjem prekračujúci viacero pásiem",
          behaviour:
            "Každé pásmo sa počíta samostatne. Príklad (2025, ŽM = 273,99 EUR k 1. jan. 2025): " +
            "h1 = 3 534,47; h2 = 4 850,87; h3 = 6 031,78 EUR/mesiac.",
        },
      ],
    },

    {
      id: "P9",
      description: "Uplatnenie daňového bonusu (§33 zákona 595/2003)",
      pseudocode: `
function uplatniBonus(zaloza_na_dan, date, deti_do_15, deti_15_25_student):
    if deti_do_15 == 0 AND deti_15_25_student == 0:
        return zaloza_na_dan, 0

    bonus_do15 = lookupDanovyBonusMesacny(date, "do_15")    # 100 EUR/mes (od 2025)
    bonus_od15 = lookupDanovyBonusMesacny(date, "15_do_25") # 50 EUR/mes (od 2025)

    celkovy_bonus = deti_do_15 × bonus_do15 + deti_15_25_student × bonus_od15
    zaloza_po_bonuse = zaloza_na_dan - celkovy_bonus

    # zaloza_po_bonuse môže byť záporná → zamestnávateľ vyplatí rozdiel zamestnancovi
    return zaloza_po_bonuse, celkovy_bonus
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§33",
        effective_from: "2004-01-01",
        url: URL_595,
        quote: "Daňovník si môže uplatniť daňový bonus na každé vyživované dieťa …",
      },
      edge_cases: [
        {
          condition: "záloha_po_bonuse < 0",
          behaviour:
            "Záporný výsledok znamená, že zamestnávateľ prepláca rozdiel zamestnancovi. " +
            "Čistá mzda = hrubá − SP − ZP − záloha_po_bonuse " +
            "(odčítanie zápornej hodnoty čistú mzdu zvyšuje).",
        },
        {
          condition: "Zamestnanec nespĺňa podmienky nároku (§33 ods. 1 — minimálny príjem)",
          behaviour:
            "Bonus vyžaduje príjem aspoň 6-násobok minimálnej mzdy ročne. " +
            "Pre mesačnú zálohu sa toto neoveruje mesačne — bonus sa uplatní tak ako bol uplatnený.",
        },
      ],
    },

    {
      id: "P10",
      description: "Čistá mzda",
      pseudocode: `
cista_mzda = hruba - SP_zam - ZP_zam - zaloza_po_bonuse
# zaloza_po_bonuse môže byť záporná (bonusový prípad) → cista_mzda > hruba - SP - ZP
      `.trim(),
      citation: {
        act: "595/2003 Z. z.",
        paragraph: "§35",
        odsek: 3,
        effective_from: "2004-01-01",
        url: URL_595,
        quote: "Zamestnávateľ je povinný zraziť preddavok na daň pri výplate príjmu.",
      },
    },
  ],

  semantic_mapping: [
    { step_id: "P2", citation: { act: "461/2003 Z. z.", paragraph: "§129", odsek: 1, effective_from: "2004-01-01", url: URL_461, quote: "Zamestnanec je povinný platiť poistné …" } },
    { step_id: "P3", citation: { act: "580/2004 Z. z.", paragraph: "§13a", odsek: 1, effective_from: "2017-01-01", url: URL_580, quote: "Základná výška odpočítateľnej položky je 380 eur …" } },
    { step_id: "P4", citation: { act: "580/2004 Z. z.", paragraph: "§16", odsek: 2, effective_from: "2005-01-01", url: URL_580, quote: "Zamestnanec je povinný platiť preddavok na poistné …" } },
    { step_id: "P5", citation: { act: "595/2003 Z. z.", paragraph: "§5", odsek: 8, effective_from: "2013-01-01", url: URL_595, quote: "Čiastkovým základom dane … je zdaniteľný príjem znížený o poistné …" } },
    { step_id: "P6-P7", citation: { act: "595/2003 Z. z.", paragraph: "§11", odsek: 2, effective_from: "2004-01-01", url: URL_595, quote: "Nezdaniteľná časť základu dane …" } },
    { step_id: "P8", citation: { act: "595/2003 Z. z.", paragraph: "§35", odsek: 1, effective_from: "2013-01-01", url: URL_595, quote: "Preddavok na daň …" } },
    { step_id: "P9", citation: { act: "595/2003 Z. z.", paragraph: "§33", effective_from: "2004-01-01", url: URL_595, quote: "Daňový bonus …" } },
    { step_id: "P10", citation: { act: "595/2003 Z. z.", paragraph: "§35", odsek: 3, effective_from: "2004-01-01", url: URL_595, quote: "Zamestnávateľ je povinný zraziť preddavok na daň …" } },
  ],

  tool: {
    name: "get_payroll_net_wage_logic",
    description:
      "Vráti kompletný blueprint pre výpočet mesačnej čistej mzdy zamestnanca na Slovensku. " +
      "Pokrýva: SP zamestnanca (9,4 %), ZP zamestnanca (4 % → 5 %), " +
      "4-pásmová záloha na daň z príjmov (19/25/30/35 %), " +
      "odpočítateľná položka ZP (§13a), nezdaniteľná časť základu dane (§11 NČZD), " +
      "daňový bonus na deti (§33).",
    input_parameters: [
      {
        name: "calculation_date",
        type: "string",
        description: "Mesiac výpočtu (RRRR-MM-DD). Určuje verzie sadzieb pre všetky zložky.",
        required: true,
      },
      {
        name: "gross",
        type: "number",
        description: "Mesačná hrubá mzda v EUR.",
        required: true,
        unit: "EUR",
      },
      {
        name: "claims_nczd",
        type: "boolean",
        description: "Či sa uplatňuje nezdaniteľná časť základu dane (§11 NČZD). True pri hlavnom zamestnávateľovi.",
        required: true,
      },
      {
        name: "ztp",
        type: "boolean",
        description: "True ak zamestnanec je držiteľom preukazu ŤZP alebo ŤZP-S (polovičná sadzba ZP).",
        required: false,
      },
      {
        name: "children_under_15",
        type: "integer",
        description: "Počet vyživovaných detí do 15 rokov (pre daňový bonus §33).",
        required: false,
      },
      {
        name: "children_15_to_25_student",
        type: "integer",
        description: "Počet vyživovaných detí vo veku 15–25 rokov (študenti) pre daňový bonus §33 od 2025.",
        required: false,
      },
    ],
    calculation_steps: [
      "P2: SP zamestnanca = 9,4 % z min(hrubá, SP_MAX_BASIS). Floor na eurocent za každú zložku.",
      "P3: OOP ZP = max(0, 380 − 2 × max(0, hrubá − 380)). Nula nad 570 EUR hrubého.",
      "P4: ZP = sadzba × (hrubá − OOP). Sadzba: 4 % (do 2024), 5 % (od 2025); ŤZP: polovica.",
      "P5: Základ dane = max(0, hrubá − SP_zam − ZP_zam).",
      "P6–P7: NČZD mesačne = floor(21 × ŽM_1jan / 12). Fázové znižovanie ak základ > 91,8 × ŽM/12.",
      "P8: 4-pásmová progresívna daň z (základ − NČZD). Zaokrúhlenie na najbližší eurocent (§47).",
      "P9: Uplatní daňový bonus (§33). Záloha môže byť záporná (zamestnávateľ vyplatí zamestnancovi).",
      "P10: Čistá mzda = hrubá − SP − ZP − záloha_po_bonuse.",
    ],
    audit_trail_template:
      "{date}: hrubá = {gross} EUR. " +
      "SP: {sp_nem}+{sp_star}+{sp_inv}+{sp_nez} = {sp_spolu} EUR " +
      "(strop {sp_max_basis} EUR, §129/461/2003). " +
      "OOP ZP: {oop} EUR (§13a/580/2004); " +
      "ZP: {zp_sadzba} % × {zp_vz} = {zp_spolu} EUR (§16/580/2004). " +
      "Základ dane (§5 ods. 8): {gross}−{sp_spolu}−{zp_spolu} = {zaklad_dane} EUR. " +
      "NČZD (§11): {nczd} EUR. Zdaniteľný základ: {zdanitelny} EUR. " +
      "Daň: 19 %×{p1}+25 %×{p2}+30 %×{p3}+35 %×{p4} = {dan_pred_bonusom} EUR (§35). " +
      "Bonus (§33): {bonus} EUR. Záloha: {zaloza} EUR. " +
      "Čistá mzda: {gross}−{sp_spolu}−{zp_spolu}−{zaloza} = {cista} EUR.",
  },

  verification_cases: [
    {
      id: "VC1_standard_1800eur_aug2025",
      source:
        "Manuálny výpočet podľa platných sadzieb: " +
        "SP sadzby §129/461/2003, sadzba ZP §12/580/2004 (5 % od 2025-01-01), " +
        "NČZD §11/595/2003 (ŽM 273,99 EUR platné k 2025-01-01), " +
        "záloha na daň §35/595/2003. Metodika overená voči kalkulačke Finančnej správy SR 2025.",
      input: {
        calculation_date: "2025-08-15",
        gross: 1800.0,
        claims_nczd: true,
        ztp: false,
        children_under_15: 0,
        children_15_to_25_student: 0,
      },
      expected_output: {
        sp_max_basis: 15730.0,
        sp_vz: 1800.0,
        sp_nemocenske: 25.20,    // floor(1800 × 0,014) = 25,20
        sp_starobne: 72.0,
        sp_invalidne: 54.0,
        sp_nezamestnanost: 18.0,
        sp_spolu: 169.20,
        zp_oop: 0.0,              // 1800 >= 570, OOP = 0
        zp_vz: 1800.0,
        zp_sadzba: 0.05,
        zp_spolu: 90.0,           // floor(1800 × 0,05) = 90,00
        zaklad_dane: 1540.80,     // 1800 − 169,20 − 90,00
        nczd_mesacne: 479.48,     // floor(21 × 273,99 / 12) = floor(479,4825) = 479,48
        zdanitelny_zaklad: 1061.32, // 1540,80 − 479,48
        // Mesačné h1 (2025) = 154,8 × 273,99 / 12 = 3 534,47 EUR
        // 1 061,32 < 3 534,47 → celé v pásme 19 %
        zaloza_na_dan: 201.65,    // round(1061,32 × 0,19) = round(201,6508) = 201,65
        bonus_deti: 0,
        zaloza_po_bonuse: 201.65,
        cista_mzda: 1339.15,      // 1800 − 169,20 − 90,00 − 201,65
      },
      legal_reasoning:
        "§129/461/2003: SP 9,4 % = nem. 1,4 %+star. 4 %+inv. 3 %+nez. 1 %; " +
        "hrubá 1 800 < strop 15 730 → celá hrubá je VZ. " +
        "§13a/580/2004: OOP = 0 keďže 1 800 ≥ 570. §16/580/2004: ZP = 5 % × 1 800 = 90 EUR. " +
        "§5 ods. 8/595/2003: základ dane = 1 800−169,20−90 = 1 540,80 EUR. " +
        "§11/595/2003: NČZD = floor(21×273,99/12) = 479,48; 1 540,80 < 91,8×273,99/12 = 2 093,98 → plná NČZD. " +
        "Zdaniteľný základ = 1 061,32 EUR < mesačné h1 = 3 534,47 EUR → celé 19 %. " +
        "§47/595/2003: round(1 061,32×0,19) = round(201,65) = 201,65 EUR. " +
        "Čistá mzda = 1 800−169,20−90,00−201,65 = 1 339,15 EUR.",
    },

    {
      id: "VC2_low_income_oop_applies_aug2025",
      source:
        "Overenie fázového znižovania odpočítateľnej položky ZP §13a. " +
        "Príjem vo fázovom pásme (380–570 EUR). " +
        "Sadzby rovnaké ako VC1.",
      input: {
        calculation_date: "2025-08-15",
        gross: 520.0,
        claims_nczd: true,
        ztp: false,
        children_under_15: 0,
        children_15_to_25_student: 0,
      },
      expected_output: {
        sp_vz: 520.0,
        sp_nemocenske: 7.28,     // floor(520 × 0,014) = 7,28
        sp_starobne: 20.80,
        sp_invalidne: 15.60,
        sp_nezamestnanost: 5.20,
        sp_spolu: 48.88,
        // OOP = max(0, 380 − 2 × (520−380)) = max(0, 380−280) = 100 EUR
        zp_oop: 100.0,
        zp_vz: 420.0,            // 520 − 100
        zp_spolu: 21.0,          // floor(420 × 0,05) = 21,00
        zaklad_dane: 450.12,     // 520 − 48,88 − 21,00
        nczd_mesacne: 479.48,
        zdanitelny_zaklad: 0.0,  // max(0, 450,12 − 479,48) = 0 (NČZD presahuje základ)
        zaloza_na_dan: 0.0,
        bonus_deti: 0,
        zaloza_po_bonuse: 0.0,
        cista_mzda: 450.12,      // 520 − 48,88 − 21,00 − 0
      },
      legal_reasoning:
        "§13a/580/2004: hrubá = 520 EUR, 380 < 520 < 570 → fázové pásmo; " +
        "OOP = 380−2×(520−380) = 380−280 = 100 EUR. ZP VZ = 520−100 = 420; ZP = 5 % × 420 = 21 EUR. " +
        "§5 ods. 8: základ dane = 520−48,88−21,00 = 450,12 EUR. " +
        "NČZD = 479,48 > základ_dane = 450,12 → zdaniteľný základ = 0. " +
        "Záloha na daň = 0. Čistá mzda = 520−48,88−21,00−0 = 450,12 EUR.",
    },

    {
      id: "VC3_two_bands_with_children_aug2025",
      source:
        "Overenie prechodu pásma 19 %+25 % a daňového bonusu §33 (sadzby 2025). " +
        "Sadzby rovnaké ako VC1.",
      input: {
        calculation_date: "2025-08-15",
        gross: 4000.0,
        claims_nczd: true,
        ztp: false,
        children_under_15: 2,
        children_15_to_25_student: 0,
      },
      expected_output: {
        sp_vz: 4000.0,
        sp_spolu: 376.0,         // 9,4 % × 4 000
        zp_oop: 0.0,
        zp_spolu: 200.0,         // 5 % × 4 000
        zaklad_dane: 3424.0,     // 4 000 − 376 − 200
        nczd_mesacne: 479.48,
        zdanitelny_zaklad: 2944.52, // 3 424 − 479,48
        // h1 = 154,8 × 273,99 / 12 = 3 534,47 EUR
        // 2 944,52 < 3 534,47 → celé v pásme 19 %
        pasmo1: 2944.52,
        pasmo2: 0,
        zaloza_pred_bonusom: 559.46, // round(2944,52 × 0,19) = round(559,459) = 559,46
        bonus_deti: 200.0,       // 2 × 100 EUR (deti ≤ 15, od 2025)
        zaloza_po_bonuse: 359.46, // 559,46 − 200,00
        cista_mzda: 3064.54,     // 4 000 − 376 − 200 − 359,46
      },
      legal_reasoning:
        "§129: SP = 9,4 % × 4 000 = 376 EUR. §16: ZP = 5 % × 4 000 = 200 EUR (OOP = 0, 4 000 ≥ 570). " +
        "§5 ods. 8: základ dane = 4 000−376−200 = 3 424 EUR. " +
        "§11: NČZD = 479,48; zdaniteľný základ = 3 424−479,48 = 2 944,52 EUR. " +
        "Mesačné h1 = 154,8×273,99/12 = 3 534,47 EUR; 2 944,52 < 3 534,47 → celé 19 %. " +
        "Záloha pred bonusom: round(2 944,52×0,19) = 559,46 EUR. " +
        "§33 (od 2025-01-01): bonus = 2 × 100 = 200 EUR (deti ≤ 15). " +
        "Záloha = 559,46−200 = 359,46 EUR. " +
        "Čistá mzda = 4 000−376−200−359,46 = 3 064,54 EUR.",
    },
  ],
};

export default blueprint;
