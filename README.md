# GrillSearch

**Decades of forum knowledge, seconds of search.**

GrillSearch is a full-stack automotive repair research app. Enter your vehicle's
year/make/model and describe the problem in plain English. GrillSearch queries
real automotive forums via search, de-duplicates and clusters the threads, and
uses **Claude** to synthesize a structured, **cited** repair guide — surfacing
the obscure older posts that contain the actual root-cause fix (e.g. *"the
wiring harness chafes at 15 years old"*), which most mechanics overlook.

Every claim links back to a real forum thread with its date and source.

---

## Tech stack

- **Next.js 14** (App Router, TypeScript) · **Tailwind CSS** · **Framer Motion**
- **Search**: [Serper](https://serper.dev) (Google Search JSON API) over a curated list of **189 forum domains** (`lib/forums.ts`)
- **LLM synthesis**: **Claude `claude-opus-4-8`** via the official **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`), schema-constrained JSON output (`fallbackModel: claude-sonnet-4-6`)
- **Cache / persistence**: SQLite via **Prisma** (24h cache, stale-while-revalidate)
- **UI**: shadcn-style primitives, Inter + Chakra Petch + JetBrains Mono

## ⚠️ Auth model — read before deploying

Synthesis runs **server-side only** (inside `/api/search`) through the Claude
Agent SDK, which resolves credentials the same way the `claude` CLI does:

1. **Inherited Claude Code login (default on this host).** With no API key set,
   the SDK uses this machine's existing Claude Code OAuth login
   (`~/.claude/.credentials.json`). **No LLM key is configured by the app.** This
   is appropriate for a **personal / local / single-operator** tool.
   > Anthropic's policy: reusing a claude.ai/subscription login generally is not
   > permitted for third-party multi-user products. For anything served to other
   > users, switch to a usage-billed **`ANTHROPIC_API_KEY`** (same code, only the
   > env var changes), or a headless **`CLAUDE_CODE_OAUTH_TOKEN`** from
   > `claude setup-token`.
2. **Not serverless/Edge-compatible.** The Agent SDK spawns a Claude Code child
   process and reads `~/.claude` — it needs a **long-running Node host with
   subprocess + filesystem access**. The `/api/search` route pins `runtime = "nodejs"`.
   It will **not** run on Vercel Edge or typical serverless functions. (To deploy
   serverless, swap `lib/synthesize.ts` for the direct `@anthropic-ai/sdk`
   `messages.parse()` + an `ANTHROPIC_API_KEY`.)
3. **Graceful degradation.** If the host has no valid Claude auth (and no key),
   synthesis returns `null` and the UI shows the raw forum threads with a
   banner — it never crashes.

## Getting started

```bash
# 1. Install
npm install

# 2. Create the SQLite database (SearchCache table)
npm run db:push        # runs `prisma generate` + `prisma db push`

# 3. Configure secrets (optional for local dev — see below)
cp .env.local.example .env.local
#   - SERPER_API_KEY: enables live forum search. WITHOUT it, the app runs in
#     labeled "demo mode" (sample threads) so you can still exercise the full
#     pipeline + live Claude synthesis.
#   - No LLM key needed if this host is logged into Claude Code (`claude`).

# 4. Run
npm run dev            # http://localhost:3000
```

Database URL lives in `.env` (`DATABASE_URL="file:./dev.db"`) — not secret.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Create/sync the SQLite schema |
| `npm run forums:check` | Advisory health check of all forum domains |

## How it works

```
SearchForm ──▶ /results ──▶ POST /api/search
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                          ▼
   lib/cache.ts             lib/search.ts              lib/synthesize.ts
  (SQLite, 24h,         (Serper × 3 queries over     (Claude Agent SDK,
   stale-revalidate)     selected forums, dedup,       schema-constrained
                         date-parse, demo fallback)    JSON, degrades to null)
```

1. **Forum selection** (`lib/forums.ts`) — always includes a floor of generic
   mechanic forums, then ranks brand/model/powertrain-specific forums by
   specificity, capped at 12 domains per request (Google `site:` limit).
2. **Search** (`lib/search.ts`) — 3 complementary Serper queries (exact symptom,
   year-range, generic), de-duplicated by URL to the top 20 threads, dates parsed
   from snippets. Tolerates partial failures; surfaces 429 as rate-limit.
3. **Synthesis** (`lib/synthesize.ts`) — sends thread excerpts (as **data**, not
   instructions) to Claude with a JSON Schema. `notableFinds` cite a source by
   **URL chosen from an enum of the real thread URLs**, then resolved back to the
   actual thread — fabricated citations are structurally impossible.
4. **Cache** (`lib/cache.ts`) — SHA-256 key over the normalized query; fresh hits
   return instantly (`X-GrillSearch-Cache: hit`), stale entries serve immediately
   while refreshing in the background.

## Edge cases handled

No Serper results → empty state with reformulation tips · Claude failure / no auth
→ raw threads + banner · partial Serper failure → continue · vague issue (<15 chars)
→ inline form error · cache DB down → live fetch · Serper 429 → 503 · malformed
synthesis → degrade · user input sanitized for queries and treated as data in
prompts · long issue truncated for search, full for synthesis · mobile textarea
auto-resizes.

## Notes

- `docs/SPEC.md` is the original build spec.
- Forum domains are real and well-known but ownership/TLDs change — run
  `npm run forums:check` periodically and prune dead/rebranded hosts.
