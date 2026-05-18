/**
 * Blueprint: SK Cestovné náhrady — tuzemská pracovná cesta
 *
 * Jurisdiction:  SK
 * Topic:         Náhrady pri tuzemskej pracovnej ceste (zamestnanec)
 * Legal acts:    Zákon NR SR 283/2002 Z. z. o cestovných náhradách
 *                §4  — druhy náhrad (ubytovanie §4 ods. 1 písm. b, vedľajšie výdavky §4 ods. 1 písm. d)
 *                §5  — stravné (časové pásma, sadzby, krátenie)
 *                §7  — náhrada za použitie osobného vozidla (základná + pohonné látky)
 *                §8  — určenie súm stravného a základnej náhrady (CPI mechanizmus)
 *                §9  — iné náhrady a vyššie náhrady
 *
 * Note on §8/§9 convention: Aether.Logic internal coding uses §8 for ubytovanie
 * and §9 for vedľajšie výdavky following the legal-citations.lisp registry.
 * The actual legal provisions are in §4 ods. 1 písm. b) and §4 ods. 1 písm. d).
 *
 * Out of scope:  Zahraničná pracovná cesta (§13–§14), firemné vozidlo (§6),
 *               motorka/bicykel, refundácia verejnej dopravy.
 */

import type { Blueprint } from "./types.js";

const URL_283 = "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2002/283/";

const blueprint: Blueprint = {
  id: "sk-travel-domestic",
  title: "SK Cestovné náhrady — tuzemská pracovná cesta (283/2002)",
  version: "1.1.0",
  jurisdiction: "SK",
  status: "READY",
  last_reviewed: "2026-05-18",
  summary:
    "Algoritmus výpočtu náhrad pri tuzemskej pracovnej ceste zamestnanca: " +
    "stravné podľa časového pásma (§5), náhrada za použitie osobného vozidla " +
    "za kilometer (§7), náhrada preukázaných výdavkov za ubytovanie (§4 ods. 1 písm. b) " +
    "a náhrada preukázaných vedľajších výdavkov (§4 ods. 1 písm. d). " +
    "Sadzby vyhlasuje MPSVR SR v Zbierke zákonov (Opatrenia/Oznámenia), menia sa ~2× ročne. " +
    "Krátenie stravného za zabezpečené stravovanie sa počíta z maximálnej sadzby (pásmo 18+h), " +
    "NIE z aktuálnej sadzby príslušného pásma — typická chyba implementácií.",

  legal_acts: [
    {
      act: "283/2002 Z. z.",
      title: "Zákon o cestovných náhradách",
      url: URL_283,
    },
  ],

  interpretation_notes: [
    {
      issue:
        "§5 ods. 6 zákona 283/2002: krátenie stravného za zabezpečené stravovanie " +
        "(raňajky/obed/večera) sa počíta ako percento z MAXIMÁLNEJ sadzby (pásmo nad 18 hodín), " +
        "NIE ako percento z aktuálnej sadzby príslušného časového pásma.",
      chosen_interpretation:
        "Krátenie = percento × sadzba_18plus, bez ohľadu na to, do ktorého pásma pracovná cesta patrí. " +
        "Raňajky: 25 % zo sadzby_18plus. Obed: 40 % zo sadzby_18plus. Večera: 35 % zo sadzby_18plus. " +
        "Výsledné stravné = max(0, sadzba_pásma − súčet krátení).",
      rationale:
        "Explicitný text zákona: §5 ods. 6 — 'kráti o 25 % … o 40 % … o 35 % za bezplatne " +
        "poskytnutú večeru z určenej sumy stravného pre časové pásmo nad 18 hodín'. " +
        "Tento postup prekvapí implementátorov, ktorí predpokladajú krátenie zo sadzby príslušného pásma.",
    },
    {
      issue:
        "Viac pracovných ciest v ten istý deň (§5 ods. 4): ak zamestnanec uskutoční " +
        "viaceré krátke cesty v ten istý kalendárny deň, stravné sa počíta " +
        "z AGREGOVANÉHO počtu hodín všetkých ciest, nie za každú cestu osobitne.",
      chosen_interpretation:
        "Hodiny všetkých pracovných ciest v ten istý kalendárny deň sa sčítajú (max 24 h). " +
        "Stravné sa vypočíta z celkového počtu hodín. " +
        "Náhrada za km sa počíta pre každú cestu osobitne (na základe najazdených km).",
      rationale:
        "§5 ods. 4: 'Ak zamestnanec vykonáva v ten istý deň viac pracovných ciest, " +
        "na účely stravného sa hodiny pracovných ciest sčítajú.'",
    },
    {
      issue:
        "§7 ods. 6: zamestnávateľ môže zmluvne dojednať nižšiu sadzbu za km, " +
        "nesmie však klesnúť pod zákonné minimum. Blueprint používa zákonnú sadzbu.",
      chosen_interpretation:
        "Používa sa zákonná tabuľka sadzieb za km (Opatrenia MPSVR SR uverejnené v Zbierke zákonov). " +
        "Ak existuje dohodnutá nižšia sadzba, caller ju musí zohľadniť samostatne.",
      rationale: "Zákonná sadzba je minimum; dohodnuté sadzby sú konfiguráciou volajúceho.",
    },
    {
      issue:
        "Pravidelne pracujúci v teréne (§5 ods. 7): zamestnávateľ môže dojednať " +
        "paušálne zníženie stravného (max 50 % sadzby pásma nad 18 h) pre zamestnancov, " +
        "ktorých hlavnou pracovnou náplňou je práca v teréne.",
      chosen_interpretation:
        "Ak je nastavený parametrer frequent_traveler_discount (hodnota 0..1), " +
        "stravné = max(0, sadzba_pásma − zľava × sadzba_18plus). " +
        "Predvolene: bez zľavy (frequent_traveler = false).",
      rationale:
        "§5 ods. 7 — dohodnuté zníženie nesmie presiahnuť výšku stravného ustanoveného " +
        "pre časové pásmo nad 18 hodín, t. j. max 100 % sadzby_18plus.",
    },
  ],

  axiomatic_core: [
    {
      name: "STRAVNE_RATES",
      definition:
        "Sadzby stravného pri tuzemskej pracovnej ceste podľa časových pásiem " +
        "(§5 ods. 1 zákona 283/2002). Tri pásma: 5–12 h, 12–18 h, nad 18 h. " +
        "Cesta kratšia ako 5 h: nárok na stravné nevzniká.",
      value: "temporálne — vyhlasuje MPSVR SR v Zbierke zákonov (Opatrenia/Oznámenia)",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§5",
        odsek: 1,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "Zamestnancovi patrí stravné za každý kalendárny deň pracovnej cesty " +
          "za podmienok ustanovených týmto zákonom. Suma stravného je určená " +
          "v závislosti od času trvania pracovnej cesty v kalendárnom dni, pričom " +
          "čas trvania pracovnej cesty je rozdelený na časové pásma " +
          "a) 5 až 12 hodín, b) nad 12 hodín až 18 hodín, c) nad 18 hodín.",
      },
      effective_periods: [
        { from: "2024-09-01", to: "2025-03-31", value: "5–12 h: 8,30 EUR | 12–18 h: 12,30 EUR | nad 18 h: 18,40 EUR", note: "Oznámenie 211/2024 Z. z." },
        { from: "2025-04-01", to: "2025-11-30", value: "5–12 h: 8,80 EUR | 12–18 h: 13,10 EUR | nad 18 h: 19,50 EUR", note: "Oznámenie 39/2025 Z. z." },
        { from: "2025-12-01", value: "5–12 h: 9,30 EUR | 12–18 h: 13,80 EUR | nad 18 h: 20,60 EUR", note: "Oznámenie 280/2025 Z. z." },
      ],
    },
    {
      name: "KM_RATE_PERSONAL_CAR",
      definition:
        "Základná náhrada za každý kilometer jazdy osobným vozidlom (§7 ods. 2 zákona 283/2002). " +
        "Pokrýva amortizáciu vozidla; pohonné látky sa počítajú osobitne (viď KM_FUEL).",
      value: "temporálne — vyhlasuje MPSVR SR",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§7",
        odsek: 2,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "Základná náhrada za každý kilometer jazdy pre osobné vozidlo … " +
          "je suma platná v čase použitia vozidla.",
      },
      effective_periods: [
        { from: "2024-05-01", to: "2025-02-28", value: "0,265 EUR/km (osobné) | 0,075 EUR/km (motorka)", note: "Oznámenie 73/2024 Z. z." },
        { from: "2025-03-01", to: "2025-05-31", value: "0,281 EUR/km (osobné) | 0,080 EUR/km (motorka)", note: "Oznámenie 22/2025 Z. z." },
        { from: "2025-06-01", to: "2025-12-31", value: "0,296 EUR/km (osobné) | 0,085 EUR/km (motorka)", note: "Oznámenie 97/2025 Z. z." },
        { from: "2026-01-01", value: "0,313 EUR/km (osobné) | 0,090 EUR/km (motorka)", note: "Oznámenie 340/2025 Z. z." },
      ],
    },
    {
      name: "KM_FUEL",
      definition:
        "Náhrada za spotrebované pohonné látky za km (§7 ods. 4 zákona 283/2002). " +
        "Výpočet: km × (spotreba_na_100km / 100) × cena_za_liter. " +
        "Cena za liter: priemerná cena ŠÚ SR pre príslušné obdobie, " +
        "alebo skutočná dokladovaná cena ak zamestnanec predloží doklad o kúpe.",
      value: "nahrady_PHL_EUR = km × spotreba_l_na_100km / 100 × cena_EUR_za_liter",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§7",
        odsek: 4,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "Zamestnancovi patrí náhrada za spotrebované pohonné látky v sume " +
          "zodpovedajúcej súčinu jednotkovej ceny pohonnej látky podľa odseku 5 " +
          "a spotreby pohonných látok podľa odsekov 6 až 10 za každý aj začatý " +
          "kilometer jazdy.",
      },
      effective_periods: [
        {
          from: "2025-04-01",
          value:
            "Priemerné ceny ŠÚ SR (za obdobie): B95 ~1,607 EUR/L | B98 ~1,731 EUR/L | Nafta ~1,537 EUR/L",
          note: "Vždy použiť priemernú cenu ŠÚ SR platného týždňa cestovania, alebo skutočnú dokladovanú cenu.",
        },
      ],
    },
    {
      name: "MEAL_DEDUCTION_PERCENTAGES",
      definition:
        "Percentá krátenia stravného za zabezpečené stravovanie (§5 ods. 6 zákona 283/2002). " +
        "Uplatňujú sa na sadzbu pásma nad 18 h (NIE na aktuálnu sadzbu príslušného pásma).",
      value: "raňajky: 25 % zo sadzby_18plus | obed: 40 % zo sadzby_18plus | večera: 35 % zo sadzby_18plus",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§5",
        odsek: 6,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "Ak má zamestnanec na pracovnej ceste preukázane zabezpečené bezplatné " +
          "stravovanie v celom rozsahu, zamestnávateľ mu stravné neposkytuje. " +
          "Ak má zamestnanec na pracovnej ceste preukázane zabezpečené bezplatné " +
          "stravovanie čiastočne, zamestnávateľ stravné určené podľa odsekov 1, 2 " +
          "alebo 5 kráti o 25 % za bezplatne poskytnuté raňajky, o 40 % za bezplatne " +
          "poskytnutý obed a o 35 % za bezplatne poskytnutú večeru z určenej sumy " +
          "stravného pre časové pásmo nad 18 hodín alebo z najvyššej dohodnutej sumy " +
          "stravného podľa odseku 5.",
      },
      effective_periods: [
        {
          from: "2002-07-01",
          value: "raňajky: 25 % | obed: 40 % | večera: 35 %",
          note: "Stabilné od nadobudnutia účinnosti zákona.",
        },
      ],
    },
    {
      name: "ACCOMMODATION_PASSTHROUGH",
      definition:
        "Náhrada preukázaných výdavkov za ubytovanie (§4 ods. 1 písm. b zákona 283/2002). " +
        "Plná preukázaná suma — bez stropu, bez tabuľky sadzieb. " +
        "Zamestnávateľ prepláca skutočné výdavky na základe dokladu.",
      value: "ubytovanie_EUR = skutočné_preukázané_výdavky (doklad povinný)",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§8",
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "náhrada preukázaných výdavkov za ubytovanie",
      },
    },
    {
      name: "MISC_EXPENSES_PASSTHROUGH",
      definition:
        "Náhrada preukázaných potrebných vedľajších výdavkov (§4 ods. 1 písm. d zákona 283/2002). " +
        "Plná preukázaná suma — bez tabuľky sadzieb. " +
        "Príklady: parkovné, diaľničné poplatky, kongresový poplatok, úschova batožiny.",
      value: "ine_vydavky_EUR = skutočné_preukázané_výdavky (doklad povinný)",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§9",
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "náhrada preukázaných potrebných vedľajších výdavkov",
      },
    },
  ],

  execution_order: [
    "STEP_T1: Overenie vstupov; určenie sadzobného obdobia podľa dátumu cesty.",
    "STEP_T2: Zatriedenie dĺžky trvania cesty do časového pásma (žiadne/<5 h, 5–12 h, 12–18 h, >18 h).",
    "STEP_T3: Vyhľadanie sadzby príslušného pásma z tabuľky STRAVNE_RATES.",
    "STEP_T4: Výpočet krátení stravného (raňajky, obed, večera) zo sadzby_18plus.",
    "STEP_T5: Stravné = max(0, sadzba_pásma − súčet krátení).",
    "STEP_T6: Základná náhrada za vozidlo = km × KM_RATE (osobné vozidlo alebo motorka).",
    "STEP_T7: Náhrada za pohonné látky = km × (spotreba / 100) × cena_za_liter (ak je zadaná spotreba).",
    "STEP_T8: Celková náhrada za vozidlo = základná náhrada + náhrada za PHL.",
    "STEP_T9: Ubytovanie = preukázané výdavky (§4 ods. 1 písm. b — passthrough).",
    "STEP_T10: Vedľajšie výdavky = preukázané výdavky (§4 ods. 1 písm. d — passthrough).",
    "STEP_T11: Celková náhrada = stravné + vozidlo + ubytovanie + vedľajšie výdavky.",
  ],

  logic_flow: [
    {
      id: "T2",
      description: "Zatriedenie do časového pásma",
      pseudocode: `
function casovePasmo(hodiny):
    if hodiny < 5:
        return None   # nárok na stravné nevzniká
    elif hodiny <= 12:
        return "5-12h"
    elif hodiny <= 18:
        return "12-18h"
    else:
        return "18+h"

# Viac ciest v jeden deň (§5 ods. 4): najprv sčítaj hodiny
function celkoveHodinyDna(cesty):
    return min(24, sum(c.hodiny for c in cesty))
      `.trim(),
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§5",
        odsek: 1,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "Zamestnancovi patrí stravné za každý kalendárny deň pracovnej cesty " +
          "za podmienok ustanovených týmto zákonom. Suma stravného je určená " +
          "v závislosti od času trvania pracovnej cesty v kalendárnom dni, pričom " +
          "čas trvania pracovnej cesty je rozdelený na časové pásma " +
          "a) 5 až 12 hodín, b) nad 12 hodín až 18 hodín, c) nad 18 hodín.",
      },
      edge_cases: [
        {
          condition: "hodiny < 5",
          behaviour: "Nárok na stravné nevzniká. Vráti 0.",
        },
        {
          condition: "Hranica presne 12 h",
          behaviour:
            "hodiny <= 12 → pásmo '5–12 h'. Pásmo '12–18 h' začína STRIKTNE nad 12 h. " +
            "(hodiny = 12 → pásmo '5–12 h', NIE '12–18 h'.)",
        },
        {
          condition: "Hranica presne 18 h",
          behaviour:
            "hodiny <= 18 → pásmo '12–18 h'. Pásmo 'nad 18 h' začína STRIKTNE nad 18 h. " +
            "(hodiny = 18 → pásmo '12–18 h'.)",
        },
        {
          condition: "Súčet hodín viac ciest v jeden deň presahuje 24 h",
          behaviour: "Celkový počet hodín sa obmedzí na 24 h (§5 ods. 4 — jeden kalendárny deň nemôže mať viac ako 24 h).",
        },
      ],
    },

    {
      id: "T3-T5",
      description: "Stravné s krátením za zabezpečené stravovanie",
      pseudocode: `
function computeStravne(date, hodiny, raňajky=false, obed=false, vecera=false,
                         caste_cestovanie=false, zlava_koef=0):
    sadzby = lookupStravneRates(date)
    pasmo = casovePasmo(hodiny)
    if pasmo is None:
        return 0.0

    sadzba_pasma = sadzby[pasmo]         # napr. 9,30 pre 5–12 h
    sadzba_18plus = sadzby["18+h"]       # napr. 20,60 — VŽDY základ pre krátenie

    # Krátenie sa počíta zo sadzby_18plus, NIE zo sadzby_pasma:
    kratenie = 0
    if raňajky: kratenie += 0.25 * sadzba_18plus
    if obed:    kratenie += 0.40 * sadzba_18plus
    if vecera:  kratenie += 0.35 * sadzba_18plus

    # Zľava pre pravidelne cestujúcich (§5 ods. 7):
    if caste_cestovanie and zlava_koef > 0:
        zlava = min(zlava_koef, 1.0) * sadzba_18plus
        kratenie += zlava

    stravne = max(0, sadzba_pasma - kratenie)
    return round_eurocent_standard(stravne)
      `.trim(),
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§5",
        odsek: 6,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "Ak má zamestnanec na pracovnej ceste preukázane zabezpečené bezplatné " +
          "stravovanie v celom rozsahu, zamestnávateľ mu stravné neposkytuje. " +
          "Ak má zamestnanec na pracovnej ceste preukázane zabezpečené bezplatné " +
          "stravovanie čiastočne, zamestnávateľ stravné určené podľa odsekov 1, 2 " +
          "alebo 5 kráti o 25 % za bezplatne poskytnuté raňajky, o 40 % za bezplatne " +
          "poskytnutý obed a o 35 % za bezplatne poskytnutú večeru z určenej sumy " +
          "stravného pre časové pásmo nad 18 hodín alebo z najvyššej dohodnutej sumy " +
          "stravného podľa odseku 5.",
      },
      edge_cases: [
        {
          condition: "Zabezpečené všetky tri jedlá",
          behaviour:
            "Celkové krátenie = 100 % sadzby_18plus. Výsledok: max(0, sadzba_pásma − sadzba_18plus). " +
            "Pre pásma 5–12 h a 12–18 h, kde sadzba_pásma < sadzba_18plus, stravné = 0.",
        },
        {
          condition: "Cesta trvá 18+ h, zabezpečený iba obed",
          behaviour:
            "Stravné = sadzba_18plus − 0,40 × sadzba_18plus = 0,60 × sadzba_18plus. " +
            "Poznámka: základ krátenia sa tu náhodne zhoduje so sadzbou pásma, " +
            "ale vzorec vždy používa sadzbu_18plus.",
        },
      ],
    },

    {
      id: "T6-T8",
      description: "Náhrada za použitie osobného vozidla",
      pseudocode: `
function computeNahradaVozidlo(date, km, spotreba_l_na_100km=null,
                                cena_phl_eur_za_l=null, typ_vozidla="osobne"):
    if km <= 0:
        return 0.0, 0.0

    sadzba_km = lookupKmRate(date, typ_vozidla)   # napr. 0,313 EUR/km od 2026-01-01
    zakladna_nahrada = round_eurocent_standard(km * sadzba_km)

    nahrada_phl = 0.0
    if spotreba_l_na_100km is not None and spotreba_l_na_100km > 0:
        cena = cena_phl_eur_za_l   # skutočná dokladovaná cena
        if cena is None:
            cena = lookupSuSrPriemerCena(date, typ_phl)  # priemerná cena ŠÚ SR
        litre = km * spotreba_l_na_100km / 100
        nahrada_phl = round_eurocent_standard(litre * cena)

    celkova_nahrada = zakladna_nahrada + nahrada_phl
    return celkova_nahrada, {zakladna: zakladna_nahrada, phl: nahrada_phl, sadzba_km: sadzba_km}
      `.trim(),
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§7",
        odsek: 1,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "Ak sa zamestnanec písomne dohodne so zamestnávateľom, že pri pracovnej " +
          "ceste použije motorové vozidlo, ktoré je cestným vozidlom alebo traktorom, " +
          "okrem vozidla poskytnutého zamestnávateľom, patrí mu " +
          "a) základná náhrada za každý aj začatý kilometer jazdy a náhrada za " +
          "spotrebované pohonné látky alebo " +
          "b) náhrada za použitie vozidla podľa odseku 12.",
      },
      edge_cases: [
        {
          condition: "Spotreba vozidla nie je zadaná",
          behaviour:
            "Náhrada za PHL sa vynechá. Vráti sa iba základná náhrada za km. " +
            "Platné ak zamestnanec cestuje bez dokladovania spotreby.",
        },
        {
          condition: "Zamestnanec predloží doklad o kúpe pohonných látok (skutočná cena)",
          behaviour:
            "Použije sa skutočná dokladovaná cena za liter. Môže prevýšiť priemernú cenu ŠÚ SR. " +
            "Zákon umožňuje náhradu v skutočnej výške pri preukázaní dokladom (§7 ods. 5).",
        },
        {
          condition: "Prívesný vozík (§7 ods. 4 zákona 283/2002)",
          behaviour:
            "K základnej sadzbe za km sa pripočíta 15 %. " +
            "sadzba_s_privesnym = sadzba_km × 1,15.",
        },
      ],
    },

    {
      id: "T9",
      description: "Ubytovanie — §4 ods. 1 písm. b passthrough",
      pseudocode: `
function computeUbytovanie(preukaz_vydavok_eur):
    if preukaz_vydavok_eur is None or preukaz_vydavok_eur <= 0:
        return 0.0
    # Bez tabuľky sadzieb, bez stropu — zamestnávateľ hradí plné preukázané výdavky
    return preukaz_vydavok_eur
      `.trim(),
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§8",
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "náhrada preukázaných výdavkov za ubytovanie",
      },
      edge_cases: [
        {
          condition: "Zamestnanec nepredloží doklad o ubytovaní",
          behaviour: "Náhrada za ubytovanie = 0. Pri tuzemskej ceste neexistuje paušálna náhrada bez dokladu.",
        },
      ],
    },

    {
      id: "T10",
      description: "Vedľajšie výdavky — §4 ods. 1 písm. d passthrough",
      pseudocode: `
function computeVedlajsieVydavky(preukaz_vydavok_eur):
    if preukaz_vydavok_eur is None or preukaz_vydavok_eur <= 0:
        return 0.0
    return preukaz_vydavok_eur  # parkovné, poplatky za diaľnicu, kongresový poplatok, ...
      `.trim(),
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§9",
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "náhrada preukázaných potrebných vedľajších výdavkov",
      },
    },

    {
      id: "T11",
      description: "Celková náhrada",
      pseudocode: `
celkova_nahrada = stravne + nahrada_vozidlo + ubytovanie + vedlajsie_vydavky
# Racionálna aritmetika pri sčítavaní; na float konvertovať iba na výstupe
      `.trim(),
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§3",
        odsek: 1,
        effective_from: "2002-07-01",
        url: URL_283,
        quote: "Zamestnávateľ je povinný poskytnúť zamestnancovi náhrady podľa tohto zákona.",
      },
    },
  ],

  semantic_mapping: [
    {
      step_id: "T2",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§5",
        odsek: 1,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "Suma stravného je určená v závislosti od času trvania pracovnej cesty " +
          "v kalendárnom dni, pričom čas trvania pracovnej cesty je rozdelený na " +
          "časové pásma a) 5 až 12 hodín, b) nad 12 hodín až 18 hodín, c) nad 18 hodín.",
      },
    },
    {
      step_id: "T3-T5",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§5",
        odsek: 6,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "kráti o 25 % za bezplatne poskytnuté raňajky, o 40 % za bezplatne " +
          "poskytnutý obed a o 35 % za bezplatne poskytnutú večeru z určenej sumy " +
          "stravného pre časové pásmo nad 18 hodín.",
      },
    },
    {
      step_id: "T6-T8",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§7",
        odsek: 1,
        effective_from: "2002-07-01",
        url: URL_283,
        quote:
          "patrí mu a) základná náhrada za každý aj začatý kilometer jazdy " +
          "a náhrada za spotrebované pohonné látky.",
      },
    },
    {
      step_id: "T9",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§8",
        effective_from: "2002-07-01",
        url: URL_283,
        quote: "náhrada preukázaných výdavkov za ubytovanie",
      },
    },
    {
      step_id: "T10",
      citation: {
        act: "283/2002 Z. z.",
        paragraph: "§9",
        effective_from: "2002-07-01",
        url: URL_283,
        quote: "náhrada preukázaných potrebných vedľajších výdavkov",
      },
    },
  ],

  tool: {
    name: "get_travel_domestic_logic",
    description:
      "Vráti kompletný blueprint pre výpočet náhrad pri tuzemskej pracovnej ceste. " +
      "Pokrýva: stravné podľa časového pásma (§5), náhrada za km + pohonné látky (§7), " +
      "ubytovanie ako preukázané výdavky (§4 ods. 1 písm. b), vedľajšie výdavky (§4 ods. 1 písm. d). " +
      "Kritická implementačná poznámka: krátenie stravného za zabezpečené stravovanie " +
      "sa počíta vždy zo sadzby pásma nad 18 h, nie z aktuálnej sadzby príslušného pásma.",
    input_parameters: [
      {
        name: "trip_date",
        type: "string",
        description: "Dátum pracovnej cesty (RRRR-MM-DD). Určuje príslušné sadzobné obdobie.",
        required: true,
      },
      {
        name: "hours",
        type: "number",
        description:
          "Dĺžka trvania cesty v hodinách. Určuje zatriedenie do časového pásma. " +
          "Pri viacerých cestách v ten istý deň zadaj agregovaný počet hodín (§5 ods. 4).",
        required: true,
      },
      {
        name: "km",
        type: "number",
        description: "Najazdené kilomietre vlastným osobným vozidlom. 0 ak vlastné vozidlo nebolo použité.",
        required: false,
        unit: "km",
      },
      {
        name: "vehicle_type",
        type: "string",
        description: "Typ vozidla: 'personal' (osobné) alebo 'motorcycle' (motorka).",
        required: false,
        enum: ["personal", "motorcycle"],
      },
      {
        name: "consumption_l_per_100km",
        type: "number",
        description: "Spotreba pohonných látok vozidla v litroch na 100 km (z technického preukazu).",
        required: false,
      },
      {
        name: "fuel_price_eur_per_l",
        type: "number",
        description:
          "Skutočná cena pohonných látok za liter z dokladu o kúpe. " +
          "Ak nie je zadaná, použije sa priemerná cena ŠÚ SR.",
        required: false,
      },
      {
        name: "breakfast",
        type: "boolean",
        description: "True ak zamestnávateľ zabezpečil raňajky počas pracovnej cesty.",
        required: false,
      },
      {
        name: "lunch",
        type: "boolean",
        description: "True ak zamestnávateľ zabezpečil obed počas pracovnej cesty.",
        required: false,
      },
      {
        name: "dinner",
        type: "boolean",
        description: "True ak zamestnávateľ zabezpečil večeru počas pracovnej cesty.",
        required: false,
      },
      {
        name: "accommodation_eur",
        type: "number",
        description: "Preukázané výdavky za ubytovanie v EUR (§4 ods. 1 písm. b). Null ak sa ubytovanie nevyskytlo.",
        required: false,
        unit: "EUR",
      },
      {
        name: "misc_expenses_eur",
        type: "number",
        description:
          "Preukázané vedľajšie výdavky v EUR (§4 ods. 1 písm. d): parkovné, diaľničné poplatky, kongresový poplatok, ...",
        required: false,
        unit: "EUR",
      },
    ],
    calculation_steps: [
      "T2: Zatriadenie hodín do pásma (žiadne ak <5 h, 5–12 h, 12–18 h, nad 18 h).",
      "T3: Vyhľadanie sadzby pásma a sadzby_18plus z tabuľky STRAVNE_RATES pre dátum cesty.",
      "T4: Výpočet krátení = súčet(zabezpečené jedlá × ich percento × sadzba_18plus).",
      "T5: Stravné = max(0, sadzba_pásma − krátenia). Zaokrúhlenie na najbližší eurocent.",
      "T6: Základná náhrada za vozidlo = km × sadzba_km (podľa dátumu a typu vozidla).",
      "T7: Náhrada za PHL = km × (spotreba/100) × cena_za_liter. Ak nie je doklad, použiť priemer ŠÚ SR.",
      "T8: Celková náhrada za vozidlo = základná + PHL.",
      "T9: Ubytovanie = preukázané výdavky (§4 ods. 1 písm. b passthrough).",
      "T10: Vedľajšie výdavky = preukázané výdavky (§4 ods. 1 písm. d passthrough).",
      "T11: Celková náhrada = stravné + vozidlo + ubytovanie + vedľajšie výdavky.",
    ],
    audit_trail_template:
      "{trip_date}: stravné: pásmo = {pasmo}, sadzba = {sadzba_pasma} EUR, " +
      "krátenie = {kratenie} EUR (základ sadzba_18+ = {sadzba_18plus} EUR), " +
      "stravné = {stravne} EUR (§5/283/2002). " +
      "Vozidlo: {km} km × {sadzba_km} EUR/km = {zakladna_nahrada} EUR; " +
      "PHL {litre} L × {cena_phl} EUR/L = {nahrada_phl} EUR; " +
      "náhrada za vozidlo spolu = {nahrada_vozidlo} EUR (§7/283/2002). " +
      "Ubytovanie: {ubytovanie} EUR (§4 ods. 1 písm. b / 283/2002). " +
      "Vedľajšie výdavky: {vedlajsie} EUR (§4 ods. 1 písm. d / 283/2002). " +
      "SPOLU: {celkova_nahrada} EUR.",
  },

  verification_cases: [
    {
      id: "VC1_8h_50km_no_meals_dec2025",
      source:
        "Manuálny výpočet podľa sadzieb MPSVR SR. " +
        "Stravné sadzby: Oznámenie 280/2025 Z. z. (účinné od 2025-12-01). " +
        "Sadzba km: Oznámenie 97/2025 Z. z. (účinné od 2025-06-01 do 2025-12-31).",
      input: {
        trip_date: "2025-12-15",
        hours: 8,
        km: 50,
        vehicle_type: "personal",
        consumption_l_per_100km: null,
        fuel_price_eur_per_l: null,
        breakfast: false,
        lunch: false,
        dinner: false,
        accommodation_eur: null,
        misc_expenses_eur: null,
      },
      expected_output: {
        pasmo: "5–12 h",
        sadzba_pasma_eur: 9.30,
        sadzba_18plus_eur: 20.60,
        kratenie_eur: 0,
        stravne_eur: 9.30,
        sadzba_km_eur_za_km: 0.296,
        zakladna_nahrada_eur: 14.80, // 50 × 0,296
        nahrada_phl_eur: 0,
        nahrada_vozidlo_eur: 14.80,
        ubytovanie_eur: 0,
        vedlajsie_eur: 0,
        celkova_nahrada_eur: 24.10, // 9,30 + 14,80
      },
      legal_reasoning:
        "§5 ods. 1/283/2002: 8 h → pásmo 5–12 h; Oznámenie 280/2025: sadzba = 9,30 EUR. " +
        "Žiadne zabezpečené stravovanie → žiadne krátenie. Stravné = 9,30 EUR. " +
        "§7 ods. 2: sadzba km podľa Oznámenia 97/2025 Z. z. = 0,296 EUR/km. " +
        "Základná náhrada: 50 × 0,296 = 14,80 EUR. Spotreba nezadaná → náhrada za PHL = 0. " +
        "Celková náhrada: 9,30 + 14,80 = 24,10 EUR.",
    },

    {
      id: "VC2_20h_150km_breakfast_dec2025",
      source:
        "Manuálny výpočet — overuje pásmo nad 18 h, krátenie stravného zo sadzby_18plus " +
        "(nie zo sadzby pásma) a náhradu za pohonné látky. " +
        "Sadzby rovnaké ako VC1.",
      input: {
        trip_date: "2025-12-15",
        hours: 20,
        km: 150,
        vehicle_type: "personal",
        consumption_l_per_100km: 7.5,
        fuel_price_eur_per_l: 1.589,
        breakfast: true,
        lunch: false,
        dinner: false,
        accommodation_eur: null,
        misc_expenses_eur: null,
      },
      expected_output: {
        pasmo: "nad 18 h",
        sadzba_pasma_eur: 20.60,
        sadzba_18plus_eur: 20.60,
        // Krátenie raňajok = 25 % × sadzba_18plus = 25 % × 20,60 = 5,15 EUR
        kratenie_eur: 5.15,
        stravne_eur: 15.45, // 20,60 − 5,15
        sadzba_km_eur_za_km: 0.296,
        zakladna_nahrada_eur: 44.40, // 150 × 0,296
        // PHL: 150 × 7,5 / 100 × 1,589 = 11,25 × 1,589 = 17,88 EUR
        litre: 11.25,
        nahrada_phl_eur: 17.88,
        nahrada_vozidlo_eur: 62.28, // 44,40 + 17,88
        ubytovanie_eur: 0,
        vedlajsie_eur: 0,
        celkova_nahrada_eur: 77.73, // 15,45 + 62,28
      },
      legal_reasoning:
        "§5 ods. 1/283/2002: 20 h → pásmo nad 18 h; sadzba = 20,60 EUR. " +
        "§5 ods. 6: krátenie za raňajky = 25 % × sadzba_18plus = 25 % × 20,60 = 5,15 EUR. " +
        "KĽÚČ: krátenie sa počíta zo sadzby_18plus (20,60), nie zo sadzby pásma " +
        "(tu rovnaká, ale pri kratšej ceste by bol rozdiel). " +
        "Stravné = 20,60 − 5,15 = 15,45 EUR. " +
        "§7 ods. 2: 150 km × 0,296 = 44,40 EUR. " +
        "§7 ods. 4: PHL = 150 × 7,5/100 × 1,589 = 11,25 L × 1,589 = 17,88 EUR (zaokrúhlené). " +
        "Náhrada za vozidlo = 44,40 + 17,88 = 62,28 EUR. " +
        "Celková náhrada = 15,45 + 62,28 = 77,73 EUR.",
    },

    {
      id: "VC3_6h_30km_accommodation_misc_jan2026",
      source:
        "Manuálny výpočet — overuje passthrough ubytovanie + vedľajšie výdavky a " +
        "krátenie stravného v pásme 5–12 h za obed zo sadzby_18plus. " +
        "Stravné sadzby: Oznámenie 280/2025 Z. z. (účinné od 2025-12-01, bez konca). " +
        "Sadzba km: Oznámenie 340/2025 Z. z. (účinné od 2026-01-01).",
      input: {
        trip_date: "2026-01-15",
        hours: 6,
        km: 30,
        vehicle_type: "personal",
        consumption_l_per_100km: null,
        fuel_price_eur_per_l: null,
        breakfast: false,
        lunch: true,
        dinner: false,
        accommodation_eur: 89.0,
        misc_expenses_eur: 12.5,
      },
      expected_output: {
        pasmo: "5–12 h",
        sadzba_pasma_eur: 9.30,
        sadzba_18plus_eur: 20.60,
        // Krátenie obeda = 40 % × sadzba_18plus = 40 % × 20,60 = 8,24 EUR
        kratenie_eur: 8.24,
        // Stravné = max(0, 9,30 − 8,24) = 1,06 EUR
        stravne_eur: 1.06,
        sadzba_km_eur_za_km: 0.313,
        zakladna_nahrada_eur: 9.39,  // 30 × 0,313
        nahrada_phl_eur: 0,
        nahrada_vozidlo_eur: 9.39,
        ubytovanie_eur: 89.0,
        vedlajsie_eur: 12.5,
        celkova_nahrada_eur: 111.95, // 1,06 + 9,39 + 89,00 + 12,50
      },
      legal_reasoning:
        "Dátum cesty 2026-01-15: stravné sadzby z Oznámenia 280/2025 (:do nil) platia ďalej " +
        "(k dátumu spracovania neboli vyhlásené novšie sadzby). Pásmo 5–12 h = 9,30, nad 18 h = 20,60. " +
        "§5 ods. 6: krátenie za obed = 40 % × 20,60 = 8,24 EUR " +
        "(základ sadzba_18plus = 20,60, nie sadzba pásma = 9,30). " +
        "Stravné = max(0, 9,30 − 8,24) = 1,06 EUR. " +
        "§7 ods. 2 (Oznámenie 340/2025, od 2026-01-01): sadzba km = 0,313 EUR/km. " +
        "Základná náhrada = 30 × 0,313 = 9,39 EUR. " +
        "§4 ods. 1 písm. b: ubytovanie = 89,00 EUR (preukázané, plná náhrada). " +
        "§4 ods. 1 písm. d: vedľajšie výdavky = 12,50 EUR (preukázané). " +
        "Celková náhrada = 1,06 + 9,39 + 89,00 + 12,50 = 111,95 EUR.",
    },
  ],
};

export default blueprint;
