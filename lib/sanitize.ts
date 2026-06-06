import type { VehicleQuery } from "@/lib/types";

/** Issue text is truncated to this length before going to Serper (Edge Case #10). */
export const MAX_ISSUE_SERPER = 500;
/** Full issue text is capped to this before going to Claude, to bound prompt size. */
export const MAX_ISSUE_PROMPT = 2000;
/** Minimum issue length accepted by the API (the form enforces a stricter UX bound). */
export const MIN_ISSUE_LENGTH = 10;

/**
 * Sanitize a token for insertion into a Google/Serper query string. Strips
 * everything except letters, numbers, spaces and hyphens, then collapses
 * whitespace. This neutralizes `site:`/operator injection and quote-breaking
 * from user input (Edge Case #9).
 */
export function sanitizeQueryToken(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "it", "its", "to", "of", "in", "on", "at", "for",
  "and", "or", "but", "with", "when", "while", "my", "i", "im", "ive", "has",
  "have", "had", "do", "does", "did", "not", "no", "this", "that", "there",
  "car", "truck", "vehicle", "auto", "problem", "issue", "issues", "help",
  "please", "anyone", "getting", "keeps", "really", "very", "just", "been",
  "from", "out", "up", "down", "after", "before", "about", "like", "some",
]);

/**
 * Extract 1–3 high-signal keywords from the plain-language issue for the
 * "generic" search variant (e.g. "rough idle when cold, MAF P0101" → "idle maf p0101").
 * Keeps trouble codes (P0xxx) and the longest remaining content words.
 */
export function extractKeyNouns(issue: string, max = 3): string {
  const tokens = sanitizeQueryToken(issue)
    .toLowerCase()
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

  // Always surface OBD-II trouble codes (p0101, c1234, etc.) — highest signal.
  const codes = tokens.filter((t) => /^[pbcu]\d{3,4}$/.test(t));
  const words = tokens
    .filter((t) => !codes.includes(t))
    .sort((a, b) => b.length - a.length);

  const picked = [...codes, ...words].slice(0, max);
  // Preserve original order for readability.
  const order = tokens.filter((t) => picked.includes(t));
  return Array.from(new Set(order)).join(" ") || sanitizeQueryToken(issue).slice(0, 60);
}

export function clamp(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof VehicleQuery, string>>;
  value?: VehicleQuery;
}

/**
 * Validate and normalize a raw request body into a VehicleQuery.
 * Mirrors the API contract: year 4 digits in [1900, 2030], make/model non-empty,
 * issue ≥ MIN_ISSUE_LENGTH chars after trimming.
 */
export function validateVehicleQuery(body: unknown): ValidationResult {
  const errors: Partial<Record<keyof VehicleQuery, string>> = {};
  const b = (body ?? {}) as Record<string, unknown>;

  const year = String(b.year ?? "").trim();
  const make = String(b.make ?? "").trim();
  const model = String(b.model ?? "").trim();
  const issue = String(b.issue ?? "").trim();

  if (!/^\d{4}$/.test(year)) {
    errors.year = "Year must be 4 digits.";
  } else {
    const n = Number(year);
    if (n < 1900 || n > 2030) errors.year = "Year must be between 1900 and 2030.";
  }
  if (!make) errors.make = "Make is required.";
  if (!model) errors.model = "Model is required.";
  if (issue.length < MIN_ISSUE_LENGTH) {
    errors.issue = `Please describe the issue in more detail (at least ${MIN_ISSUE_LENGTH} characters).`;
  }

  const valid = Object.keys(errors).length === 0;
  return valid ? { valid, errors, value: { year, make, model, issue } } : { valid, errors };
}
