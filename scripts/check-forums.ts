/**
 * Advisory forum health check (`npm run forums:check`).
 *
 * Sends an HTTP HEAD (falling back to GET) to each curated forum domain and
 * reports dead (404/410), off-domain-redirecting (likely rebranded), or
 * unreachable hosts so the list in lib/forums.ts can be pruned/corrected.
 *
 * This is a heuristic, not a gate: search runs through Google's index, so a
 * temporarily-down forum is fine — but a dead/rebranded domain pollutes the
 * `site:` filter. Many forums block bots or HEAD requests, so treat
 * UNREACHABLE/403 as "investigate", not "definitely dead".
 */
import { FORUMS } from "../lib/forums";

const TIMEOUT_MS = 12_000;
const CONCURRENCY = 8;

type Verdict = "OK" | "REDIRECT_OFFSITE" | "DEAD" | "UNREACHABLE";

interface Report {
  domain: string;
  host: string;
  verdict: Verdict;
  detail: string;
}

function hostOf(domain: string): string {
  return domain.split("/")[0].toLowerCase();
}

async function probe(method: "HEAD" | "GET", url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "AskOtto-forum-check/1.0 (+health probe)" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkForum(domain: string): Promise<Report> {
  const host = hostOf(domain);
  const url = `https://${host}/`;
  try {
    let res: Response;
    try {
      res = await probe("HEAD", url);
      if (res.status === 405 || res.status === 501) res = await probe("GET", url);
    } catch {
      res = await probe("GET", url);
    }

    const status = res.status;
    if (status >= 300 && status < 400) {
      const loc = res.headers.get("location") ?? "";
      let locHost = "";
      try {
        locHost = new URL(loc, url).hostname.replace(/^www\./, "");
      } catch {
        /* ignore */
      }
      const bare = host.replace(/^www\./, "");
      if (locHost && locHost !== bare && !locHost.endsWith(`.${bare}`) && !bare.endsWith(`.${locHost}`)) {
        return { domain, host, verdict: "REDIRECT_OFFSITE", detail: `${status} → ${locHost}` };
      }
      return { domain, host, verdict: "OK", detail: `${status} → same-site` };
    }
    if (status === 404 || status === 410) {
      return { domain, host, verdict: "DEAD", detail: `${status}` };
    }
    // 200/204/401/403/405/5xx — host answers; treat as alive (bot-walls common).
    return { domain, host, verdict: "OK", detail: `${status}` };
  } catch (err) {
    return { domain, host, verdict: "UNREACHABLE", detail: (err as Error)?.name ?? "error" };
  }
}

async function main() {
  // Dedupe by host (reddit subreddits share reddit.com).
  const seen = new Set<string>();
  const targets = FORUMS.filter((f) => {
    const h = hostOf(f.domain);
    if (seen.has(h)) return false;
    seen.add(h);
    return true;
  });

  console.log(`Checking ${targets.length} unique hosts (${FORUMS.length} forum entries)…\n`);

  const reports: Report[] = [];
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((f) => checkForum(f.domain)));
    for (const r of results) {
      reports.push(r);
      const mark =
        r.verdict === "OK" ? "✓" : r.verdict === "UNREACHABLE" ? "?" : "✗";
      if (r.verdict !== "OK") {
        console.log(`${mark} ${r.verdict.padEnd(17)} ${r.host}  (${r.detail})`);
      }
    }
  }

  const by = (v: Verdict) => reports.filter((r) => r.verdict === v).length;
  console.log("\n── Summary ──");
  console.log(`OK:               ${by("OK")}`);
  console.log(`REDIRECT_OFFSITE: ${by("REDIRECT_OFFSITE")}  (investigate — possible rebrand)`);
  console.log(`DEAD (404/410):   ${by("DEAD")}  (consider removing)`);
  console.log(`UNREACHABLE:      ${by("UNREACHABLE")}  (may be bot-walled or temporary)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
