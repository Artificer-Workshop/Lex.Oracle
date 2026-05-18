import type { Blueprint } from "./blueprints/types.js";

const FLAG: Record<string, string> = { SK: "🇸🇰", CZ: "🇨🇿" };

export function formatBlueprint(bp: Blueprint): string {
  const flag = FLAG[bp.jurisdiction] ?? bp.jurisdiction;
  const lines: string[] = [];

  // ── Header ──────────────────────────────────────────────────────────────
  lines.push(`## ${bp.title}`);
  lines.push(
    `**Jurisdikcia:** ${flag} ${bp.jurisdiction} · ` +
    `**Status:** ${bp.status} · ` +
    `**Verzia:** ${bp.version} · ` +
    `**Aktualizované:** ${bp.last_reviewed}`,
  );
  lines.push("");
  lines.push(`> ${bp.summary}`);
  lines.push("");

  // ── Legal acts ───────────────────────────────────────────────────────────
  lines.push("### Pokrytá legislatíva");
  for (const act of bp.legal_acts) {
    const link = act.url ? `[${act.act}](${act.url})` : act.act;
    lines.push(`- **${link}** — ${act.title}`);
  }
  lines.push("");

  // ── Algorithm steps ──────────────────────────────────────────────────────
  lines.push("### Postup výpočtu");
  bp.execution_order.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  lines.push("");

  // Logic flow detail (pseudokód pre každý krok)
  if (bp.logic_flow.length > 0) {
    lines.push("### Pseudokód krokov");
    for (const step of bp.logic_flow) {
      lines.push(`**${step.id} — ${step.description}**`);
      lines.push("```");
      lines.push(step.pseudocode);
      lines.push("```");
      lines.push(`*${step.citation.act} ${step.citation.paragraph}` +
        (step.citation.odsek ? ` ods. ${step.citation.odsek}` : "") + "*");
      if (step.edge_cases && step.edge_cases.length > 0) {
        lines.push("Edge cases:");
        for (const ec of step.edge_cases) {
          lines.push(`- **${ec.condition}** → ${ec.behaviour}`);
        }
      }
      lines.push("");
    }
  }

  // ── Axiomatic constants ──────────────────────────────────────────────────
  if (bp.axiomatic_core.length > 0) {
    lines.push("### Kľúčové konštanty");
    lines.push("| Konštanta | Hodnota | Právny základ |");
    lines.push("|---|---|---|");
    for (const c of bp.axiomatic_core) {
      const citation = `${c.citation.act} ${c.citation.paragraph}`;
      lines.push(`| **${c.name}** | ${c.value} | ${citation} |`);
      if (c.effective_periods && c.effective_periods.length > 0) {
        for (const p of c.effective_periods) {
          const range = p.to ? `${p.from} – ${p.to}` : `od ${p.from}`;
          lines.push(`| *(${range})* | ${p.value} | |`);
        }
      }
    }
    lines.push("");
  }

  // ── Interpretation notes ─────────────────────────────────────────────────
  if (bp.interpretation_notes && bp.interpretation_notes.length > 0) {
    lines.push("### Interpretačné poznámky");
    for (const note of bp.interpretation_notes) {
      lines.push(`**Problém:** ${note.issue}`);
      lines.push(`**Zvolená interpretácia:** ${note.chosen_interpretation}`);
      lines.push(`**Odôvodnenie:** ${note.rationale}`);
      lines.push("");
    }
  }

  // ── Verification cases ───────────────────────────────────────────────────
  if (bp.verification_cases.length > 0) {
    lines.push("### Overovacie prípady");
    for (const vc of bp.verification_cases) {
      lines.push(`**${vc.id}** *(${vc.source})*`);
      lines.push(vc.legal_reasoning);
      lines.push("");
    }
  }

  // ── CTA ──────────────────────────────────────────────────────────────────
  lines.push("---");
  lines.push(
    "> **Produkčné použitie:** Pre výpočty s plným právnym audit trailom, " +
    "rational arithmetic a Z3-verifikovanou korektnosťou použite " +
    "**[Aether.Logic API](https://artificerworkshop.sk)** " +
    "— Artificer Workshop s. r. o.",
  );

  return lines.join("\n");
}

export function formatBlueprintList(
  blueprints: ReadonlyArray<{ id: string; title: string; jurisdiction: string; status: string; version: string; summary: string }>,
): string {
  const lines: string[] = [];
  lines.push("## Dostupné blueprinty — Lex.Oracle");
  lines.push("");
  lines.push("| ID | Jurisdikcia | Názov | Status | Verzia |");
  lines.push("|---|---|---|---|---|");
  for (const bp of blueprints) {
    const flag = FLAG[bp.jurisdiction] ?? bp.jurisdiction;
    lines.push(`| \`${bp.id}\` | ${flag} ${bp.jurisdiction} | ${bp.title} | **${bp.status}** | ${bp.version} |`);
  }
  lines.push("");
  lines.push("Pre detailný blueprint zavolaj `get_blueprint` s príslušným ID.");
  return lines.join("\n");
}

export function formatVerificationCases(
  blueprintId: string,
  version: string,
  cases: Blueprint["verification_cases"],
): string {
  const lines: string[] = [];
  lines.push(`## Overovacie prípady — \`${blueprintId}\` (v${version})`);
  lines.push("");
  for (const vc of cases) {
    lines.push(`### ${vc.id}`);
    lines.push(`**Zdroj:** ${vc.source}`);
    lines.push("");
    lines.push("**Vstup:**");
    lines.push("```json");
    lines.push(JSON.stringify(vc.input, null, 2));
    lines.push("```");
    lines.push("**Očakávaný výstup:**");
    lines.push("```json");
    lines.push(JSON.stringify(vc.expected_output, null, 2));
    lines.push("```");
    lines.push(`**Právne odôvodnenie:** ${vc.legal_reasoning}`);
    lines.push("");
  }
  return lines.join("\n");
}
