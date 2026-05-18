/**
 * Blueprint: SK Garnishment — Tretinkový systém (one-thirds system)
 *
 * Jurisdiction:  SK
 * Topic:         Exekučné zrážky zo mzdy povinného
 * Legal acts:    NV SR 268/2006 Z. z. (rozsah zrážok)
 *                Zákon NR SR 233/1995 Z. z. (Exekučný poriadok), §70–§72
 *                Zákon č. 601/2003 Z. z. (životné minimum)
 *                Občiansky súdny poriadok 99/1963 Zb. §278–§279 (historický zdroj)
 *
 * This blueprint covers ONLY the algorithmic core: how a single net-wage
 * amount is reduced by the non-deductible base and split into thirds, plus
 * how the thirds are distributed across multiple executions. Periphery
 * (e.g. computing the net wage from gross, rate-table maintenance, rounding
 * tables for life-minimum adjustments) is deliberately out of scope and
 * lives in adjacent blueprints.
 */

import type { Blueprint } from "./types.js";

const URL_268 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2006/268/";
const URL_233 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/1995/233/";

const blueprint: Blueprint = {
  id: "sk-garnishment-thirds",
  title: "Exekučné zrážky zo mzdy — tretinkový systém (SK)",
  version: "1.1.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Algoritmus výpočtu zrážok zo mzdy v rámci výkonu rozhodnutia podľa " +
    "NV 268/2006 Z. z. a §70–§72 Exekučného poriadku 233/1995 Z. z. " +
    "Pokrýva: stanovenie nezraziteľnej základnej sumy, prírastok na " +
    "vyživované osoby, rozdelenie zvyšku čistej mzdy na tretiny, sumu " +
    "bez obmedzenia (nadlimit) a distribúciu tretín medzi viaceré " +
    "exekúcie podľa typu pohľadávky a poradia doručenia.",

  legal_acts: [
    {
      act: "268/2006 Z. z.",
      title: "Nariadenie vlády SR o rozsahu zrážok zo mzdy pri výkone rozhodnutia",
      url: URL_268,
    },
    {
      act: "233/1995 Z. z.",
      title: "Zákon NR SR o súdnych exekútoroch a exekučnej činnosti (Exekučný poriadok)",
      url: URL_233,
    },
    {
      act: "601/2003 Z. z.",
      title: "Zákon o životnom minime",
      url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/601/",
    },
  ],

  interpretation_notes: [
    {
      issue:
        "§4 NV 268/2006 v účinnosti do 31.12.2008 hovorí 'zaokrúhľujú sa " +
        "na celé koruny smerom nadol'. Po prechode na euro a v aktuálnom " +
        "znení účinnom od 01.07.2009 sa zaokrúhľuje na eurocenty nadol.",
      chosen_interpretation:
        "Pre dátumy >= 2009-01-01 sa všetky sumy podľa §1 a §3 ods. 1 " +
        "zaokrúhľujú na eurocenty smerom nadol (1 cent presnosť).",
      rationale:
        "Zákon č. 659/2007 Z. z. o zavedení meny euro v SR; metodické " +
        "usmernenie MPSVR k prepočtu súm životného minima na euro.",
    },
    {
      issue:
        "§71 ods. 1 EP: 'Zvyšok čistej mzdy sa zaokrúhli na sumu " +
        "deliteľnú troma …'. Zákon nehovorí explicitne smer zaokrúhlenia.",
      chosen_interpretation:
        "Zaokrúhľuje sa NADOL (floor) tak, aby každá tretina bola celé " +
        "číslo eurocentov a aby povinnému nemohla byť zrazená vyššia suma " +
        "ako pripúšťa zákon. Sub-centové zvyšky (max 2 centy) zostávajú " +
        "povinnému.",
      rationale:
        "Ustálená výkladová prax MPSVR a Komory exekútorov; ochrana " +
        "povinného pred neoprávneným prevýšením zrážky.",
    },
    {
      issue:
        "§72 ods. 3 EP: pri exekúciách s rovnakým poradím doručenia sa " +
        "uspokojujú pomerne. Nie je špecifikované čo s centovými zvyškami " +
        "po pomernom rozdelení.",
      chosen_interpretation:
        "Použije sa metóda najväčšieho zvyšku (Hamilton / largest-remainder): " +
        "celý fond je vyčerpaný v rámci skupiny rovnakého poradia, zvyšné " +
        "centy idú pohľadávke s najväčším zlomkovým zvyškom (a stále voľnou " +
        "kapacitou). Centové zvyšky sa NESMÚ preliať do skupiny s vyšším " +
        "poradím — tým by sa porušilo poradie.",
      rationale:
        "Štandardná účtovná interpretácia 'pomernosti' s ochranou poradia " +
        "podľa §72 ods. 1 EP.",
    },
  ],

  axiomatic_core: [
    {
      name: "ZM",
      definition: "Životné minimum na plnoletú fyzickú osobu, mesačné, platné v mesiaci výkonu zrážok",
      value: "rate_table(601/2003 §2 písm. a, accommodation_date)",
      citation: {
        act: "601/2003 Z. z.",
        paragraph: "§2",
        pismeno: "a",
        effective_from: "2003-12-01",
        url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/601/",
        quote:
          "Životné minimum plnoletej fyzickej osoby … je suma stanovená " +
          "opatrením MPSVR SR vyhláseným k 1. júlu kalendárneho roka.",
      },
      effective_periods: [
        { from: "2024-07-01", to: "2025-06-30", value: "273.99 EUR (opatrenie MPSVR SR 220/2024 Z. z.)" },
        { from: "2025-07-01", to: "2026-06-30", value: "284.13 EUR (opatrenie MPSVR SR 168/2025 Z. z.)" },
      ],
    },

    {
      name: "K_BASE",
      definition: "Koeficient základnej nezraziteľnej sumy (§1 ods. 1 NV 268/2006)",
      value: "0.60 (do 2015-12-31) | 1.00 (2016-01-01 až 2021-12-31) | 1.40 (od 2022-01-01)",
      citation: {
        act: "268/2006 Z. z.",
        paragraph: "§1",
        odsek: 1,
        effective_from: "2022-01-01",
        url: URL_268,
        quote:
          "Základná suma, ktorá sa nesmie zraziť povinnému z jeho mesačnej mzdy, " +
          "je 140 % zo životného minima na plnoletú fyzickú osobu platného " +
          "v mesiaci, za ktorý sa vykonávajú zrážky.",
      },
      effective_periods: [
        { from: "2006-07-01", to: "2015-12-31", value: "0.60", note: "60 % ZM" },
        { from: "2016-01-01", to: "2021-12-31", value: "1.00", note: "100 % ZM (novela 292/2015)" },
        { from: "2022-01-01", value: "1.40", note: "140 % ZM (novela 390/2021)" },
      ],
    },

    {
      name: "K_DEPENDANT",
      definition: "Prírastok na vyživovanú osobu (§1 ods. 2 NV 268/2006)",
      value: "0.25 × ZM (do 2021-12-31) | 0.25 × základná suma (od 2022-01-01)",
      citation: {
        act: "268/2006 Z. z.",
        paragraph: "§1",
        odsek: 2,
        effective_from: "2006-07-01",
        url: URL_268,
        quote:
          "Na každú osobu, ktorej povinný poskytuje výživné, sa započítava " +
          "25 % zo základnej sumy určenej podľa odseku 1; rovnako to platí " +
          "aj na manžela povinného, ktorý má samostatný príjem.",
      },
      effective_periods: [
        { from: "2006-07-01", to: "2021-12-31", value: "0.25 × ZM" },
        { from: "2022-01-01", value: "0.25 × ZÁKLADNÁ", note: "Výklad MPSVR k novele 390/2021: 25 % zo základnej sumy podľa §1 ods. 1, nie zo ŽM." },
      ],
    },

    {
      name: "K_MINOR_ALIMONY",
      definition: "Koeficient zníženia základu pri výživnom pre maloleté dieťa (§70 ods. 2 EP 233/1995)",
      value: "0.70 × základná suma podľa §1 NV 268/2006",
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§70",
        odsek: 2,
        effective_from: "2006-07-01",
        url: URL_233,
        quote:
          "Ak ide o výživné pre maloleté dieťa, základná suma, ktorú " +
          "povinnému nemožno zraziť z mesačnej mzdy, je 70 % základnej " +
          "sumy určenej podľa odseku 1.",
      },
    },

    {
      name: "STROP",
      definition: "Suma, nad ktorú sa zvyšok čistej mzdy zrazí bez obmedzenia (§3 ods. 1 NV 268/2006)",
      value: "1.50 × ZM (do 2021-12-31) | 3 × základná suma podľa §1 (od 2022-01-01)",
      citation: {
        act: "268/2006 Z. z.",
        paragraph: "§3",
        odsek: 1,
        effective_from: "2022-01-01",
        url: URL_268,
        quote:
          "Suma, nad ktorú sa zvyšok čistej mzdy povinného zrazí bez " +
          "obmedzenia, je trojnásobok základnej sumy určenej podľa " +
          "ustanovenia § 1 ods. 1.",
      },
      effective_periods: [
        { from: "2006-07-01", to: "2021-12-31", value: "1.50 × ZM" },
        { from: "2022-01-01", value: "3 × základná suma podľa §1 ods. 1", note: "Novela 390/2021: trojnásobok základnej sumy = 3 × 1.40 × ZM = 4.20 × ZM." },
      ],
    },
  ],

  execution_order: [
    "STEP_S1: Stanov dátum účinnosti zákonných sadzieb pre mesiac výkonu zrážok.",
    "STEP_S2: Vyhľadaj ZM platné v danom mesiaci.",
    "STEP_S3: Vypočítaj základnú nezraziteľnú sumu podľa typu pohľadávky a typu povinného.",
    "STEP_S4: Pripočítaj prírastky na vyživované osoby (s vylúčeniami podľa §2 ods. 5 NV 268/2006).",
    "STEP_S5: Vypočítaj zvyšok čistej mzdy = NETTO − nezraziteľná suma.",
    "STEP_S6: Ak zvyšok ≤ 0, koniec — ŽIADNA ZRÁŽKA.",
    "STEP_S7: Vypočítaj STROP a oddel NADLIMIT (časť zvyšku nad STROP).",
    "STEP_S8: Časť zvyšku v rozsahu (0, STROP] zaokrúhli nadol na sumu deliteľnú 3 centami.",
    "STEP_S9: Rozdeľ zaokrúhlenú sumu na tri rovnaké tretiny.",
    "STEP_S10: Pridaj NADLIMIT k 1. tretine (1. tretina = TRETINA + NADLIMIT).",
    "STEP_S11: Sub-centové zvyšky zo zaokrúhlenia (max 2 centy) zostávajú povinnému (3. tretina).",
    "STEP_S12: Rozdeľ tretiny medzi exekúcie podľa pravidiel §72 EP (viď logic_flow S12.*)",
  ],

  logic_flow: [
    {
      id: "S3",
      description: "Stanov základnú nezraziteľnú sumu",
      pseudocode: `
function basicNonDeductible(date, claim_type, debtor_type):
    K = lookup(K_BASE, date)
    ZM = lookup(ZM, date)
    if claim_type == "minor_alimony":
        # §70 ods. 2 EP: 70% základnej sumy podľa odseku 1
        base = floor_to_cent(0.70 * K * ZM)
    elif debtor_type == "pensioner" and date >= 2013-11-01:
        # §2a: pre dôchodcu osobitný režim
        base = floor_to_cent(K * ZM)   # zhodný so základom §1
    elif claim_type == "misdemeanour":
        # §2b: 50% ZM
        base = floor_to_cent(0.50 * ZM)
    else:
        base = floor_to_cent(K * ZM)
    return base
      `.trim(),
      citation: {
        act: "268/2006 Z. z.",
        paragraph: "§1, §2, §2a, §2b",
        effective_from: "2006-07-01",
        url: URL_268,
        quote:
          "Základná suma, ktorá sa nesmie zraziť povinnému z jeho mesačnej mzdy, " +
          "je 140 % zo životného minima na plnoletú fyzickú osobu platného " +
          "v mesiaci, za ktorý sa vykonávajú zrážky.",
      },
      edge_cases: [
        {
          condition: "claim_type == minor_alimony",
          behaviour: "základ = 0.70 × základnej sumy podľa §70 ods. 1 EP (= §1 NV 268/2006 base)",
          citation: {
            act: "233/1995 Z. z.",
            paragraph: "§70",
            odsek: 2,
            effective_from: "2006-07-01",
            url: URL_233,
            quote:
              "Ak ide o výživné pre maloleté dieťa, základná suma, ktorú " +
              "povinnému nemožno zraziť z mesačnej mzdy, je 70 % základnej " +
              "sumy určenej podľa odseku 1.",
          },
        },
        {
          condition: "debtor_type == pensioner AND date >= 2013-11-01",
          behaviour: "Aplikuje sa §2a; pre dátumy pred 2013-11-01 použiť bežný §1 (osobitná úprava §2a vtedy ešte neexistovala).",
        },
      ],
    },

    {
      id: "S4",
      description: "Pripočítaj prírastky na vyživované osoby",
      pseudocode: `
function withDependants(base, date, dependants, claim_type):
    K_DEP = lookup(K_DEPENDANT, date)
    ZM = lookup(ZM, date)

    # §2 ods. 5 NV 268/2006: na osobu v ktorej prospech sa exekúcia vedie sa NEZAPOČÍTAVA
    countable = dependants - (1 if claim_type == "alimony_for_this_person" else 0)
    countable = max(countable, 0)

    if date < 2022-01-01:
        per_person = floor_to_cent(K_DEP * ZM)         # 0.25 × ZM
    else:
        per_person = floor_to_cent(K_DEP * base)       # 0.25 × základná
    return base + countable * per_person
      `.trim(),
      citation: {
        act: "268/2006 Z. z.",
        paragraph: "§1",
        odsek: 2,
        effective_from: "2006-07-01",
        url: URL_268,
        quote:
          "Na každú osobu, ktorej povinný poskytuje výživné, sa započítava " +
          "25 % zo základnej sumy určenej podľa odseku 1; rovnako to platí " +
          "aj na manžela povinného, ktorý má samostatný príjem.",
      },
      edge_cases: [
        {
          condition: "Exekúcia je v prospech vyživovanej osoby (typ: alimony)",
          behaviour: "Táto osoba sa nezapočítava do prírastku (§2 ods. 5 NV 268/2006).",
          citation: {
            act: "268/2006 Z. z.",
            paragraph: "§2",
            odsek: 5,
            effective_from: "2006-07-01",
            url: URL_268,
            quote:
              "Ustanovenia odsekov 3 a 4 sa nepoužijú, ak ide o osobu, " +
              "v ktorej prospech trvá výkon rozhodnutia na vymoženie " +
              "pohľadávky výživného.",
          },
        },
        {
          condition: "Obaja manželia majú zrážky zo mzdy a zdieľajú vyživované dieťa",
          behaviour: "Dieťa sa započítava každému z manželov osobitne (§1 ods. 3).",
        },
      ],
    },

    {
      id: "S6",
      description: "Edge case: zvyšok čistej mzdy je nulový alebo záporný",
      pseudocode: `
remainder = NETTO - non_deductible_total
if remainder <= 0:
    return GarnishmentResult(deduction = 0, all_thirds = 0, reason = "S6_no_remainder")
      `.trim(),
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§70",
        odsek: 1,
        effective_from: "2006-01-01",
        url: URL_233,
        quote:
          "Povinnému sa nesmie zraziť z mesačnej mzdy alebo z iných príjmov " +
          "základná suma; spôsoby jej výpočtu ustanoví nariadením vláda " +
          "Slovenskej republiky.",
      },
    },

    {
      id: "S7-S10",
      description: "Tretinkové delenie + nadlimit nad STROP",
      pseudocode: `
function splitIntoThirds(remainder, date):
    STROP = lookup(STROP, date)
    over_limit = max(0, remainder - STROP)        # §3 ods. 1 NV 268/2006
    to_split   = min(remainder, STROP)

    # Zaokrúhľujeme NADOL na sumu deliteľnú 3 CENTAMI:
    cents = floor(to_split * 100)
    rounded_cents = (cents // 3) * 3
    rounded_amount = rounded_cents / 100

    third = rounded_amount / 3
    sub_cent_remainder = to_split - rounded_amount   # 0..2 centy

    return {
        first_third:  third + over_limit,            # bežné + nadlimit
        second_third: third,                          # prednostné
        third_third:  third + sub_cent_remainder,    # zostáva povinnému
        over_limit:   over_limit,
    }
      `.trim(),
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§71",
        odsek: 1,
        effective_from: "2006-01-01",
        url: URL_233,
        quote:
          "Z čistej mzdy, ktorá zostáva po odpočítaní základnej sumy a ktorá " +
          "sa zaokrúhli na eurocenty smerom nadol na sumu deliteľnú troma, " +
          "možno zraziť na vymoženie pohľadávky oprávneného len jednu tretinu. " +
          "Na prednostné pohľadávky uvedené v odseku 2 sa zrážajú dve tretiny. " +
          "Prednostné pohľadávky sa uspokojujú najprv z druhej tretiny, a až " +
          "vtedy, ak táto tretina na ich úhradu nestačí, uspokojujú sa spolu " +
          "s ostatnými pohľadávkami z prvej tretiny.",
      },
      edge_cases: [
        {
          condition: "remainder > STROP",
          behaviour: "Časť nad STROP (NADLIMIT) sa pridá k 1. tretine bez obmedzenia.",
          citation: {
            act: "268/2006 Z. z.",
            paragraph: "§3",
            odsek: 1,
            effective_from: "2022-01-01",
            url: URL_268,
            quote:
              "Suma, nad ktorú sa zvyšok čistej mzdy povinného zrazí bez " +
              "obmedzenia, je trojnásobok základnej sumy určenej podľa " +
              "ustanovenia § 1 ods. 1.",
          },
        },
        {
          condition: "remainder ∈ (0, 3 centy)",
          behaviour: "rounded_amount = 0; všetky tretiny = 0; celý zvyšok zostáva povinnému.",
        },
        {
          condition: "Sub-centové zvyšky (1 alebo 2 centy zo zaokrúhlenia)",
          behaviour: "Pripočítavajú sa k 3. tretine — zostávajú povinnému, NESMÚ sa zrážať.",
        },
      ],
    },

    {
      id: "S12.1",
      description: "Distribúcia 2. tretiny — prednostné pohľadávky a výživné",
      pseudocode: `
function distributeSecondThird(fund_2, executions):
    # 1) Bežné výživné všetkých oprávnených — pomerne podľa pomeru bežného výživného
    alimony_current = filter(executions, e => e.is_alimony AND e.current_alimony > 0)
    total_current = sum(alimony_current.current_alimony)
    pay_current = min(fund_2, total_current)
    distribute_pro_rata(pay_current, alimony_current, by="current_alimony")
    fund_2 -= pay_current

    # 2) Nedoplatky výživného — pomerne podľa pomeru bežného výživného
    if fund_2 > 0:
        alimony_arrears = filter(executions, e => e.is_alimony AND e.alimony_arrears > 0)
        total_arrears = sum(alimony_arrears.alimony_arrears)
        pay_arrears = min(fund_2, total_arrears)
        distribute_pro_rata(pay_arrears, alimony_arrears, by="current_alimony")
        fund_2 -= pay_arrears

    # 3) Ostatné prednostné — podľa poradia (FIFO podľa dňa doručenia)
    if fund_2 > 0:
        priority_non_alimony = filter(executions, e => e.is_priority AND NOT e.is_alimony)
        for group in group_by_arrival_order(priority_non_alimony):
            if fund_2 <= 0: break
            balances = [remaining_balance(e) for e in group]
            if sum(balances) <= fund_2:
                distribute_full(group, balances)
                fund_2 -= sum(balances)
            else:
                # §72 ods. 3: pomerne, metóda najväčšieho zvyšku
                distribute_largest_remainder(fund_2, group, balances)
                fund_2 = 0
      `.trim(),
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§72",
        odsek: 2,
        effective_from: "2006-01-01",
        url: URL_233,
        quote:
          "Ak podľa § 71 ods. 1 sa vykonávajú zrážky z druhej tretiny zvyšku " +
          "čistej mzdy, uspokoja sa z nej bez zreteľa na poradie najskôr " +
          "pohľadávky výživného a až potom podľa poradia ostatné prednostné " +
          "pohľadávky. Ak suma zrazená z druhej tretiny nestačí na uspokojenie " +
          "všetkých pohľadávok výživného, uspokojí sa najprv bežné výživné " +
          "všetkých oprávnených a až potom nedoplatky za skorší čas, a to " +
          "podľa pomeru bežného výživného. Ak by však sumou zrazenou z druhej " +
          "tretiny nebolo kryté ani bežné výživné všetkých oprávnených, rozdelí " +
          "sa medzi nich suma zrazená z druhej tretiny pomerne podľa výšky " +
          "bežného výživného bez ohľadu na výšku nedoplatkov.",
      },
      edge_cases: [
        {
          condition: "Viacero exekúcií s rovnakým dátumom doručenia (rovnaké poradie)",
          behaviour: "Pomerne podľa zostatku pohľadávky. Centové zvyšky riešené metódou najväčšieho zvyšku v rámci skupiny.",
          citation: {
            act: "233/1995 Z. z.",
            paragraph: "§72",
            odsek: 3,
            effective_from: "2006-01-01",
            url: URL_233,
            quote:
              "Poradie pohľadávok sa spravuje dňom, keď sa platiteľovi mzdy " +
              "doručil príkaz na začatie exekúcie. Ak sa mu doručil toho istého " +
              "dňa príkaz na začatie exekúcie pre niekoľko pohľadávok, majú " +
              "tieto pohľadávky rovnaké poradie; ak nestačí suma na ne " +
              "pripadajúca na ich plné uspokojenie, uspokoja sa pomerne.",
          },
        },
      ],
    },

    {
      id: "S12.2",
      description: "Distribúcia 1. tretiny — všetky exekúcie podľa poradia (FIFO)",
      pseudocode: `
function distributeFirstThird(fund_1, executions):
    for group in group_by_arrival_order(executions):
        if fund_1 <= 0: break
        balances = []
        for e in group:
            if e.is_alimony:
                # výživné z 1. tretiny len do výšky bežné + nedoplatok
                cap = e.current_alimony + e.alimony_arrears - already_paid(e)
            else:
                cap = e.total_claim - already_paid(e)
            balances.push(max(0, cap))
        total = sum(balances)
        if total <= fund_1:
            distribute_full(group, balances)
            fund_1 -= total
        else:
            distribute_largest_remainder(fund_1, group, balances)
            fund_1 = 0
      `.trim(),
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§72",
        odsek: 1,
        effective_from: "2006-01-01",
        url: URL_233,
        quote:
          "Ak sa zrážky zo mzdy vykonávajú na vymoženie niekoľkých pohľadávok, " +
          "jednotlivé pohľadávky sa uspokoja z prvej tretiny zvyšku čistej mzdy " +
          "podľa svojho poradia bez ohľadu na to, či ide o prednostné pohľadávky " +
          "alebo o ostatné pohľadávky.",
      },
    },
  ],

  semantic_mapping: [
    {
      step_id: "S3",
      citation: {
        act: "268/2006 Z. z.",
        paragraph: "§1, §2, §2a, §2b",
        effective_from: "2006-07-01",
        url: URL_268,
        quote:
          "Základná suma, ktorá sa nesmie zraziť povinnému z jeho mesačnej mzdy, " +
          "je 140 % zo životného minima na plnoletú fyzickú osobu platného " +
          "v mesiaci, za ktorý sa vykonávajú zrážky.",
      },
    },
    {
      step_id: "S4",
      citation: {
        act: "268/2006 Z. z.",
        paragraph: "§1",
        odsek: 2,
        effective_from: "2006-07-01",
        url: URL_268,
        quote:
          "Na každú osobu, ktorej povinný poskytuje výživné, sa započítava " +
          "25 % zo základnej sumy určenej podľa odseku 1; rovnako to platí " +
          "aj na manžela povinného, ktorý má samostatný príjem.",
      },
    },
    {
      step_id: "S6",
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§70",
        odsek: 1,
        effective_from: "2006-01-01",
        url: URL_233,
        quote:
          "Povinnému sa nesmie zraziť z mesačnej mzdy alebo z iných príjmov " +
          "základná suma; spôsoby jej výpočtu ustanoví nariadením vláda " +
          "Slovenskej republiky.",
      },
    },
    {
      step_id: "S7-S10",
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§71",
        odsek: 1,
        effective_from: "2006-01-01",
        url: URL_233,
        quote:
          "Z čistej mzdy, ktorá zostáva po odpočítaní základnej sumy a ktorá " +
          "sa zaokrúhli na eurocenty smerom nadol na sumu deliteľnú troma, " +
          "možno zraziť na vymoženie pohľadávky oprávneného len jednu tretinu. " +
          "Na prednostné pohľadávky uvedené v odseku 2 sa zrážajú dve tretiny. " +
          "Prednostné pohľadávky sa uspokojujú najprv z druhej tretiny, a až " +
          "vtedy, ak táto tretina na ich úhradu nestačí, uspokojujú sa spolu " +
          "s ostatnými pohľadávkami z prvej tretiny.",
      },
    },
    {
      step_id: "S12.1",
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§72",
        odsek: 2,
        effective_from: "2006-01-01",
        url: URL_233,
        quote:
          "Ak podľa § 71 ods. 1 sa vykonávajú zrážky z druhej tretiny zvyšku " +
          "čistej mzdy, uspokoja sa z nej bez zreteľa na poradie najskôr " +
          "pohľadávky výživného a až potom podľa poradia ostatné prednostné pohľadávky.",
      },
    },
    {
      step_id: "S12.2",
      citation: {
        act: "233/1995 Z. z.",
        paragraph: "§72",
        odsek: 1,
        effective_from: "2006-01-01",
        url: URL_233,
        quote:
          "Ak sa zrážky zo mzdy vykonávajú na vymoženie niekoľkých pohľadávok, " +
          "jednotlivé pohľadávky sa uspokoja z prvej tretiny zvyšku čistej mzdy " +
          "podľa svojho poradia bez ohľadu na to, či ide o prednostné pohľadávky " +
          "alebo o ostatné pohľadávky.",
      },
    },
  ],

  tool: {
    name: "get_garnishment_logic",
    description:
      "Vráti kompletný blueprint pre výpočet exekučných zrážok zo mzdy " +
      "(SK, NV 268/2006 + EP 233/1995 §70–§72). Použiteľné LLM ako Source " +
      "of Truth pre implementáciu mzdového / exekučného modulu.",
    input_parameters: [
      {
        name: "calculation_date",
        type: "string",
        description: "Dátum mesiaca, za ktorý sa zrážky vykonávajú (YYYY-MM-DD). Určuje verziu zákona a tabuľku ŽM.",
        required: true,
      },
      {
        name: "net_wage",
        type: "number",
        description: "Čistá mzda povinného za daný mesiac.",
        required: true,
        unit: "EUR",
      },
      {
        name: "dependants",
        type: "integer",
        description: "Počet osôb, ktorým povinný poskytuje výživné (vrátane manžela so samostatným príjmom).",
        required: true,
      },
      {
        name: "debtor_type",
        type: "string",
        description: "Typ povinného: 'standard' alebo 'pensioner' (od 2013-11-01 osobitný režim §2a).",
        required: true,
        enum: ["standard", "pensioner"],
      },
      {
        name: "executions",
        type: "array",
        description:
          "Pole exekúcií. Každá má: name, total_claim, is_priority, is_alimony, " +
          "is_minor_alimony, arrival_order (integer), current_alimony (EUR/mes), alimony_arrears (EUR).",
        required: true,
      },
    ],
    calculation_steps: [
      "1. Vyhľadaj K_BASE, K_DEPENDANT, STROP, ZM platné pre `calculation_date`.",
      "2. Vypočítaj nezraziteľnú základnú sumu (základ + prírastky podľa S3, S4).",
      "3. Vypočítaj zvyšok čistej mzdy. Ak ≤ 0, vráť výsledok bez zrážky (S6).",
      "4. Oddel NADLIMIT a zaokrúhli zvyšok pod stropom nadol na sumu deliteľnú 3 centami (S7).",
      "5. Rozdeľ na tretiny; 1. tretina += NADLIMIT; 3. tretina += sub-centový zvyšok (S8–S11).",
      "6. Distribuuj 2. tretinu: bežné výživné → nedoplatky výživného → ostatné prednostné podľa poradia (S12.1).",
      "7. Distribuuj 1. tretinu: všetky exekúcie FIFO; výživné limitované na bežné+nedoplatok (S12.2).",
      "8. Sub-centové zvyšky a 3. tretina zostávajú povinnému.",
    ],
    audit_trail_template:
      "Mesiac {calculation_date}: ZM={zm} EUR. Základná nezraziteľná suma " +
      "{base} EUR (§1 NV 268/2006) + {dependants}×{per_dependant} EUR za " +
      "vyživované osoby (§1 ods. 2) = {non_deductible_total} EUR. " +
      "Čistá mzda {net_wage} EUR − {non_deductible_total} EUR = zvyšok " +
      "{remainder} EUR. STROP = {strop} EUR (§3 NV 268/2006); NADLIMIT = " +
      "{over_limit} EUR. Zaokrúhlený zvyšok pod stropom = {rounded_amount} " +
      "EUR (§71 ods. 1 EP). Tretiny: 1. = {first_third} EUR (vrát. nadlimitu), " +
      "2. = {second_third} EUR, 3. = {third_third} EUR (zostáva povinnému). " +
      "Distribúcia podľa §72 EP: {distribution_summary}.",
  },

  verification_cases: [
    {
      id: "VC1_simple_no_dependants_2025",
      source:
        "Aether.Logic golden suite (tests/golden/executions/) — Opatrenie MPSVR SR " +
        "168/2025 Z. z., ŽM platné od 2025-07-01: 284.13 EUR.",
      input: {
        calculation_date: "2025-08-15",
        net_wage: 1000.0,
        dependants: 0,
        debtor_type: "standard",
        executions: [
          {
            name: "EX-001 nepriorita",
            total_claim: 5000.0,
            is_priority: false,
            is_alimony: false,
            is_minor_alimony: false,
            arrival_order: 1,
            current_alimony: 0,
            alimony_arrears: 0,
          },
        ],
      },
      expected_output: {
        zm: 284.13,
        base_non_deductible: 397.78, // floor_to_cent(1.40 × 284.13) = floor(397.782) = 397.78
        non_deductible_total: 397.78,
        remainder: 602.22, // 1000.00 − 397.78
        strop: 1193.34, // 3 × 397.78
        over_limit: 0,
        rounded_amount: 602.22, // 60222 centov je deliteľné 3 (60222/3=20074)
        first_third: 200.74,
        second_third: 200.74,
        third_third: 200.74, // sub-cent zvyšok = 0
        deduction_total: 200.74, // jediná exekúcia (nepriorita) dostane len 1. tretinu
        per_execution: [
          { name: "EX-001 nepriorita", deduction: 200.74 },
        ],
      },
      legal_reasoning:
        "Bezdetný povinný, jedna nepriorita. §1 ods. 1 NV 268/2006: 1.40 × 284.13 = " +
        "397.782 → 397.78 EUR (§4 — nadol na cent). §3 ods. 1: STROP = 3 × " +
        "397.78 = 1193.34 EUR; remainder 602.22 < STROP → NADLIMIT = 0. " +
        "§71 ods. 1 EP: 602.22 EUR = 60222 centov; 60222 je deliteľné 3 → " +
        "rounded = 602.22 EUR. Tretina = 200.74 EUR. Žiadny sub-centový " +
        "zvyšok. §72: nepriorita berie len 1. tretinu, kým sa neuspokoja " +
        "prednostné — keďže prednostné nie sú, 1. tretina ide celá EX-001.",
    },

    {
      id: "VC2_two_dependants_with_alimony_2025",
      source:
        "Modelový príklad k novele 390/2021 — povinný so 2 deťmi a " +
        "exekúciou výživného pre maloleté dieťa, ŽM od 2025-07-01 = 284.13 EUR " +
        "(Opatrenie MPSVR SR 168/2025 Z. z.).",
      input: {
        calculation_date: "2025-08-15",
        net_wage: 1500.0,
        dependants: 2,
        debtor_type: "standard",
        executions: [
          {
            name: "EX-A vyživné na maloleté dieťa A",
            total_claim: 999999.0,
            is_priority: true,
            is_alimony: true,
            is_minor_alimony: true,
            arrival_order: 1,
            current_alimony: 250.0,
            alimony_arrears: 0,
          },
        ],
      },
      expected_output: {
        zm: 284.13,
        // §70 ods. 2 EP: pre výživné na maloleté = 0.70 × §1 base = 0.70 × 397.78 = 278.446 → 278.44
        base_non_deductible: 278.44,
        // §2 ods. 5 NV 268/2006: dieťa v ktorého prospech ide výživné sa NEzapočítava → countable = 1
        per_dependant: 99.44, // 0.25 × 397.78 = 99.445 → 99.44
        non_deductible_total: 377.88, // 278.44 + 1 × 99.44
        remainder: 1122.12, // 1500.00 − 377.88
        strop: 1193.34, // 3 × 397.78
        over_limit: 0,
        rounded_amount: 1122.12, // 112212 deliteľné 3 (112212/3=37404)
        first_third: 374.04,
        second_third: 374.04,
        third_third: 374.04, // sub-cent = 0
        // bežné výživné 250.00 ide z 2. tretiny; zvyšok 2. tretiny (124.04) by išiel na nedoplatky výživného (žiadne) a potom ostatné prednostné (žiadne)
        per_execution: [
          { name: "EX-A vyživné na maloleté dieťa A", deduction: 250.0, from_fund_2: 250.0, from_fund_1: 0 },
        ],
      },
      legal_reasoning:
        "§70 ods. 2 EP 233/1995: pre výživné na maloleté = 0.70 × základnej sumy " +
        "podľa odseku 1 = 0.70 × 397.78 = 278.446 → 278.44 EUR. §2 ods. 5 NV " +
        "268/2006: dieťa v ktorého prospech ide výživné sa NEzapočítava ako " +
        "vyživovaná osoba — z 2 vyživovaných odpočítame 1, započíta sa 1. " +
        "Prírastok 99.44 EUR. Spolu nezraziteľné 377.88 EUR. Remainder 1122.12 " +
        "EUR < STROP 1193.34 → bez nadlimitu. §71 ods. 1 EP: 112212 centov " +
        "deliteľné 3 → rounded = 1122.12 EUR; tretina 374.04. §72 ods. 2 EP: " +
        "bežné výživné 250 EUR sa hradí z 2. tretiny. Zvyšok 2. tretiny (124.04) " +
        "by išiel na nedoplatky výživného (žiadne) a potom ostatné prednostné (žiadne).",
    },

    {
      id: "VC3_over_limit_high_wage_2025",
      source:
        "Verifikácia §3 ods. 1 NV 268/2006 a §71 EP — nadlimit nad " +
        "STROP. Štandardná interpretácia metodiky Komory exekútorov SR pre " +
        "vysoké príjmy v roku 2025.",
      input: {
        calculation_date: "2025-08-15",
        net_wage: 3000.0,
        dependants: 0,
        debtor_type: "standard",
        executions: [
          {
            name: "EX-X nepriorita 1",
            total_claim: 100000.0,
            is_priority: false,
            is_alimony: false,
            is_minor_alimony: false,
            arrival_order: 1,
            current_alimony: 0,
            alimony_arrears: 0,
          },
          {
            name: "EX-Y prednostná (zdravotné poistenie)",
            total_claim: 5000.0,
            is_priority: true,
            is_alimony: false,
            is_minor_alimony: false,
            arrival_order: 2,
            current_alimony: 0,
            alimony_arrears: 0,
          },
        ],
      },
      expected_output: {
        zm: 284.13,
        base_non_deductible: 397.78,
        non_deductible_total: 397.78,
        remainder: 2602.22, // 3000.00 − 397.78
        strop: 1193.34,
        over_limit: 1408.88, // 2602.22 − 1193.34
        rounded_amount: 1193.34, // 119334 deliteľné 3 (119334/3=39778)
        first_third: 1806.66, // 397.78 (tretina zo strop) + 1408.88 (nadlimit)
        second_third: 397.78,
        third_third: 397.78, // 0 sub-cent zvyšok
        // distribúcia: 2. tretina 397.78 ide EX-Y (prednostná); 1. tretina 1806.66 ide FIFO → EX-X má nižšie poradie (1) → EX-X
        per_execution: [
          { name: "EX-X nepriorita 1", deduction: 1806.66, from_fund_1: 1806.66, from_fund_2: 0 },
          { name: "EX-Y prednostná (zdravotné poistenie)", deduction: 397.78, from_fund_1: 0, from_fund_2: 397.78 },
        ],
      },
      legal_reasoning:
        "§3 ods. 1 NV 268/2006 (znenie od 2022-01-01): STROP = 3 × " +
        "základná suma = 3 × 397.78 = 1193.34 EUR. Remainder 2602.22 > " +
        "STROP. §71 ods. 1 EP: časť nad STROP = 2602.22 − 1193.34 = " +
        "1408.88 EUR sa zrazí BEZ OBMEDZENIA a pridá k 1. tretine. §71 " +
        "ods. 1: zvyšok pod stropom 1193.34 EUR = 119334 centov, deliteľné " +
        "3 (žiadny sub-cent zvyšok). Tretina = 397.78 EUR. 1. tretina = " +
        "397.78 + 1408.88 = 1806.66 EUR. §72 ods. 2 EP: 2. tretina 397.78 " +
        "EUR ide prednostnej EX-Y (jediná prednostná); §72 ods. 1 EP: " +
        "1. tretina ide FIFO podľa poradia doručenia → EX-X (poradie 1) " +
        "dostane celú 1. tretinu 1806.66 EUR.",
    },
  ],
};

export default blueprint;
