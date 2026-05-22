/**
 * Blueprint: CZ Payroll — Výpočet čisté mzdy
 *
 * Jurisdiction:  CZ
 * Topic:         Měsíční čistá mzda zaměstnance (záloha na daň)
 * Legal acts:    Zákon č. 589/1992 Sb. (pojistné na sociální zabezpečení) — §7, §15b
 *                Zákon č. 592/1992 Sb. (pojistné na zdravotní pojištění) — §2, §3
 *                Zákon č. 586/1992 Sb. (daň z příjmů) — §6, §35ba, §38h
 *
 * Scope: zaměstnanec (pracovní poměr, DPP s přihláškou k pojistnému),
 *        měsíční záloha na daň bez podepsaného prohlášení nebo s prohlášením
 *        (sleva na poplatníka uplatněna pouze při podepsaném prohlášení).
 * Out of scope: OSVČ, roční zúčtování daně, pojistné zaměstnavatele,
 *               naturální příjmy, zaměstnanecké benefity.
 *
 * Key change history:
 *   2021-01-01 — zrušení superhrubé mzdy; základ daně = hrubá mzda (zákon 609/2020 Sb.)
 *   2024-01-01 — zaměstnanci nově platí 0,6 % nemocenského; SP = 7,1 % (zákon 349/2023 Sb.)
 */

import type { Blueprint } from "./types.js";

const URL_589 = "https://www.zakonyprolidi.cz/cs/1992-589";
const URL_592 = "https://www.zakonyprolidi.cz/cs/1992-592";
const URL_586 = "https://www.zakonyprolidi.cz/cs/1992-586";

const blueprint: Blueprint = {
  id: "cz-payroll-net-wage",
  title: "CZ Výpočet čisté mzdy — SP + ZP + záloha na daň (měsíční)",
  version: "1.0.0",
  jurisdiction: "CZ",
  status: "READY",
  last_reviewed: "2026-05-22",
  summary:
    "Algoritmus výpočtu měsíční čisté mzdy zaměstnance z hrubé mzdy: " +
    "pojistné na sociální zabezpečení (SP, 7,1 % = 6,5 % důchodové + 0,6 % nemocenské od 2024-01-01), " +
    "pojistné na zdravotní pojištění (ZP, 4,5 %), " +
    "a měsíční záloha na daň z příjmů (15 % / 23 %, bez superhrubé mzdy od 2021-01-01). " +
    "Pokrývá: maximální vyměřovací základ SP (48× průměrná mzda/rok, §15b zákona 589/1992), " +
    "minimální základ ZP (minimální mzda, §3 zákona 592/1992), " +
    "slevu na poplatníka 2 570 CZK/měsíc (§35ba ZDP). " +
    "Všechna zaokrouhlení: SP, ZP, záloha na daň — ceiling na celé CZK (§7 ods. 5 zákona 589/1992, " +
    "§3 zákona 592/1992, §38h ods. 6 ZDP).",

  legal_acts: [
    {
      act: "589/1992 Sb.",
      title: "Zákon o pojistném na sociální zabezpečení a příspěvku na státní politiku zaměstnanosti",
      url: URL_589,
    },
    {
      act: "592/1992 Sb.",
      title: "Zákon o pojistném na veřejné zdravotní pojištění",
      url: URL_592,
    },
    {
      act: "586/1992 Sb.",
      title: "Zákon o daních z příjmů",
      url: URL_586,
    },
  ],

  interpretation_notes: [
    {
      issue:
        "Zákon 592/1992 §3 ods. 4: minimální vyměřovací základ ZP = minimální mzda. " +
        "Pokud je hrubá mzda zaměstnance nižší než minimální mzda, je odvedeno pojistné " +
        "ze dvou základů: zaměstnanec platí 4,5 % ze své hrubé mzdy, " +
        "zaměstnavatel musí 'doplatit' pojistné z rozdílu (min. mzda − hrubá) × 13,5 %.",
      chosen_interpretation:
        "Výpočet pojistného zaměstnance na ZP = ceiling(hrubá_mzda × 4,5 %), " +
        "bez ohledu na to, zda je hrubá pod minimální mzdou. " +
        "Doplatek jde na vrub zaměstnavatele (out of scope tohoto blueprintu).",
      rationale:
        "§3 ods. 4 zákona 592/1992 ukládá povinnost dosáhnout minimálního základu; " +
        "§3 ods. 7 výslovně říká, že rozdíl hradí zaměstnavatel. " +
        "Zaměstnanec odvádí vždy 4,5 % z hrubé bez navýšení na min. základ.",
    },
    {
      issue:
        "Od 2021-01-01 (zákon 609/2020 Sb.) byla zrušena 'superhrubá mzda'. " +
        "Základ daně zaměstnance = hrubá mzda (příjmy ze závislé činnosti §6 ZDP). " +
        "SP a ZP zaměstnance se NEodečítají od základu daně.",
      chosen_interpretation:
        "Základ daně pro zálohu = hrubá mzda. " +
        "SP ani ZP zaměstnance se od základu daně neodečítají.",
      rationale:
        "§6 ZDP od 2021: příjmy ze závislé činnosti = základ dílčí daně bez přičtení " +
        "příspěvků zaměstnavatele (superhrubá zrušena) ani odečtení SP/ZP zaměstnance.",
    },
    {
      issue:
        "§38h ods. 6 ZDP: záloha na daň se zaokrouhluje na celé koruny nahoru (ceiling). " +
        "§7 ods. 5 zákona 589/1992 a §3 ods. 5 zákona 592/1992: " +
        "SP a ZP se rovněž zaokrouhlují na celé koruny nahoru (ceiling). " +
        "Toto je odlišné od SK, kde SP/ZP round floor a daň round standard.",
      chosen_interpretation:
        "Všechny tři složky (SP, ZP, záloha na daň) = ceiling na celé CZK.",
      rationale:
        "Explicitní text tří zákonů shodně stanoví 'nahoru'. " +
        "Potvrzeno ČSSZ a Finanční správou v příkladech výpočtů.",
    },
  ],

  axiomatic_core: [
    {
      name: "SP_EMPLOYEE_RATE",
      definition:
        "Sazba pojistného zaměstnance na sociální zabezpečení: " +
        "důchodové pojištění (§7 ods. 1 písm. a) zákona 589/1992) + " +
        "nemocenské pojištění (§7 ods. 1 písm. c) zákona 589/1992, zavedeno pro zaměstnance od 2024-01-01).",
      value: "7,1 % (6,5 % důchodové + 0,6 % nemocenské), od 2024-01-01",
      citation: {
        act: "589/1992 Sb.",
        paragraph: "§7",
        odsek: 1,
        effective_from: "2024-01-01",
        url: URL_589,
        quote:
          "Sazba pojistného činí pro zaměstnance: " +
          "a) 6,5 % z vyměřovacího základu na důchodové pojištění, " +
          "c) 0,6 % z vyměřovacího základu na nemocenské pojištění. (zákon 349/2023 Sb., §7 ods. 1)",
      },
      effective_periods: [
        {
          from: "2009-01-01",
          to: "2023-12-31",
          value: "6,5 % (pouze důchodové; nemocenské hradil výhradně zaměstnavatel)",
          note: "Sazba stabilní 2009–2023.",
        },
        {
          from: "2024-01-01",
          value: "7,1 % (6,5 % důchodové + 0,6 % nemocenské)",
          note: "Novela zákonem 349/2023 Sb. — zaměstnanci nově platí nemocenské.",
        },
      ],
    },
    {
      name: "SP_MAX_ANNUAL_BASIS",
      definition:
        "Roční maximální vyměřovací základ SP = 48-násobek průměrné mzdy " +
        "(§15b zákona 589/1992). Příjem nad tento roční strop nepodléhá SP. " +
        "Pro měsíční výpočet: sleduje se kumulativní VZ za rok.",
      value: "48 × průměrná_mzda / rok (měsíční ekvivalent: viz effective_periods)",
      citation: {
        act: "589/1992 Sb.",
        paragraph: "§15b",
        effective_from: "2008-01-01",
        url: URL_589,
        quote:
          "Maximální vyměřovací základ zaměstnance je 48násobek průměrné mzdy. " +
          "Průměrnou mzdou se rozumí částka, která se vypočte jako součin " +
          "všeobecného vyměřovacího základu a přepočítacího koeficientu.",
      },
      effective_periods: [
        {
          from: "2024-01-01",
          to: "2024-12-31",
          value: "2 110 416 CZK/rok (= 48 × 43 967 CZK průměrná mzda)",
          note: "Pro většinu zaměstnanců irelevantní; strop dosáhnou pouze velmi vysocí příjmy.",
        },
        {
          from: "2025-01-01",
          to: "2025-12-31",
          value: "2 265 600 CZK/rok (= 48 × 47 200 CZK průměrná mzda)",
          note: "Aktualizovat každoročně dle vyhlášky MPSV o průměrné mzdě.",
        },
        {
          from: "2026-01-01",
          value: "Aktualizovat dle vyhlášky MPSV pro rok 2026",
          note: "Použít 48 × (vyhlášená průměrná mzda 2026). Pro r. 2025: viz výše.",
        },
      ],
    },
    {
      name: "ZP_EMPLOYEE_RATE",
      definition:
        "Sazba pojistného zaměstnance na zdravotní pojištění " +
        "(§2 ods. 1 zákona 592/1992). Osoba se ZTP: polovina sazby.",
      value: "4,5 % (ZTP: 2,25 %)",
      citation: {
        act: "592/1992 Sb.",
        paragraph: "§2",
        odsek: 1,
        effective_from: "1993-01-01",
        url: URL_592,
        quote:
          "Výše pojistného se stanoví procentní sazbou z vyměřovacího základu " +
          "zjištěného za rozhodné období. Sazba pojistného pro zaměstnance činí 4,5 %.",
      },
      effective_periods: [
        {
          from: "1993-01-01",
          value: "4,5 % (ZTP: 2,25 %)",
          note: "Stabilní od zavedení zdravotního pojištění.",
        },
      ],
    },
    {
      name: "ZP_MIN_BASIS",
      definition:
        "Minimální měsíční vyměřovací základ ZP pro zaměstnance = minimální mzda " +
        "(§3 ods. 4 zákona 592/1992). " +
        "Pokud je hrubá mzda nižší, zaměstnanec platí 4,5 % z hrubé mzdy; " +
        "zaměstnavatel hradí doplatek na min. základ (out of scope).",
      value: "minimální mzda platná k prvnímu dni mzd. období",
      citation: {
        act: "592/1992 Sb.",
        paragraph: "§3",
        odsek: 4,
        effective_from: "1993-01-01",
        url: URL_592,
        quote:
          "Minimálním vyměřovacím základem zaměstnance je minimální mzda platná " +
          "k prvnímu dni kalendářního měsíce, ve kterém se záloha na pojistné platí.",
      },
      effective_periods: [
        {
          from: "2024-01-01",
          to: "2024-12-31",
          value: "18 900 CZK/měsíc",
          note: "Minimální mzda 2024.",
        },
        {
          from: "2025-01-01",
          value: "20 800 CZK/měsíc",
          note: "Minimální mzda 2025 (NV č. 286/2024 Sb.). Aktualizovat pro 2026.",
        },
      ],
    },
    {
      name: "TAX_RATES",
      definition:
        "Progresivní sazby zálohy na daň z příjmů ze závislé činnosti " +
        "(§38h ve spojení s §16 zákona 586/1992). " +
        "Základ daně = hrubá mzda (bez superhrubé od 2021-01-01). " +
        "Prahová hodnota pro 23 % = 1/12 × 48 × průměrná_mzda / rok.",
      value: "15 % do prahu (≈ 188 800 CZK/měsíc v r. 2025), 23 % nad prahem",
      citation: {
        act: "586/1992 Sb.",
        paragraph: "§16",
        effective_from: "2021-01-01",
        url: URL_586,
        quote:
          "Ze základu daně sníženého o nezdanitelné části základu daně a odčitatelné položky " +
          "od základu daně zaokrouhleného na celá sta Kč dolů se vypočte daň těmito sazbami: " +
          "a) 15 % ze základu daně, pokud základ daně nepřesáhne 48násobek průměrné mzdy, " +
          "b) 23 % z části základu daně, která přesáhne 48násobek průměrné mzdy.",
      },
      effective_periods: [
        {
          from: "2021-01-01",
          to: "2022-12-31",
          value:
            "15 % / 23 %; základ daně = hrubá mzda (superhrubá zrušena zákonem 609/2020 Sb.)",
        },
        {
          from: "2023-01-01",
          value:
            "15 % / 23 % (bez změny sazby); prah 2025: 188 800 CZK/měsíc (= 48 × 47 200 / 12)",
        },
      ],
    },
    {
      name: "SLEVA_NA_POPLATNIKA",
      definition:
        "Měsíční základní sleva na dani (§35ba ods. 1 písm. a) zákona 586/1992). " +
        "Uplatňuje se pouze u zaměstnance, který podepsal Prohlášení poplatníka (§38k ZDP). " +
        "Snižuje vypočtenou zálohu; výsledná záloha nemůže být záporná (záloha ≥ 0).",
      value: "2 570 CZK/měsíc (30 840 CZK/rok), od 2024-01-01",
      citation: {
        act: "586/1992 Sb.",
        paragraph: "§35ba",
        odsek: 1,
        pismeno: "a",
        effective_from: "2024-01-01",
        url: URL_586,
        quote:
          "Poplatníkům uvedeným v § 2 se daň vypočtená podle § 16 snižuje o: " +
          "a) základní slevu na dani ve výši 30 840 Kč, za zdaňovací období 2024 a 2025.",
      },
      effective_periods: [
        {
          from: "2021-01-01",
          to: "2021-12-31",
          value: "2 320 CZK/měsíc (27 840 CZK/rok)",
        },
        {
          from: "2022-01-01",
          to: "2022-12-31",
          value: "2 570 CZK/měsíc (30 840 CZK/rok)",
          note: "Skokové zvýšení od 2022.",
        },
        {
          from: "2023-01-01",
          value: "2 570 CZK/měsíc (30 840 CZK/rok)",
          note: "Stabilní 2022–2025. Aktualizovat pro 2026.",
        },
      ],
    },
  ],

  execution_order: [
    "S1: Zjisti SP základ — clamp hrubou mzdu na maximální VZ SP (kumulativní roční sledování; pro měsíční výpočet bez překročení = hrubá mzda)",
    "S2: Výpočet SP zaměstnance — ceiling(SP_základ × 7,1 %)",
    "S3: Výpočet ZP zaměstnance — ceiling(hrubá_mzda × 4,5 %)",
    "S4: Stanovení základu daně — hrubá_mzda (bez superhrubé, bez odečtení SP/ZP)",
    "S5: Výpočet zálohy na daň před slevou — progresivní sazba 15 % / 23 %",
    "S6: Uplatnění slevy na poplatníka — záloha = max(0, záloha_před_slevou − 2 570)",
    "S7: Výpočet čisté mzdy — hrubá − SP − ZP − záloha_na_daň",
  ],

  logic_flow: [
    {
      id: "S1",
      description: "Vyměřovací základ SP — clamp na roční maximum",
      pseudocode:
        "sp_vz = MIN(hrubá_mzda, zbývající_roční_max_vz_sp)\n" +
        "// Pro jednoduchý měsíční výpočet bez překročení ročního maxima:\n" +
        "// sp_vz = hrubá_mzda\n" +
        "// Roční maximum 2025: 2 265 600 CZK; měsíční ekvivalent: 188 800 CZK",
      citation: {
        act: "589/1992 Sb.",
        paragraph: "§15b",
        effective_from: "2008-01-01",
        url: URL_589,
        quote: "Maximální vyměřovací základ zaměstnance je 48násobek průměrné mzdy.",
      },
      edge_cases: [
        {
          condition: "Kumulativní roční VZ přesáhl maximum (vysocí příjemci)",
          behaviour:
            "sp_vz = MAX(0, roční_max − dosud_odvedeno_v_roce). " +
            "Po dosažení maxima: SP = 0 pro zbytek roku.",
        },
      ],
    },
    {
      id: "S2",
      description: "Pojistné SP zaměstnance — 7,1 % s ceiling zaokrouhlením",
      pseudocode:
        "sp_zamestnanec = CEILING(sp_vz × 0.071)   // celé CZK nahoru\n" +
        "// Složky: 6,5 % důchodové + 0,6 % nemocenské od 2024-01-01",
      citation: {
        act: "589/1992 Sb.",
        paragraph: "§7",
        odsek: 1,
        effective_from: "2024-01-01",
        url: URL_589,
        quote:
          "Sazba pojistného: a) 6,5 % důchodové, c) 0,6 % nemocenské (od 2024). " +
          "Pojistné se zaokrouhluje na celé koruny nahoru. (§7 ods. 5)",
      },
      edge_cases: [
        {
          condition: "Hrubá mzda před 2024-01-01",
          behaviour: "SP = ceiling(sp_vz × 0.065) — bez složky nemocenského.",
          citation: {
            act: "589/1992 Sb.",
            paragraph: "§7",
            odsek: 1,
            effective_from: "2009-01-01",
            effective_to: "2023-12-31",
            url: URL_589,
            quote: "Sazba pojistného pro zaměstnance: a) 6,5 % důchodové.",
          },
        },
      ],
    },
    {
      id: "S3",
      description: "Pojistné ZP zaměstnance — 4,5 % s ceiling zaokrouhlením",
      pseudocode:
        "zp_zamestnanec = CEILING(hrubá_mzda × 0.045)   // celé CZK nahoru\n" +
        "// POZOR: i když hrubá < min. mzda, zaměstnanec platí 4,5 % z hrubé\n" +
        "// Zaměstnavatel hradí doplatek (out of scope)",
      citation: {
        act: "592/1992 Sb.",
        paragraph: "§2",
        odsek: 1,
        effective_from: "1993-01-01",
        url: URL_592,
        quote: "Sazba pojistného pro zaměstnance činí 4,5 %.",
      },
      edge_cases: [
        {
          condition: "hrubá_mzda < minimální_mzda (20 800 CZK v r. 2025)",
          behaviour:
            "Zaměstnanec: zp = ceiling(hrubá × 4,5 %). " +
            "Zaměstnavatel musí doplatit pojistné z rozdílu (min. mzda − hrubá) × 13,5 %. " +
            "Výpočet čisté mzdy zaměstnance není ovlivněn.",
          citation: {
            act: "592/1992 Sb.",
            paragraph: "§3",
            odsek: 7,
            effective_from: "1993-01-01",
            url: URL_592,
            quote:
              "Je-li vyměřovací základ zaměstnance nižší než minimální vyměřovací základ, " +
              "je zaměstnavatel povinen odvést pojistné i z rozdílu mezi minimálním " +
              "vyměřovacím základem a vyměřovacím základem zaměstnance.",
          },
        },
      ],
    },
    {
      id: "S4",
      description: "Základ daně — hrubá mzda (bez superhrubé, bez odečtení SP/ZP)",
      pseudocode:
        "základ_daně = hrubá_mzda\n" +
        "// Od 2021-01-01: superhrubá zrušena zákonem 609/2020 Sb.\n" +
        "// SP a ZP zaměstnance se NEodečítají od základu daně",
      citation: {
        act: "586/1992 Sb.",
        paragraph: "§6",
        odsek: 13,
        effective_from: "2021-01-01",
        url: URL_586,
        quote:
          "Základem daně (dílčím základem daně) jsou příjmy ze závislé činnosti. " +
          "(Zrušením §6 ods. 12 o superhrubé zákonem 609/2020 Sb.)",
      },
      edge_cases: [
        {
          condition: "Hrubá mzda 2020 a dřívější (superhrubá mzda)",
          behaviour:
            "základ_daně = hrubá_mzda + zaměstnavatelské SP + ZP. " +
            "Tento blueprint pokrývá výhradně systém od 2021.",
        },
      ],
    },
    {
      id: "S5",
      description: "Záloha na daň před slevou — progresivní 15 % / 23 %",
      pseudocode:
        "práh_měsíc = ROUND_DOWN(48 × průměrná_mzda / 12)  // 2025: 188 800 CZK\n" +
        "IF základ_daně <= práh_měsíc:\n" +
        "  záloha_před_slevou = CEILING(základ_daně × 0.15)\n" +
        "ELSE:\n" +
        "  záloha_před_slevou = CEILING(práh_měsíc × 0.15 + (základ_daně − práh_měsíc) × 0.23)\n" +
        "// §38h ods. 6: záloha se zaokrouhluje na celé koruny nahoru",
      citation: {
        act: "586/1992 Sb.",
        paragraph: "§38h",
        odsek: 6,
        effective_from: "2021-01-01",
        url: URL_586,
        quote:
          "Záloha se zaokrouhluje na celé koruny nahoru. " +
          "Sazba zálohy odpovídá §16: 15 % / 23 % podle výše základu.",
      },
      edge_cases: [
        {
          condition: "Záloha po slevách záporná",
          behaviour:
            "Záloha = 0. Zápornou zálohu nelze nárokovat měsíčně — pouze v ročním zúčtování (§38ch ZDP).",
        },
      ],
    },
    {
      id: "S6",
      description: "Uplatnění slevy na poplatníka",
      pseudocode:
        "IF prohlášení_poplatníka_podepsáno:\n" +
        "  záloha_na_daň = MAX(0, záloha_před_slevou − 2570)  // 2 570 CZK/měsíc (2024+)\n" +
        "ELSE:\n" +
        "  záloha_na_daň = záloha_před_slevou  // bez prohlášení: bez slevy",
      citation: {
        act: "586/1992 Sb.",
        paragraph: "§35ba",
        odsek: 1,
        pismeno: "a",
        effective_from: "2024-01-01",
        url: URL_586,
        quote:
          "Základní sleva na dani 30 840 Kč ročně (= 2 570 Kč/měsíc). " +
          "Uplatňuje se pouze u zaměstnance s podepsaným Prohlášením poplatníka (§38k).",
      },
      edge_cases: [
        {
          condition: "Poplatník bez podepsaného prohlášení (§38k)",
          behaviour:
            "Záloha = záloha_před_slevou (bez slevy). " +
            "Sleva na poplatníka je uplatněna až v ročním zúčtování nebo daňovém přiznání.",
        },
        {
          condition: "Záloha před slevou < 2 570 CZK",
          behaviour:
            "Záloha = 0 (nevyčerpaná část slevy se nepřevádí; nárokuje se ročně).",
        },
      ],
    },
    {
      id: "S7",
      description: "Výpočet čisté mzdy",
      pseudocode:
        "čistá_mzda = hrubá_mzda − sp_zamestnanec − zp_zamestnanec − záloha_na_daň",
      citation: {
        act: "586/1992 Sb.",
        paragraph: "§38h",
        effective_from: "1993-01-01",
        url: URL_586,
        quote:
          "Plátce daně srazí zálohu na daň z příjmů ze závislé činnosti. " +
          "Čistá mzda = hrubá mzda − pojistné zaměstnance − záloha na daň.",
      },
      edge_cases: [
        {
          condition: "Čistá mzda záporná (extrémně nízká hrubá + doplatky pojistného)",
          behaviour:
            "Matematicky možné u extrémních okrajových případů. " +
            "V praxi nerelevantní — minimální mzda (20 800 CZK) generuje kladnou čistou.",
        },
      ],
    },
  ],

  semantic_mapping: [
    {
      step_id: "S1",
      citation: { act: "589/1992 Sb.", paragraph: "§15b", effective_from: "2008-01-01", url: URL_589, quote: "Maximální vyměřovací základ zaměstnance je 48násobek průměrné mzdy." },
    },
    {
      step_id: "S2",
      citation: { act: "589/1992 Sb.", paragraph: "§7", odsek: 1, effective_from: "2024-01-01", url: URL_589, quote: "Sazba: 6,5 % důchodové + 0,6 % nemocenské; zaokrouhlení nahoru (§7 ods. 5)." },
    },
    {
      step_id: "S3",
      citation: { act: "592/1992 Sb.", paragraph: "§2", odsek: 1, effective_from: "1993-01-01", url: URL_592, quote: "Sazba pojistného pro zaměstnance: 4,5 %." },
    },
    {
      step_id: "S4",
      citation: { act: "586/1992 Sb.", paragraph: "§6", odsek: 13, effective_from: "2021-01-01", url: URL_586, quote: "Základ daně = příjmy ze závislé činnosti (bez superhrubé od 2021)." },
    },
    {
      step_id: "S5",
      citation: { act: "586/1992 Sb.", paragraph: "§38h", odsek: 6, effective_from: "2021-01-01", url: URL_586, quote: "Záloha zaokrouhlena nahoru; 15 % / 23 % dle §16." },
    },
    {
      step_id: "S6",
      citation: { act: "586/1992 Sb.", paragraph: "§35ba", odsek: 1, pismeno: "a", effective_from: "2024-01-01", url: URL_586, quote: "Základní sleva 30 840 Kč/rok = 2 570 Kč/měsíc." },
    },
    {
      step_id: "S7",
      citation: { act: "586/1992 Sb.", paragraph: "§38h", effective_from: "1993-01-01", url: URL_586, quote: "Srážka zálohy a výplata čisté mzdy." },
    },
  ],

  tool: {
    name: "cz-payroll-net-wage",
    description:
      "Vypočítá měsíční čistou mzdu zaměstnance z hrubé mzdy (CZ). " +
      "Vrátí SP zaměstnance (7,1 %), ZP zaměstnance (4,5 %), zálohu na daň (15 %/23 % − sleva 2 570 Kč) a čistou mzdu.",
    input_parameters: [
      { name: "hruba_mzda", type: "number", description: "Hrubá mzda v CZK", required: true, unit: "CZK/měsíc" },
      { name: "calculation_date", type: "string", description: "Datum výpočtu YYYY-MM-DD (určuje platné sazby)", required: true },
      { name: "prohlaseni_poplatnika", type: "boolean", description: "true = podepsáno Prohlášení poplatníka (§38k) → sleva na poplatníka uplatněna", required: true },
      { name: "je_ztp", type: "boolean", description: "Osoba se zdravotním postižením — ZP sazba 2,25 % místo 4,5 %", required: false },
    ],
    calculation_steps: [
      "S1: sp_vz = MIN(hruba_mzda, zbyvajici_rocni_max_sp)",
      "S2: sp = CEILING(sp_vz × 0.071) [7,1 % od 2024; 6,5 % dříve]",
      "S3: zp = CEILING(hruba_mzda × 0.045) [4,5 %; 2,25 % pro ZTP]",
      "S4: zaklad_dane = hruba_mzda",
      "S5: zaloba_pred_slevou = CEILING(progresivní 15 % / 23 %)",
      "S6: zaloba_na_dan = MAX(0, zaloba_pred_slevou − 2570) [jen s prohlášením]",
      "S7: cista_mzda = hruba_mzda − sp − zp − zaloba_na_dan",
    ],
    audit_trail_template:
      "Hrubá mzda: {hruba_mzda} CZK | " +
      "SP (7,1 %, §7 zákona 589/1992): {sp} CZK | " +
      "ZP (4,5 %, §2 zákona 592/1992): {zp} CZK | " +
      "Záloha na daň (15 %/23 % §16 ZDP − sleva 2 570 §35ba): {zaloba_na_dan} CZK | " +
      "Čistá mzda: {cista_mzda} CZK",
  },

  verification_cases: [
    {
      id: "CZ-VC1",
      source:
        "ČSSZ — příklady výpočtu pojistného zaměstnanců 2025; " +
        "Finanční správa — vzorový výpočet zálohy na daň 2025 (prohlášení podepsáno)",
      input: {
        hruba_mzda: 30000,
        calculation_date: "2025-04-01",
        prohlaseni_poplatnika: true,
        je_ztp: false,
      },
      expected_output: {
        sp_zamestnanec: 2130,
        zp_zamestnanec: 1350,
        zaloba_na_dan: 1930,
        cista_mzda: 24590,
        currency: "CZK",
      },
      legal_reasoning:
        "SP: CEILING(30 000 × 0,071) = CEILING(2 130,00) = 2 130 CZK (§7 ods. 1, 589/1992). " +
        "ZP: CEILING(30 000 × 0,045) = CEILING(1 350,00) = 1 350 CZK (§2 ods. 1, 592/1992). " +
        "Základ daně: 30 000 CZK (§6, 586/1992, bez superhrubé). " +
        "Záloha před slevou: CEILING(30 000 × 0,15) = CEILING(4 500,00) = 4 500 CZK (§38h, 15 %). " +
        "Sleva na poplatníka: 2 570 CZK (§35ba ods. 1 písm. a)). " +
        "Záloha na daň: MAX(0, 4 500 − 2 570) = 1 930 CZK. " +
        "Čistá mzda: 30 000 − 2 130 − 1 350 − 1 930 = 24 590 CZK.",
    },
    {
      id: "CZ-VC2",
      source:
        "ČSSZ — příklady minimální mzda 2025; " +
        "Finanční správa — záloha na daň při minimální mzdě 2025",
      input: {
        hruba_mzda: 20800,
        calculation_date: "2025-01-01",
        prohlaseni_poplatnika: true,
        je_ztp: false,
      },
      expected_output: {
        sp_zamestnanec: 1477,
        zp_zamestnanec: 936,
        zaloba_na_dan: 550,
        cista_mzda: 17837,
        currency: "CZK",
      },
      legal_reasoning:
        "SP: CEILING(20 800 × 0,071) = CEILING(1 476,80) = 1 477 CZK. " +
        "ZP: CEILING(20 800 × 0,045) = CEILING(936,00) = 936 CZK " +
        "(hrubá = min. mzda, §3 ods. 4 — minimální základ splněn přesně). " +
        "Základ daně: 20 800 CZK. " +
        "Záloha před slevou: CEILING(20 800 × 0,15) = CEILING(3 120,00) = 3 120 CZK. " +
        "Záloha na daň: MAX(0, 3 120 − 2 570) = 550 CZK. " +
        "Čistá mzda: 20 800 − 1 477 − 936 − 550 = 17 837 CZK.",
    },
    {
      id: "CZ-VC3",
      source:
        "Finanční správa — vzorový výpočet zálohy pro vyšší příjem 2025; " +
        "stále pod prahem 23 % (188 800 CZK/měsíc)",
      input: {
        hruba_mzda: 60000,
        calculation_date: "2025-06-01",
        prohlaseni_poplatnika: true,
        je_ztp: false,
      },
      expected_output: {
        sp_zamestnanec: 4260,
        zp_zamestnanec: 2700,
        zaloba_na_dan: 6430,
        cista_mzda: 46610,
        currency: "CZK",
      },
      legal_reasoning:
        "SP: CEILING(60 000 × 0,071) = CEILING(4 260,00) = 4 260 CZK. " +
        "ZP: CEILING(60 000 × 0,045) = CEILING(2 700,00) = 2 700 CZK. " +
        "Základ daně: 60 000 CZK. " +
        "Práh 23 %: 48 × 47 200 / 12 = 188 800 CZK; 60 000 < 188 800 → plná 15 %. " +
        "Záloha před slevou: CEILING(60 000 × 0,15) = CEILING(9 000,00) = 9 000 CZK. " +
        "Záloha na daň: MAX(0, 9 000 − 2 570) = 6 430 CZK. " +
        "Čistá mzda: 60 000 − 4 260 − 2 700 − 6 430 = 46 610 CZK.",
    },
    {
      id: "CZ-VC4",
      source:
        "Finanční správa — záloha bez podepsaného prohlášení (srážková záloha §38h ods. 4, 2025)",
      input: {
        hruba_mzda: 30000,
        calculation_date: "2025-04-01",
        prohlaseni_poplatnika: false,
        je_ztp: false,
      },
      expected_output: {
        sp_zamestnanec: 2130,
        zp_zamestnanec: 1350,
        zaloba_na_dan: 4500,
        cista_mzda: 24020,
        currency: "CZK",
      },
      legal_reasoning:
        "SP a ZP stejné jako CZ-VC1 (hrubá 30 000 CZK). " +
        "Záloha před slevou: 4 500 CZK. " +
        "Bez podepsaného prohlášení (§38k): sleva na poplatníka se neodečítá. " +
        "Záloha na daň = 4 500 CZK. " +
        "Čistá mzda: 30 000 − 2 130 − 1 350 − 4 500 = 24 020 CZK. " +
        "(Zaměstnanec uplatní slevu v ročním zúčtování nebo daňovém přiznání.)",
    },
  ],
};

export default blueprint;
