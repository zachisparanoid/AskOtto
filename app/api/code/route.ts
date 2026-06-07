import type { CodeLookupResult } from "@/lib/types";
import { isValidCode, normalizeCode } from "@/lib/codes";
import { lookupCode } from "@/lib/codelookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

// Tiny in-memory cache — code definitions are stable, so repeat lookups are
// instant within the process lifetime. Capped to avoid unbounded growth.
const CACHE = new Map<string, CodeLookupResult>();
const CACHE_MAX = 300;

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const rawCode = String(b.code ?? "");
  const make = String(b.make ?? "").trim().slice(0, 40);

  if (!isValidCode(rawCode)) {
    return Response.json(
      { error: "Enter a valid OBD-II code, e.g. P0420, P0301, or U0100." },
      { status: 400 },
    );
  }

  const code = normalizeCode(rawCode);
  const key = `${code}|${make.toLowerCase()}`;

  const hit = CACHE.get(key);
  if (hit) return Response.json({ result: hit, cached: true });

  const result = await lookupCode(code, make);
  if (!result) {
    return Response.json(
      { error: "Couldn't decode that code right now. Please try again in a moment." },
      { status: 502 },
    );
  }

  if (CACHE.size >= CACHE_MAX) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
  CACHE.set(key, result);

  return Response.json({ result, cached: false });
}
