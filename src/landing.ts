/**
 * Lex.Oracle landing page — SK/EN, Amber.Glass glassmorphism design system.
 * Served at GET / by the HTTP transport server.
 */

const BLUEPRINTS_SK = [
  { id: "sk-payroll-net-wage",            label: "Mzda netto (SP + ZP + daň)" },
  { id: "sk-garnishment-thirds",          label: "Exekúcia mzdy — systém tretín" },
  { id: "sk-travel-domestic",             label: "Cestovné náhrady (283/2002)" },
  { id: "sk-annual-tax-reconciliation",   label: "Ročné zúčtovanie §38" },
  { id: "sk-szco-annual-settlement",      label: "SZČO ročné odvodové vyrovnanie" },
  { id: "sk-b2b-dph",                     label: "DPH — sadzby a odpočet (222/2004)" },
  { id: "sk-b2b-dppo",                    label: "DPPO — korporátna daň (595/2003)" },
  { id: "sk-b2b-odpisy",                  label: "Daňové odpisy — 7 skupín" },
  { id: "sk-b2b-rz-zp",                   label: "Ročné zúčtovanie ZP (580/2004)" },
  { id: "sk-b2b-zrazkova-dan",            label: "Zrážková daň §43" },
  { id: "cz-payroll-net-wage",            label: "CZ mzda netto (SP + ZP + záloha)" },
];

const BLUEPRINTS_EN = [
  { id: "sk-payroll-net-wage",            label: "Net Wage (SP + ZP + Tax)" },
  { id: "sk-garnishment-thirds",          label: "Salary Garnishment — Thirds System" },
  { id: "sk-travel-domestic",             label: "Domestic Travel Allowances (Act 283/2002)" },
  { id: "sk-annual-tax-reconciliation",   label: "Annual Tax Reconciliation §38" },
  { id: "sk-szco-annual-settlement",      label: "SZČO Annual Insurance Settlement" },
  { id: "sk-b2b-dph",                     label: "VAT — Rates & Deduction (Act 222/2004)" },
  { id: "sk-b2b-dppo",                    label: "Corporate Income Tax (Act 595/2003)" },
  { id: "sk-b2b-odpisy",                  label: "Tax Depreciation — 7 Groups" },
  { id: "sk-b2b-rz-zp",                   label: "Annual Health Insurance Settlement" },
  { id: "sk-b2b-zrazkova-dan",            label: "Withholding Tax §43" },
  { id: "cz-payroll-net-wage",            label: "CZ Net Wage (SP + ZP + Advance Tax)" },
];

export function renderLanding(lang: string): string {
  const sk = lang === "sk";
  const blueprints = sk ? BLUEPRINTS_SK : BLUEPRINTS_EN;

  const t = (s: string, e: string) => (sk ? s : e);

  const blueprintCards = blueprints.map(({ id, label }) => `
    <div class="bp-card">
      <span class="bp-id">${id}</span>
      <span class="bp-label">${label}</span>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lex.Oracle — ${t("Legislatívne blueprinty pre SK/CZ", "Legislative Blueprints for SK/CZ")}</title>
  <meta name="description" content="${t(
    "Deterministické, citovateľné legislatívne blueprinty pre slovenské a české právo. MCP server pre LLM agentov.",
    "Deterministic, citable legislative blueprints for Slovak and Czech law. MCP server for LLM agents.",
  )}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-deep:    #0e1116;
      --bg-mid:     #13161c;
      --bg-soft:    #181b22;
      --copper:     #b87333;
      --copper-br:  #cd7f32;
      --bronze:     #8c6239;
      --brass:      #d4a76a;
      --brass-soft: #e6c590;
      --ink-bright: #f3ede3;
      --ink-mid:    #c9bfae;
      --ink-dim:    #8a8273;
      --glass-bg:   rgba(20,25,40,0.55);
      --glass-bd:   rgba(184,115,51,0.22);
      --glass-blur: blur(14px);
      --r-card:     14px;
      --r-badge:    999px;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-deep);
      color: var(--ink-mid);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ── Nav ──────────────────────────────────────────────────────── */
    nav {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem; height: 56px;
      background: rgba(14,17,22,0.72);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(184,115,51,0.12);
    }
    .nav-brand {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700; font-size: 1.05rem;
      color: var(--brass); text-decoration: none;
      letter-spacing: -0.01em;
    }
    .nav-brand span { color: var(--ink-dim); font-weight: 400; margin-left: 2px; }
    .nav-right { display: flex; align-items: center; gap: 1rem; }
    .nav-link {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.8rem; font-weight: 500;
      color: var(--ink-dim); text-decoration: none;
      transition: color 0.2s;
    }
    .nav-link:hover { color: var(--brass); }
    .lang-toggle { display: flex; gap: 2px; }
    .lang-btn {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.75rem; font-weight: 600;
      padding: 3px 9px; border-radius: var(--r-badge);
      text-decoration: none; transition: all 0.2s;
      color: var(--ink-dim);
    }
    .lang-btn.active {
      background: rgba(184,115,51,0.18);
      color: var(--brass);
      border: 1px solid rgba(184,115,51,0.3);
    }
    .lang-btn:not(.active):hover { color: var(--ink-mid); }

    /* ── Hero ─────────────────────────────────────────────────────── */
    .hero {
      position: relative; overflow: hidden;
      min-height: calc(100vh - 56px);
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(170deg, #0e1116 0%, #13161c 55%, #181b22 100%);
    }
    .hero-grid {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(184,115,51,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(184,115,51,0.04) 1px, transparent 1px);
      background-size: 32px 32px;
    }
    .orb {
      position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
    }
    .orb-a {
      width: 480px; height: 480px; top: -120px; right: -80px;
      background: radial-gradient(circle, rgba(184,115,51,0.18) 0%, transparent 70%);
      animation: orb-float 9s ease-in-out infinite;
    }
    .orb-b {
      width: 380px; height: 380px; bottom: -60px; left: -60px;
      background: radial-gradient(circle, rgba(140,98,57,0.14) 0%, transparent 70%);
      animation: orb-float-b 12s ease-in-out infinite;
    }
    @keyframes orb-float   { 0%,100%{transform:translateY(0) scale(1)}  50%{transform:translateY(-28px) scale(1.04)} }
    @keyframes orb-float-b { 0%,100%{transform:translateY(0) scale(1)}  50%{transform:translateY(22px)  scale(0.97)} }

    .hero-inner {
      position: relative; z-index: 1;
      max-width: 700px; padding: 4rem 2rem;
      text-align: center;
    }
    .forge-chip {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--brass); padding: 5px 14px; border-radius: var(--r-badge);
      background: rgba(184,115,51,0.10); border: 1px solid rgba(184,115,51,0.28);
      margin-bottom: 1.5rem;
    }
    .hero h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2.8rem, 7vw, 4.5rem);
      font-weight: 700; color: var(--ink-bright);
      letter-spacing: -0.03em; line-height: 1.08;
      margin-bottom: 0.6rem;
    }
    .amber-line {
      width: 56px; height: 3px; margin: 1.2rem auto;
      background: linear-gradient(90deg, var(--copper), var(--brass));
      border-radius: 2px;
    }
    .hero p {
      font-size: 1.05rem; line-height: 1.7;
      color: var(--ink-mid); max-width: 540px; margin: 0 auto 2.5rem;
    }
    .hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

    /* ── Buttons ──────────────────────────────────────────────────── */
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.875rem; font-weight: 600;
      padding: 10px 22px; border-radius: 8px;
      text-decoration: none; transition: all 0.2s;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--copper) 0%, var(--bronze) 100%);
      color: var(--ink-bright);
      box-shadow: 0 0 18px rgba(184,115,51,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, var(--copper-br) 0%, var(--copper) 100%);
      box-shadow: 0 0 28px rgba(184,115,51,0.4);
      transform: translateY(-1px);
    }
    .btn-ghost {
      background: rgba(28,32,39,0.6); color: var(--ink-mid);
      border-color: rgba(184,115,51,0.22);
      backdrop-filter: var(--glass-blur);
    }
    .btn-ghost:hover {
      border-color: rgba(184,115,51,0.5);
      color: var(--brass);
      transform: translateY(-1px);
    }

    /* ── Sections ─────────────────────────────────────────────────── */
    .section {
      padding: 5rem 2rem;
      background: linear-gradient(180deg, var(--bg-mid) 0%, var(--bg-soft) 100%);
    }
    .section-inner { max-width: 900px; margin: 0 auto; }
    .section-badge {
      display: inline-block;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--brass); padding: 4px 12px; border-radius: var(--r-badge);
      background: rgba(184,115,51,0.10); border: 1px solid rgba(184,115,51,0.22);
      margin-bottom: 1.2rem;
    }
    .section h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(1.7rem, 4vw, 2.4rem);
      font-weight: 700; color: var(--ink-bright);
      letter-spacing: -0.02em; margin-bottom: 1rem;
    }
    .section-lead {
      font-size: 1.05rem; line-height: 1.75;
      color: var(--ink-mid); max-width: 650px;
      margin-bottom: 3rem;
    }

    /* ── Feature cards ────────────────────────────────────────────── */
    .cards-grid {
      display: grid; gap: 1.25rem;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      margin-bottom: 3rem;
    }
    .feat-card {
      background: var(--glass-bg); border: 1px solid var(--glass-bd);
      backdrop-filter: var(--glass-blur);
      border-radius: var(--r-card); padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 32px rgba(184,115,51,0.14);
    }
    .feat-icon { font-size: 1.6rem; margin-bottom: 0.75rem; }
    .feat-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.95rem; font-weight: 600;
      color: var(--ink-bright); margin-bottom: 0.4rem;
    }
    .feat-desc { font-size: 0.875rem; line-height: 1.65; color: var(--ink-dim); }

    /* ── Blueprint list ───────────────────────────────────────────── */
    .bp-grid {
      display: grid; gap: 0.6rem;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
    .bp-card {
      display: flex; flex-direction: column; gap: 3px;
      background: rgba(20,25,40,0.45); border: 1px solid rgba(184,115,51,0.14);
      border-radius: 8px; padding: 0.75rem 1rem;
      transition: border-color 0.2s;
    }
    .bp-card:hover { border-color: rgba(184,115,51,0.35); }
    .bp-id {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em;
      color: var(--brass); opacity: 0.75;
    }
    .bp-label { font-size: 0.875rem; color: var(--ink-mid); }

    /* ── Code block ───────────────────────────────────────────────── */
    .code-block {
      background: rgba(14,17,22,0.8); border: 1px solid rgba(184,115,51,0.18);
      border-radius: 10px; padding: 1.25rem 1.5rem; margin: 2rem 0;
      font-family: 'Space Grotesk', monospace;
      font-size: 0.82rem; color: var(--brass-soft);
      overflow-x: auto;
      white-space: pre;
    }

    /* ── Footer ───────────────────────────────────────────────────── */
    footer {
      background: var(--bg-deep);
      border-top: 1px solid rgba(184,115,51,0.1);
      padding: 2.5rem 2rem;
      text-align: center;
    }
    .footer-inner { max-width: 900px; margin: 0 auto; }
    .footer-links {
      display: flex; justify-content: center; gap: 2rem;
      flex-wrap: wrap; margin-bottom: 1.25rem;
    }
    .footer-link {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.82rem; font-weight: 500;
      color: var(--ink-dim); text-decoration: none;
      transition: color 0.2s;
    }
    .footer-link:hover { color: var(--brass); }
    .footer-copy {
      font-size: 0.78rem; color: var(--ink-dim); opacity: 0.7;
    }

    @media (max-width: 600px) {
      .hero h1 { font-size: 2.4rem; }
      .hero-ctas { flex-direction: column; align-items: center; }
      .cards-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<!-- Nav -->
<nav>
  <a class="nav-brand" href="/?lang=${lang}">Lex<span>.Oracle</span></a>
  <div class="nav-right">
    <a class="nav-link" href="https://artificerworkshop.sk" target="_blank" rel="noopener">
      Artificer Workshop
    </a>
    <div class="lang-toggle">
      <a class="lang-btn${sk ? "" : " active"}" href="/?lang=en">EN</a>
      <a class="lang-btn${sk ? " active" : ""}" href="/?lang=sk">SK</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="hero">
  <div class="hero-grid"></div>
  <div class="orb orb-a"></div>
  <div class="orb orb-b"></div>
  <div class="hero-inner">
    <div class="forge-chip">MCP Server · SK / CZ</div>
    <h1>Lex.Oracle</h1>
    <div class="amber-line"></div>
    <p>${t(
      "Deterministické, citovateľné legislatívne blueprinty pre slovenské a české právo. Daj svojmu LLM agentovi zákon, na ktorom môže stáť.",
      "Deterministic, citable legislative blueprints for Slovak and Czech law. Give your LLM agent a law to stand on.",
    )}</p>
    <div class="hero-ctas">
      <a class="btn btn-primary" href="https://smithery.ai/servers/artificer/lex-oracle" target="_blank" rel="noopener">
        ⚡ ${t("Pridať do agenta", "Add to Agent")}
      </a>
      <a class="btn btn-ghost" href="https://github.com/Artificer-Workshop/Lex.Oracle" target="_blank" rel="noopener">
        ◇ GitHub
      </a>
    </div>
  </div>
</section>

<!-- What is it -->
<section class="section" id="${t("co-to-je", "what-is-it")}">
  <div class="section-inner">
    <span class="section-badge">${t("Čo to je", "What it is")}</span>
    <h2>${t("Žiadne halucinácie v legislatíve", "No hallucinations in regulated law")}</h2>
    <p class="section-lead">${t(
      "LLM modely majú sklon vymýšľať sadzby, ignorovať paragrafové výnimky a zaokrúhľovať nesprávne. Lex.Oracle im poskytuje overené blueprinty — krok-za-krokom logiku s citáciami priamo na konkrétne odseky zákonov.",
      "LLMs tend to fabricate rates, miss statutory exceptions, and round incorrectly. Lex.Oracle gives them verified blueprints — step-by-step logic with citations tied to exact paragraphs of the law.",
    )}</p>
    <div class="cards-grid">
      <div class="feat-card">
        <div class="feat-icon">⚖️</div>
        <div class="feat-title">${t("Citovateľné po paragrafoch", "Paragraph-level citations")}</div>
        <div class="feat-desc">${t(
          "Každý výpočtový krok je naviazaný na konkrétny odsek zákona — overiteľné, auditovateľné.",
          "Every computation step is tied to a specific paragraph of the act — verifiable, auditable.",
        )}</div>
      </div>
      <div class="feat-card">
        <div class="feat-icon">🔒</div>
        <div class="feat-title">${t("Deterministický výstup", "Deterministic output")}</div>
        <div class="feat-desc">${t(
          "Rovnaký vstup = rovnaký výsledok vždy. Sadzby a pravidlá sú kompilované do blueprintov, nie generované.",
          "Same input = same result every time. Rates and rules are compiled into blueprints, not generated.",
        )}</div>
      </div>
      <div class="feat-card">
        <div class="feat-icon">🔌</div>
        <div class="feat-title">${t("MCP natívne", "MCP native")}</div>
        <div class="feat-desc">${t(
          "Model Context Protocol — funguje v Claude Desktop, Cursor, Zed a každom MCP-kompatibilnom klientovi.",
          "Model Context Protocol — works in Claude Desktop, Cursor, Zed, and any MCP-compatible client.",
        )}</div>
      </div>
    </div>

    <div class="code-block">${t(
      `# Claude Desktop (lokálne)
{
  "mcpServers": {
    "lex-oracle": {
      "command": "npx",
      "args": ["-y", "@artificer_workshop/lex-oracle"]
    }
  }
}

# Vzdialený server (bez inštalácie)
{ "mcpServers": { "lex-oracle": { "url": "https://lex-oracle.artificerworkshop.sk/mcp" } } }`,
      `# Claude Desktop (local)
{
  "mcpServers": {
    "lex-oracle": {
      "command": "npx",
      "args": ["-y", "@artificer_workshop/lex-oracle"]
    }
  }
}

# Remote server (no install)
{ "mcpServers": { "lex-oracle": { "url": "https://lex-oracle.artificerworkshop.sk/mcp" } } }`,
    )}</div>
  </div>
</section>

<!-- Blueprints -->
<section class="section" style="background: var(--bg-deep);" id="${t("blueprinty", "blueprints")}">
  <div class="section-inner">
    <span class="section-badge">${t("Dostupné blueprinty", "Available Blueprints")}</span>
    <h2>${t("11 overených blueprintov", "11 verified blueprints")}</h2>
    <p class="section-lead">${t(
      "Každý blueprint obsahuje axiómy (sadzby + citácie), logický postup, semantické mapovanie na zákon a verifikačné prípady z oficiálnych metodík.",
      "Each blueprint contains axioms (rates + citations), logic flow, semantic mapping to statutes, and verification cases from official methodologies.",
    )}</p>
    <div class="bp-grid">${blueprintCards}</div>
  </div>
</section>

<!-- Footer -->
<footer>
  <div class="footer-inner">
    <div class="footer-links">
      <a class="footer-link" href="https://smithery.ai/servers/artificer/lex-oracle" target="_blank" rel="noopener">Smithery</a>
      <a class="footer-link" href="https://github.com/Artificer-Workshop/Lex.Oracle" target="_blank" rel="noopener">GitHub</a>
      <a class="footer-link" href="https://www.npmjs.com/package/@artificer_workshop/lex-oracle" target="_blank" rel="noopener">npm</a>
      <a class="footer-link" href="https://artificerworkshop.sk" target="_blank" rel="noopener">Artificer Workshop</a>
    </div>
    <p class="footer-copy">
      © ${new Date().getFullYear()} Artificer Workshop s. r. o. &nbsp;·&nbsp;
      Apache 2.0 &nbsp;·&nbsp;
      ${t("Postavené na Slovensku", "Built in Slovakia")}
    </p>
  </div>
</footer>

</body>
</html>`;
}
