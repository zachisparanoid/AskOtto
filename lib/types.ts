/**
 * Shared TypeScript interfaces for AskOtto.
 *
 * These types are the contract between the search layer (Serper), the synthesis
 * layer (Claude Agent SDK), the cache layer (Prisma/SQLite), the API route, and
 * the React UI. Keep them in sync with:
 *   - SYNTHESIS_SCHEMA + the zod validators in lib/synthesize.ts
 *   - the Prisma model in prisma/schema.prisma (stored as serialized JSON)
 */

/** The user's vehicle + plain-language problem description. */
export interface VehicleQuery {
  /** 4-digit year, e.g. "2006". */
  year: string;
  /** Make, e.g. "GMC". */
  make: string;
  /** Model (and optional trim), e.g. "Sierra 1500". */
  model: string;
  /** Plain-language problem, e.g. "mass airflow sensor not working, rough idle when cold". */
  issue: string;
}

/** A single forum thread surfaced by search. */
export interface ThreadResult {
  title: string;
  url: string;
  snippet: string;
  /** Bare domain, e.g. "gm-trucks.com". */
  source: string;
  /** ISO-ish date string parsed from the snippet/result if available, else null. */
  date: string | null;
  /** Human-readable forum name, e.g. "GM-Trucks". */
  forumName: string;
}

export type Frequency = "very common" | "common" | "occasional" | "rare";
export type DifficultyRating = 1 | 2 | 3 | 4 | 5;

export interface RootCause {
  title: string;
  description: string;
  frequency: Frequency;
}

export interface RepairStep {
  /** 1-based, sequential. Re-numbered server-side so it is always contiguous. */
  step: number;
  action: string;
  detail: string;
  tip?: string;
}

/** A "hidden gem" — an older/obscure post that contains a non-obvious root-cause fix. */
export interface NotableFinding {
  /** Short verbatim excerpt from the thread. */
  quote: string;
  /** Resolved back to a real fetched thread (citation integrity — never fabricated). */
  source: ThreadResult;
  /** Why this finding is notable / why most mechanics overlook it. */
  why: string;
}

/** The structured repair guide synthesized by Claude. */
export interface SynthesisResult {
  /** 2-3 sentence TL;DR. */
  summary: string;
  rootCauses: RootCause[];
  repairSteps: RepairStep[];
  partsToInspect: string[];
  /** e.g. "$40–$120 DIY". */
  estimatedCost: string;
  difficultyRating: DifficultyRating;
  notableFinds: NotableFinding[];
  disclaimer: string;
  /**
   * Model's self-assessed confidence, lowered when source coverage is thin
   * (e.g. < 5 threads or a very old/obscure vehicle). Surfaced in the UI.
   */
  confidence: "high" | "medium" | "low";
}

/** Successful POST /api/search response. */
export interface SearchSuccessResponse {
  threads: ThreadResult[];
  /** null when synthesis degraded (Claude unavailable / failed) — UI shows raw threads. */
  synthesis: SynthesisResult | null;
  /** true when served from cache (fresh or stale). */
  cached: boolean;
  /** true when the cached entry was expired and is being revalidated in the background. */
  stale: boolean;
  /** true when sample/demo fixtures were used because SERPER_API_KEY is not configured. */
  demo: boolean;
  /** Convenience flag for the UI banner: false ⇒ show "AI synthesis unavailable". */
  synthesisAvailable: boolean;
  vehicle: VehicleQuery;
  /** Number of unique forum threads found. */
  sourceCount: number;
  /** ISO timestamp the payload was produced/served. */
  generatedAt: string;
}

/** Error POST /api/search response — `partial` lets the UI still render raw threads. */
export interface SearchErrorResponse {
  error: string;
  partial: ThreadResult[] | null;
}

export type SearchResponse = SearchSuccessResponse | SearchErrorResponse;

/** Narrowing helper used by the client. */
export function isSearchError(r: SearchResponse): r is SearchErrorResponse {
  return (r as SearchErrorResponse).error !== undefined;
}
