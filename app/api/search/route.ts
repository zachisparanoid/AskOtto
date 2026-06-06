import { NextResponse } from "next/server";
import type { SearchSuccessResponse, ThreadResult, SynthesisResult, VehicleQuery } from "@/lib/types";
import { validateVehicleQuery } from "@/lib/sanitize";
import { runSearch, SerperRateLimitError, SerperError } from "@/lib/search";
import { synthesize } from "@/lib/synthesize";
import { cacheKey, readCache, writeCache } from "@/lib/cache";

// The Claude Agent SDK spawns a subprocess and reads the filesystem — it needs
// the Node.js runtime (NOT Edge) and must never be statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function success(
  body: Omit<SearchSuccessResponse, "generatedAt">,
  cacheHeader: "hit" | "stale" | "miss",
): NextResponse {
  const payload: SearchSuccessResponse = { ...body, generatedAt: new Date().toISOString() };
  return NextResponse.json(payload, { headers: { "X-GrillSearch-Cache": cacheHeader } });
}

/** Background revalidation for stale cache entries (fire-and-forget, never throws). */
async function revalidate(query: VehicleQuery, key: string): Promise<void> {
  try {
    const outcome = await runSearch(query);
    if (outcome.threads.length === 0) return;
    const synthesis = await synthesize(query, outcome.threads);
    await writeCache(query, key, outcome.threads, synthesis);
  } catch (err) {
    console.warn("[revalidate] background refresh failed:", (err as Error)?.message ?? err);
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  // ── Parse + validate ──────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", partial: null }, { status: 400 });
  }

  const { valid, errors, value } = validateVehicleQuery(body);
  if (!valid || !value) {
    return NextResponse.json(
      { error: "Validation failed.", fields: errors, partial: null },
      { status: 400 },
    );
  }
  const query = value;
  const key = cacheKey(query);

  // ── Cache ─────────────────────────────────────────────────────────────────
  const cached = await readCache(key);
  if (cached && !cached.stale) {
    return success(
      {
        threads: cached.threads,
        synthesis: cached.synthesis,
        cached: true,
        stale: false,
        demo: false,
        synthesisAvailable: cached.synthesis !== null,
        vehicle: query,
        sourceCount: cached.threads.length,
      },
      "hit",
    );
  }
  if (cached && cached.stale) {
    // Serve stale immediately; refresh in the background (long-running host).
    void revalidate(query, key);
    return success(
      {
        threads: cached.threads,
        synthesis: cached.synthesis,
        cached: true,
        stale: true,
        demo: false,
        synthesisAvailable: cached.synthesis !== null,
        vehicle: query,
        sourceCount: cached.threads.length,
      },
      "stale",
    );
  }

  // ── Live fetch ──────────────────────────────────────────────────────────────
  let threads: ThreadResult[];
  let demo = false;
  try {
    const outcome = await runSearch(query);
    threads = outcome.threads;
    demo = outcome.demo;
  } catch (err) {
    if (err instanceof SerperRateLimitError) {
      return NextResponse.json(
        { error: "Search is rate-limited right now. Please try again in a minute.", partial: null },
        { status: 503 },
      );
    }
    if (err instanceof SerperError) {
      return NextResponse.json(
        { error: "Forum search is temporarily unavailable. Please try again.", partial: null },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Unexpected error while searching forums.", partial: null },
      { status: 500 },
    );
  }

  // Zero results (Edge Case #1) — return a clean empty state, not an error.
  if (threads.length === 0) {
    return success(
      {
        threads: [],
        synthesis: null,
        cached: false,
        stale: false,
        demo,
        synthesisAvailable: false,
        vehicle: query,
        sourceCount: 0,
      },
      "miss",
    );
  }

  // ── Synthesis (degrades to null on any failure → raw threads shown) ─────────
  let synthesis: SynthesisResult | null = null;
  try {
    synthesis = await synthesize(query, threads);
  } catch (err) {
    console.warn("[search] synthesis threw (degrading):", (err as Error)?.message ?? err);
    synthesis = null;
  }

  // Persist for the 24h cache (never throws).
  await writeCache(query, key, threads, synthesis);

  return success(
    {
      threads,
      synthesis,
      cached: false,
      stale: false,
      demo,
      synthesisAvailable: synthesis !== null,
      vehicle: query,
      sourceCount: threads.length,
    },
    "miss",
  );
}
