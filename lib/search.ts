import type { ThreadResult, VehicleQuery } from "@/lib/types";
import { selectForums, forumNameForUrl, type Forum } from "@/lib/forums";
import {
  sanitizeQueryToken,
  extractKeyNouns,
  clamp,
  MAX_ISSUE_SERPER,
} from "@/lib/sanitize";

const SERPER_ENDPOINT = "https://google.serper.dev/search";
const PER_QUERY_RESULTS = 10;
const MAX_THREADS = 20;
const FETCH_TIMEOUT_MS = 9000;

/** Thrown when Serper returns 429 across the board (Edge Case #7). */
export class SerperRateLimitError extends Error {
  constructor() {
    super("Serper rate limit exceeded");
    this.name = "SerperRateLimitError";
  }
}

/** Thrown when every Serper request fails for a non-rate-limit reason. */
export class SerperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SerperError";
  }
}

export interface SearchOutcome {
  threads: ThreadResult[];
  /** true when sample fixtures were used (no SERPER_API_KEY configured). */
  demo: boolean;
  stats: { run: number; succeeded: number; failed: number };
}

interface SerperOrganic {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
}

/** Build the `(site:a OR site:b ...)` filter from selected forums. */
function siteFilter(forums: Forum[]): string {
  return `(${forums.map((f) => `site:${f.domain}`).join(" OR ")})`;
}

/**
 * Construct the 3 complementary Serper queries:
 *  1. Exact: quoted vehicle + symptom keywords
 *  2. Year-range: looser vehicle + symptom + [year-2 .. year+3]
 *  3. Generic: vehicle (trim dropped) + primary symptom + "fix repair solution"
 */
function buildQueries(query: VehicleQuery, forums: Forum[]): string[] {
  const year = parseInt(query.year, 10);
  const make = sanitizeQueryToken(query.make);
  const model = sanitizeQueryToken(query.model);
  const modelBase = model.split(" ")[0] ?? model; // drop trim, e.g. "Sierra 1500" -> "Sierra"
  const issue = clamp(query.issue, MAX_ISSUE_SERPER);
  const keyNouns = extractKeyNouns(issue);
  const primaryNoun = keyNouns.split(" ")[0] ?? keyNouns;
  const sf = siteFilter(forums);

  const exact = `"${year} ${make} ${model}" ${keyNouns} ${sf}`;
  const yearLo = Number.isFinite(year) ? year - 2 : "";
  const yearHi = Number.isFinite(year) ? year + 3 : "";
  const yearRange = `"${make} ${model}" ${keyNouns} ${yearLo}..${yearHi} ${sf}`;
  const generic = `"${make} ${modelBase}" ${primaryNoun} fix repair solution ${sf}`;

  return [exact, yearRange, generic].map((q) => q.replace(/\s+/g, " ").trim());
}

/** Month-name and numeric date patterns parsed from result snippets (per spec). */
const MONTH_RE =
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i;
const NUMERIC_RE = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/;

function parseDate(...sources: (string | undefined)[]): string | null {
  for (const s of sources) {
    if (!s) continue;
    // Serper often supplies an absolute date directly.
    const m = s.match(MONTH_RE) ?? s.match(NUMERIC_RE);
    if (m) return m[0];
    // Accept a bare "Mon DD, YYYY" / "MM/DD/YYYY" already-clean date field.
    if (MONTH_RE.test(s) || NUMERIC_RE.test(s)) return s;
  }
  return null;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/** One Serper call. Returns organic results; signals 429 / failure to the caller. */
async function fetchSerper(
  q: string,
  apiKey: string,
): Promise<{ ok: true; organic: SerperOrganic[] } | { ok: false; rateLimited: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(SERPER_ENDPOINT, {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q, num: PER_QUERY_RESULTS, gl: "us", hl: "en" }),
      signal: controller.signal,
    });
    if (res.status === 429) return { ok: false, rateLimited: true };
    if (!res.ok) return { ok: false, rateLimited: false };
    const data = (await res.json()) as { organic?: SerperOrganic[] };
    return { ok: true, organic: data.organic ?? [] };
  } catch {
    return { ok: false, rateLimited: false };
  } finally {
    clearTimeout(timeout);
  }
}

function toThread(item: SerperOrganic): ThreadResult | null {
  if (!item.link || !item.title) return null;
  const { source, forumName } = forumNameForUrl(item.link);
  return {
    title: item.title,
    url: item.link,
    snippet: item.snippet ?? "",
    source,
    forumName,
    date: parseDate(item.date, item.snippet, item.title),
  };
}

/**
 * Run the forum search for a vehicle query.
 * - No SERPER_API_KEY → labeled demo fixtures (keeps the full pipeline runnable).
 * - 3 parallel queries; partial failures are tolerated (Edge Case #3).
 * - All-429 → SerperRateLimitError; all-failed → SerperError.
 */
export async function runSearch(query: VehicleQuery): Promise<SearchOutcome> {
  const apiKey = process.env.SERPER_API_KEY;
  const forums = selectForums(query);

  if (!apiKey) {
    return { threads: demoThreads(query, forums), demo: true, stats: { run: 0, succeeded: 0, failed: 0 } };
  }

  const queries = buildQueries(query, forums);
  const results = await Promise.all(queries.map((q) => fetchSerper(q, apiKey)));

  let succeeded = 0;
  let failed = 0;
  let rateLimited = false;
  const collected: SerperOrganic[] = [];
  for (const r of results) {
    if (r.ok) {
      succeeded++;
      collected.push(...r.organic);
    } else {
      failed++;
      if (r.rateLimited) rateLimited = true;
    }
  }

  if (succeeded === 0) {
    if (rateLimited) throw new SerperRateLimitError();
    throw new SerperError("All forum search requests failed.");
  }

  // Map → dedupe by normalized URL → cap at MAX_THREADS.
  const seen = new Set<string>();
  const threads: ThreadResult[] = [];
  for (const item of collected) {
    const thread = toThread(item);
    if (!thread) continue;
    const key = normalizeUrl(thread.url);
    if (seen.has(key)) continue;
    seen.add(key);
    threads.push(thread);
    if (threads.length >= MAX_THREADS) break;
  }

  return { threads, demo: false, stats: { run: queries.length, succeeded, failed } };
}

/**
 * Synthetic-but-realistic sample threads used when SERPER_API_KEY is absent.
 * Deliberately includes an older "hidden gem" root-cause post so the synthesis
 * `notableFinds` path is exercised. Clearly flagged via the `demo` response field.
 */
function demoThreads(query: VehicleQuery, forums: Forum[]): ThreadResult[] {
  const v = `${query.year} ${query.make} ${query.model}`.trim();
  const issueShort = extractKeyNouns(query.issue) || query.issue.slice(0, 40);
  const pick = (i: number): Forum => forums[i % forums.length];
  const year = parseInt(query.year, 10) || 2010;

  const seed: Array<Partial<ThreadResult> & { forum: Forum; date: string | null }> = [
    {
      forum: pick(0),
      title: `${v} — ${issueShort}, finally found the fix`,
      snippet: `After months of chasing this, the culprit turned out to be a corroded connector. Cleaned the pins, applied dielectric grease, problem gone. Full write-up with photos inside.`,
      date: `Apr 14, ${year + 3}`,
    },
    {
      forum: pick(1),
      title: `Common cause of ${issueShort} on the ${query.make} ${query.model}`,
      snippet: `This comes up a lot. Start with the cheap stuff: check the sensor, then the wiring, then the ground. Most people replace the part when it's actually a wiring fault.`,
      date: `Sep 2, ${year + 1}`,
    },
    {
      forum: pick(2),
      title: `${issueShort} — TSB exists for this`,
      snippet: `There's a technical service bulletin covering exactly this symptom. Dealer fixed mine under the bulletin. Reference number and procedure posted below.`,
      date: `Jan 19, ${year + 2}`,
    },
    {
      // The "hidden gem": an old post with the real root cause.
      forum: pick(3),
      title: `[ARCHIVE] ${query.make} ${query.model} ${issueShort} — it's the harness, not the sensor`,
      snippet: `Old thread but this saved me. The wiring harness chafes against the bracket over years and eventually shorts. Everyone replaces sensors for years before finding the bend in the harness. Wrap it and re-route.`,
      date: `Jun 7, ${year - 8 > 1990 ? year - 8 : 1998}`,
    },
    {
      forum: pick(4),
      title: `${v}: parts I replaced for ${issueShort} (and what actually worked)`,
      snippet: `Replaced three parts before the real fix. Save your money — inspect the connector and ground strap first. Total real cost was under $40 in the end.`,
      date: `Nov 30, ${year}`,
    },
    {
      forum: pick(5),
      title: `Step-by-step: diagnosing ${issueShort} on ${query.make}`,
      snippet: `Grab a multimeter. Back-probe the connector, key on engine off. Spec is in the FSM. If voltage is out of range, work backward along the circuit.`,
      date: `Mar 12, ${year + 4}`,
    },
    {
      forum: pick(6),
      title: `${v} ${issueShort} after cold start only?`,
      snippet: `Mine only did it when cold. Ended up being a cracked intake boot that sealed once warm. Smoke test found it in 5 minutes.`,
      date: `Feb 5, ${year + 2}`,
    },
  ];

  return seed.map((s) => ({
    title: s.title!,
    url: `https://${s.forum.domain.replace("/r/", "/r/")}/threads/${encodeURIComponent(
      issueShort.replace(/\s+/g, "-"),
    )}-${Math.abs(hash(s.title!)) % 90000 + 10000}`,
    snippet: s.snippet!,
    source: s.forum.domain,
    forumName: s.forum.name,
    date: s.date,
  }));
}

/** Tiny deterministic string hash (for stable demo thread URLs). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
