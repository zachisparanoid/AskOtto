import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import type { SynthesisResult, ThreadResult, VehicleQuery } from "@/lib/types";

/** Cache freshness window. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** SHA-256 of the normalized query — stable across whitespace/case. */
export function cacheKey(q: VehicleQuery): string {
  const normalized = `${q.year}|${q.make}|${q.model}|${q.issue}`.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

export interface CacheEntry {
  threads: ThreadResult[];
  synthesis: SynthesisResult | null;
  /** true when the entry is past expiresAt (serve stale + revalidate). */
  stale: boolean;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Read a cached entry by key. Returns expired entries too (with `stale: true`)
 * so the caller can serve stale-while-revalidate. Returns null on miss, parse
 * failure, or DB error — the route then proceeds with a live fetch (Edge #6).
 */
export async function readCache(key: string): Promise<CacheEntry | null> {
  try {
    const row = await prisma.searchCache.findUnique({ where: { cacheKey: key } });
    if (!row) return null;

    const threads = JSON.parse(row.rawResults) as ThreadResult[];
    const synthesis = row.synthesis ? (JSON.parse(row.synthesis) as SynthesisResult) : null;
    if (!Array.isArray(threads)) return null;

    return {
      threads,
      synthesis,
      stale: row.expiresAt.getTime() < Date.now(),
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    };
  } catch (err) {
    console.warn("[cache] read failed (continuing live):", (err as Error)?.message ?? err);
    return null;
  }
}

/**
 * Write (upsert) a cache entry. Never throws — a cache failure must not break a
 * successful search (Edge Case #6). Synthesis may be null (degraded run).
 */
export async function writeCache(
  q: VehicleQuery,
  key: string,
  threads: ThreadResult[],
  synthesis: SynthesisResult | null,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
  const data = {
    year: q.year,
    make: q.make,
    model: q.model,
    issue: q.issue,
    rawResults: JSON.stringify(threads),
    synthesis: synthesis ? JSON.stringify(synthesis) : null,
    createdAt: now,
    expiresAt,
  };

  try {
    await prisma.searchCache.upsert({
      where: { cacheKey: key },
      create: { cacheKey: key, ...data },
      update: data,
    });
  } catch (err) {
    console.warn("[cache] write failed (ignored):", (err as Error)?.message ?? err);
  }
}
