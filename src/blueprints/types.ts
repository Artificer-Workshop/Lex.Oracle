/**
 * Blueprint type definitions for Lex.Oracle.
 *
 * A "blueprint" is a deterministic, language-agnostic decomposition of a
 * legislative algorithm into five sections:
 *
 *   1. axiomatic_core      — immutable constants, koeficienty, execution order
 *   2. logic_flow          — pseudocode + edge cases
 *   3. semantic_mapping    — each step mapped to a legal citation
 *   4. tool_definition     — JSON schema for MCP tool input/output/audit
 *   5. verification_cases  — 3+ test cases sourced from official methodologies
 *
 * Blueprints are read-only at runtime and are the Source of Truth for any
 * downstream LLM that wants to implement the underlying algorithm.
 */

export type Jurisdiction = "SK" | "CZ";

export type BlueprintStatus = "PLACEHOLDER" | "DRAFT" | "READY" | "DEPRECATED";

export interface LegalCitation {
  /** Identifier of the legal act, e.g. "268/2006 Z.z." or "233/1995 Z.z." */
  act: string;
  /** Paragraph identifier, e.g. "§1", "§71" */
  paragraph: string;
  /** Optional sub-paragraph (odsek) */
  odsek?: number;
  /** Optional point (písmeno) */
  pismeno?: string;
  /** Effective period [from, to?] in YYYY-MM-DD; `to` omitted = still in force */
  effective_from: string;
  effective_to?: string;
  /** Canonical URL to the act / paragraph */
  url?: string;
  /** Verbatim quote of the legal text being cited */
  quote: string;
}

export interface AxiomaticConstant {
  name: string;
  /** Formal definition expressed in plain mathematical notation */
  definition: string;
  /** Numeric value or formula. Use string to preserve exact rationals. */
  value: string;
  /** Citation that anchors the constant in law. */
  citation: LegalCitation;
  /** Effective periods if the constant changes over time. */
  effective_periods?: Array<{
    from: string;
    to?: string;
    value: string;
    note?: string;
  }>;
}

export interface LogicStep {
  /** Stable identifier within the blueprint, e.g. "S1", "S2.a" */
  id: string;
  /** One-line summary of the step. */
  description: string;
  /** Pseudocode (no language-specific syntax). */
  pseudocode: string;
  /** Citation that anchors this step in law. */
  citation: LegalCitation;
  /** Edge cases handled by this step. */
  edge_cases?: Array<{
    condition: string;
    behaviour: string;
    citation?: LegalCitation;
  }>;
}

export interface ToolParameter {
  name: string;
  type: "number" | "integer" | "string" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  /** Optional unit (e.g. "EUR", "EUR/month", "count") */
  unit?: string;
  /** Optional enum of allowed values */
  enum?: ReadonlyArray<string>;
  /** Optional citation explaining the parameter */
  citation?: LegalCitation;
}

export interface ToolDefinition {
  /** MCP tool name (kebab-case). */
  name: string;
  /** Human-readable description (Slovak). */
  description: string;
  input_parameters: ReadonlyArray<ToolParameter>;
  /** Ordered description of how the calculation proceeds. */
  calculation_steps: ReadonlyArray<string>;
  /** Template for human-readable audit reasoning. Placeholders use {name}. */
  audit_trail_template: string;
}

export interface VerificationCase {
  id: string;
  /** Where the case was sourced (methodology, ruling, vendor table). */
  source: string;
  /** Inputs as a deterministic, fully populated object. */
  input: Record<string, unknown>;
  /** Expected output as a deterministic object. */
  expected_output: Record<string, unknown>;
  /** Step-by-step legal reasoning. */
  legal_reasoning: string;
}

export interface Blueprint {
  /** Stable identifier, kebab-case, e.g. "sk-garnishment-thirds" */
  id: string;
  /** Short human-readable title. */
  title: string;
  /** Semver string. Bump on any normative change. */
  version: string;
  jurisdiction: Jurisdiction;
  status: BlueprintStatus;
  /** Date (YYYY-MM-DD) the blueprint content was last reviewed. */
  last_reviewed: string;
  /** Brief one-paragraph summary. */
  summary: string;
  /** Acts that the blueprint covers. */
  legal_acts: ReadonlyArray<{
    act: string;
    title: string;
    url?: string;
  }>;
  /** Where the law is ambiguous, this records the chosen interpretation. */
  interpretation_notes?: ReadonlyArray<{
    issue: string;
    chosen_interpretation: string;
    rationale: string;
  }>;
  axiomatic_core: ReadonlyArray<AxiomaticConstant>;
  /** Defined order of operations. */
  execution_order: ReadonlyArray<string>;
  logic_flow: ReadonlyArray<LogicStep>;
  semantic_mapping: ReadonlyArray<{
    step_id: string;
    citation: LegalCitation;
  }>;
  tool: ToolDefinition;
  verification_cases: ReadonlyArray<VerificationCase>;
}
