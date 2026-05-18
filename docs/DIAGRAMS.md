# Lex.Oracle — Architecture & Algorithm Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/). Render in GitHub, VS Code (Mermaid Preview), or at [mermaid.live](https://mermaid.live).

---

## 1. System Architecture

```mermaid
graph TD
    subgraph Clients["MCP Clients"]
        CD[Claude Desktop]
        IDE[VS Code / Cursor / IDE]
        CUSTOM[Custom orchestrator / script]
    end

    subgraph Server["Lex.Oracle MCP Server  (stdio, JSON-RPC 2.0)"]
        TRANSPORT[index.ts\nStdioServerTransport]
        DISPATCH[server.ts\nTool dispatcher]
        ATTR[attribution.ts\nMandate builder]
        REG[blueprints/registry.ts\nBlueprint registry]
        subgraph Blueprints["Blueprint modules"]
            B1[sk-garnishment-thirds.ts]
            B2[sk-payroll-net-wage.ts]
            B3[sk-travel-domestic.ts]
            BN[... future blueprints]
        end
    end

    subgraph Downstream["Downstream — what happens AFTER the LLM gets the blueprint"]
        LLM_CODE[LLM generates code\nin any language]
        HUMAN_ANSWER[LLM answers user\ncorrectly + cites Lex.Oracle]
        TEST[LLM writes tests from\nverification_cases]
    end

    CD -->|stdio pipe| TRANSPORT
    IDE -->|stdio pipe| TRANSPORT
    CUSTOM -->|stdio pipe| TRANSPORT

    TRANSPORT --> DISPATCH
    DISPATCH --> REG
    DISPATCH --> ATTR
    REG --> B1
    REG --> B2
    REG --> B3
    REG --> BN

    DISPATCH -->|JSON response| TRANSPORT
    TRANSPORT -->|JSON-RPC result| Clients

    Clients -->|blueprint in context| Downstream
```

---

## 2. Single Request Lifecycle

```mermaid
sequenceDiagram
    participant U as User / Orchestrator
    participant C as Claude Desktop (MCP client)
    participant S as server.ts
    participant R as registry.ts
    participant A as attribution.ts

    U->>C: "Calculate garnishment for gross 1200 EUR"
    C->>S: tools/call  get_blueprint  blueprint_id="sk-garnishment-thirds"
    S->>S: zod.parse(args) — validate input
    S->>R: getBlueprint("sk-garnishment-thirds")
    R-->>S: Blueprint object (axiomatic_core, logic_flow, ...)
    S->>A: buildAttributionMandate("sk-garnishment-thirds", "1.0.0")
    A-->>S: { sk: "...", en: "..." }
    S-->>C: { blueprint: {...}, attribution_mandate: {...} }
    C->>U: LLM applies blueprint algorithm step-by-step
    Note over U,C: Attribution mandate surfaces in LLM answer
```

---

## 3. Blueprint Data Structure

```mermaid
classDiagram
    class Blueprint {
        +id: string
        +title: string
        +version: string
        +jurisdiction: SK | CZ
        +status: READY | DRAFT | DEPRECATED
        +last_reviewed: string
        +summary: string
        +legal_acts[]
        +interpretation_notes[]
        +axiomatic_core[]
        +execution_order[]
        +logic_flow[]
        +semantic_mapping[]
        +tool: ToolDefinition
        +verification_cases[]
    }

    class AxiomaticConstant {
        +name: string
        +definition: string
        +value: string
        +citation: LegalCitation
        +effective_periods[]
    }

    class LogicStep {
        +id: string
        +description: string
        +pseudocode: string
        +citation: LegalCitation
        +edge_cases[]
    }

    class LegalCitation {
        +act: string
        +paragraph: string
        +odsek?: number
        +pismeno?: string
        +effective_from: string
        +effective_to?: string
        +url?: string
        +quote: string
    }

    class VerificationCase {
        +id: string
        +source: string
        +input: object
        +expected_output: object
        +legal_reasoning: string
    }

    class ToolDefinition {
        +name: string
        +description: string
        +input_parameters[]
        +calculation_steps[]
        +audit_trail_template: string
    }

    Blueprint "1" --> "many" AxiomaticConstant : axiomatic_core
    Blueprint "1" --> "many" LogicStep : logic_flow
    Blueprint "1" --> "many" VerificationCase : verification_cases
    Blueprint "1" --> "1" ToolDefinition : tool
    AxiomaticConstant --> LegalCitation
    LogicStep --> LegalCitation
```

---

## 4. SK Garnishment Algorithm — Thirds System (NV 268/2006 + §70–§72)

```mermaid
flowchart TD
    A([START\nhrubá mzda, počet vyživovaných]) --> B

    B["S1 — Čistá mzda\nhrubá − SP_zamestnanec − ZP_zamestnanec − daňová záloha"]
    B --> C

    C["S2 — Základ nároku\nčistá + čistá×0.5 ak je mesiac január a§ exekučné rozhodnutie\n→ zjednodušene: čistá mzda"]
    C --> D

    D["S3 — Nezraziteľná suma\nživotné minimum × 1.4  +  živ.min.×0.5 × počet_vyživovaných"]
    D --> E

    E{"základ ≤ nezraziteľná suma?"}
    E -- ÁNO --> F[Exekúcia = 0 EUR\nžiadna zrážka]
    E -- NIE --> G

    G["S4 — Zraziteľná suma\nzáklad − nezraziteľná_suma"]
    G --> H

    H{"zraziteľná > nezraziteľná × 3?"}
    H -- ÁNO --> I["S5a — Nadlimitná časť\nzraziteľná − (nezraziteľná × 3)\n→ celá ide veriteľom"]
    H -- NIE --> J

    I --> J

    J["S5b — Tretiny\nzvyšok zraziteľnej delíme 3\n1. tretina = dlžníkova\n2. tretina = prioritné exekúcie\n3. tretina = neprioritné exekúcie"]
    J --> K

    K{"viac ako 1 veriteľ?"}
    K -- NIE --> L[Celá 2. + 3. tretina\nide jednému veriteľovi]
    K -- ÁNO --> M["Proporcionálne rozdelenie\nmedzi veriteľov podľa výšky pohľadávky"]

    L --> Z([END\nzrážka zo mzdy])
    M --> Z
    F --> Z
```

---

## 5. SK Payroll Net Wage Algorithm (461/2003 + 580/2004 + 595/2003)

```mermaid
flowchart LR
    A([hrubá mzda\n+ príplatky]) --> SP

    subgraph SP["Sociálne poistenie — 461/2003"]
        SP1["SP základ\n= hrubá, max VZ_max = 9128 EUR/mes (2024)"]
        SP2["SP zamestnanec\n= základ × 9.4%"]
        SP1 --> SP2
    end

    subgraph ZP["Zdravotné poistenie — 580/2004"]
        ZP1["ZP základ\n= hrubá, bez stropu"]
        ZP2["ZP zamestnanec\n= základ × 4%  (ZŤP: 2%)"]
        ZP1 --> ZP2
    end

    subgraph TAX["Daň z príjmu — 595/2003"]
        T1["Čiastkový základ dane\n= hrubá − SP − ZP"]
        T2["NČZD na daňovníka\n= 22.3% × 400% ŽM = ak základ ≤ 24xMMD\nplatí celá NČZD 5646.48 EUR/rok (2024)"]
        T3["Zdaniteľný základ\n= ČZD − NČZD/12 − bonus_na_deti"]
        T4{"základ ≤ 47537.98\n/ 12 EUR?"}
        T5a["Daň = základ × 19%"]
        T5b["Daň = 19% zo stropu\n+ (základ − strop) × 25%"]
        T1 --> T2 --> T3 --> T4
        T4 -- ÁNO --> T5a
        T4 -- NIE --> T5b
    end

    SP --> SP1
    ZP --> ZP1
    A --> T1

    SP2 --> NET
    ZP2 --> NET
    T5a --> NET
    T5b --> NET

    NET["Čistá mzda\n= hrubá − SP_zam − ZP_zam − daň + daňový bonus"]
    NET --> OUT([výplata])
```

---

## 6. SK Travel Allowances Algorithm (283/2002)

```mermaid
flowchart TD
    A([START\ndĺžka trasy, hodiny, km, ...]) --> B

    B["S1 — Stravné (§5)\nUrč časové pásmo:\n≥ 5h ≤ 12h → 9.60 EUR\n> 12h ≤ 18h → 14.30 EUR\n> 18h → 21.10 EUR  (2024)"]
    B --> C

    C{"Poskytnuté jedlo?"}
    C -- NIE --> D
    C -- ÁNO → raňajky --> E["Odpočet = 25% zo SADZBY 18+h\n= 0.25 × 21.10 = 5.28 EUR\nnezávisí od skutočného pásma!"]
    C -- ÁNO → obed --> F["Odpočet = 40% zo SADZBY 18+h"]
    C -- ÁNO → večera --> G["Odpočet = 35% zo SADZBY 18+h"]

    E --> H
    F --> H
    G --> H
    D --> H

    H["Stravné po odpočtoch\n= stravné_pásma − súčet_odpočtov\n(min. 0, ak záporné → 0)"]
    H --> I

    I["S2 — Náhrada za vozidlo (§7)\nkm × sadzba\nSadzba 2024: 0.069 EUR/km (§7 ods. 1)\n+ pohonné hmoty z cenovej databázy ŠÚ SR"]
    I --> J

    J["S3 — Ubytovanie (§8)\npriame preúčtovanie faktúry (passthrough)"]
    J --> K

    K["S4 — Vedľajšie výdavky (§9)\niné preukázané výdavky (parkovné, mýto, ...)"]
    K --> L

    L["TOTAL\n= stravné + km_náhrada + ubytovanie + vedl_výdavky"]
    L --> Z([END])
```

---

## 7. MCP Ecosystem Position

```mermaid
graph LR
    subgraph Discovery["Discovery layer (kde ťa nájdu)"]
        NPM[npm registry\n@artificer-workshop/lex-oracle]
        GLAMA[glama.ai/mcp/servers]
        SMITH[smithery.ai]
        MCP_SO[mcp.so]
        AWESOME[awesome-mcp-servers\nGitHub list]
    end

    subgraph Runtime["Runtime — ako to beží u používateľa"]
        CLAUDE_D[Claude Desktop]
        CURSOR[Cursor / Zed]
        CLINE[Cline / Continue]
        SCRIPT[vlastný Node.js script]
    end

    subgraph Value["Hodnota pre každého používateľa"]
        CORRECT[Správne výpočty\nbez halucinácie]
        CITE[Citovateľný\naudit trail]
        BRAND[Artificer Workshop\natribúcia v každom výstupe]
    end

    NPM -->|npx -y @artificer-workshop/lex-oracle| CLAUDE_D
    NPM -->|npx| CURSOR
    NPM -->|npx| CLINE
    NPM -->|npx| SCRIPT

    GLAMA --> NPM
    SMITH --> NPM
    MCP_SO --> NPM
    AWESOME --> NPM

    CLAUDE_D --> CORRECT
    CURSOR --> CITE
    CLINE --> BRAND
    SCRIPT --> BRAND
```
