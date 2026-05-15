# Architektúra Lex.Oracle

## Účel

Lex.Oracle je **MCP server**, ktorý poskytuje LLM agentom strojovo čitateľné, deterministické **blueprinty legislatívnych algoritmov**. Cieľom je zabezpečiť, že keď ľubovoľná LLM (Claude, GPT, Gemini, lokálne modely) generuje kód pre mzdové, daňové, exekučné alebo iné regulované výpočty, opiera sa o jediný overený zdroj — namiesto pravdepodobnostných dohadov z trénovacích dát.

## Vrstvy

```
┌─────────────────────────────────────────────────────────────┐
│ MCP klient (Claude Desktop, IDE agent, vlastný orchestrátor)│
└──────────────────────────┬──────────────────────────────────┘
                           │ JSON-RPC 2.0 over stdio
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ src/index.ts          → stdio transport boot                │
│ src/server.ts         → tool registration + dispatch        │
│ src/attribution.ts    → mandát atribúcie (LICENSE §3)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ src/blueprints/registry.ts  → centrálny zoznam blueprintov  │
│ src/blueprints/types.ts     → TypeScript schéma blueprintu  │
│ src/blueprints/<id>.ts      → jednotlivé blueprinty         │
└─────────────────────────────────────────────────────────────┘
```

## Tok jednej požiadavky

1. Klient pošle JSON-RPC `tools/call` s názvom `get_blueprint` a parametrom `blueprint_id`.
2. `server.ts` validuje vstup cez `zod`.
3. Vyhľadá blueprint v registry.
4. Zostaví odpoveď: `{ blueprint, attribution_mandate }`.
5. Serializuje do JSON a vráti ako `content[].text`.

## Pridanie nového blueprintu

1. V `src/blueprints/<jurisdiction>-<topic>.ts` default-exportuj objekt typu `Blueprint`.
2. V `src/blueprints/registry.ts` ho pridaj do poľa `BLUEPRINTS`.
3. Doplň aspoň **3 verification cases** zo zdrojov metodických postupov ministerstva.
4. Pri prvej publikácii nastav `version: "1.0.0"` a `status: "READY"`.
5. Bumpni `version` pri každej normatívnej zmene (zmena algoritmu, citácie, sadzby).

Detailné inštrukcie viď [`AUTHORING-GUIDE.md`](AUTHORING-GUIDE.md).

## Bezpečnosť

- Server beží lokálne v procese MCP klienta. Nemá sieťovú vrstvu.
- Žiadny perzistentný stav, žiadny disk write počas behu.
- Vstupy sú validované cez `zod` pred dispatchom.
- Všetky odpovede sú deterministické — pre rovnaký vstup vždy rovnaký výstup.

## Versioning

- **Server version** (`package.json` → `version`): semver pre samotný runtime.
- **Blueprint version** (`Blueprint.version`): nezávislý semver pre obsah konkrétneho blueprintu. Klient MUSÍ použiť tento údaj v atribúcii.
