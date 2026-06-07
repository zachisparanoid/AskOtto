/**
 * Pure OBD-II trouble-code helpers — NO SDK / zod imports, so this module is
 * safe to import from client components (the CodeLookup widget) as well as the
 * server route.
 */

/**
 * OBD-II DTC shape: a system letter (P/B/C/U), a second char 0–3
 * (0/2 = generic SAE, 1/3 = manufacturer-specific), then three hex digits.
 * e.g. P0420, P0011, U0100, C1234.
 */
export const CODE_REGEX = /^[PBCU][0-3][0-9A-F]{3}$/;

/** Uppercase, strip spaces/dashes — "p0420" / "P-0420" → "P0420". */
export function normalizeCode(raw: string): string {
  return (raw ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isValidCode(raw: string): boolean {
  return CODE_REGEX.test(normalizeCode(raw));
}
