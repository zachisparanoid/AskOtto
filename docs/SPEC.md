## Goal
Build a full-stack automotive repair research webapp called **AskOtto**. A user enters their vehicle's year, make, model, and a plain-language description of their issue. The app queries real automotive forums via a search API, clusters the relevant threads by symptom similarity, and uses an LLM to synthesize a structured repair guide from forum findings — surfacing forum posts from any era that contain the actual root-cause fix (e.g., "bend in the wiring harness at 15 years old"). Results cite their source threads with links, dates, and vote/reply counts.

---

## Tech stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animation**: Framer Motion
- **Search API**: Serper API (Google Search JSON API) — used to query a curated list of automotive forum domains
- **LLM Synthesis**: **Claude (`claude-opus-4-8`) via the official Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)**. The SDK spawns the bundled Claude Code runtime (a Node child process) and, when no API key is set, **inherits this computer's existing Claude Code authentication** — the Claude Max–plan OAuth login stored in `~/.claude/.credentials.json`. Verified against the official docs: *"If you have already authenticated Claude Code by running `claude`… the SDK will use that authentication automatically."* So on this machine, synthesis runs with **no LLM API key configured by the app**.
- **Caching / persistence**: SQLite via Prisma ORM (cache query → results for 24 h to avoid redundant API calls)
- **State**: React `useState`/`useReducer` only — no external state manager needed
- **Env secrets**: `SERPER_API_KEY` in `.env.local`. No `OPENAI_API_KEY`. The Claude auth path is selected by environment (see auth callout below): inherited Claude Code login (default on this host), or `ANTHROPIC_API_KEY`, or `CLAUDE_CODE_OAUTH_TOKEN`.

> **⚠️ Auth model — read before deploying.**
> 1. **Subscription-login inheritance works, but is policy-restricted.** Anthropic's own SDK docs state: *"Anthropic generally does not permit third-party developers to offer claude.ai login or rate limits for their products, so API key authentication is the recommended method."* Reusing this computer's Max login is appropriate for a **personal / local / single-operator** tool. For anything served to other users, switch the synthesis auth to a usage-billed **`ANTHROPIC_API_KEY`** (the same Agent SDK code works unchanged — only the env var changes). For headless subscription auth without an interactive login, generate a long-lived token with `claude setup-token` and set **`CLAUDE_CODE_OAUTH_TOKEN`** (still subject to the policy caveat above).
> 2. **Not serverless/Edge-compatible.** The Agent SDK spawns a Claude Code child process and reads credentials from the `~/.claude` home directory. It requires a **long-running Node host with subprocess + filesystem access** (like this machine). It will **not** run on Vercel Edge or typical serverless functions, which have no persistent filesystem, no `~/.claude`, and restricted process spawning. If you must deploy serverless, drop the Agent SDK for the synthesis call and use the direct Anthropic SDK (`@anthropic-ai/sdk`, `messages.parse()` with `output_config.format`) plus an `ANTHROPIC_API_KEY` — see the note in §3.
> 3. **Graceful degradation.** If the host has no valid Claude Code auth and no key/token, synthesis must degrade to raw forum results (Edge Case #2), never crash.

---

## File / module layout

```
askotto/
├── app/
│   ├── layout.tsx                  # Root layout, global fonts, metadata
│   ├── page.tsx                    # Landing / search page
│   ├── results/
│   │   └── page.tsx                # Results page (receives query params)
│   └── api/
│       └── search/
│           └── route.ts            # POST /api/search — orchestrator endpoint
├── components/
│   ├── SearchForm.tsx              # Year / make / model / issue inputs
│   ├── ResultsPanel.tsx            # Top-level results layout
│   ├── SynthesisCard.tsx           # AI-generated repair guide card
│   ├── ThreadCard.tsx              # Individual forum thread result
│   ├── VehicleHeader.tsx           # "2006 GMC Sierra 1500" banner
│   ├── IssueTag.tsx                # Pill tag for issue category
│   ├── LoadingState.tsx            # Skeleton + searching animation
│   └── ui/                         # shadcn primitives (button, input, badge, etc.)
├── lib/
│   ├── search.ts                   # Serper query builder + fetch logic
│   ├── synthesize.ts               # Claude Agent SDK prompt builder + call
│   ├── cache.ts                    # Prisma read/write for cached results
│   ├── forums.ts                   # Master list of automotive forum domains (150+)
│   └── types.ts                    # Shared TypeScript interfaces
├── prisma/
│   └── schema.prisma               # SearchCache model
├── public/
│   └── logo.svg                    # Wrench-spark icon (generate inline SVG)
├── .env.local.example
├── tailwind.config.ts
└── next.config.ts
```

---

## Data model

### Prisma schema (`prisma/schema.prisma`)
```prisma
model SearchCache {
  id          String   @id @default(cuid())
  cacheKey    String   @unique   // SHA-256 of normalized query string
  year        String
  make        String
  model       String
  issue       String
  rawResults  Json     // Array of ThreadResult from Serper
  synthesis   Json     // SynthesisResult from Claude
  createdAt   DateTime @default(now())
  expiresAt   DateTime             // createdAt + 24h
}
```

### TypeScript interfaces (`lib/types.ts`)
```ts
interface VehicleQuery {
  year: string;        // e.g. "2006"
  make: string;        // e.g. "GMC"
  model: string;       // e.g. "Sierra 1500"
  issue: string;       // plain language, e.g. "mass airflow sensor not working"
}

interface ThreadResult {
  title: string;
  url: string;
  snippet: string;
  source: string;      // domain name, e.g. "gm-trucks.com"
  date: string | null; // parsed from snippet if available
  forumName: string;   // human-readable forum name
}

interface SynthesisResult {
  summary: string;              // 2-3 sentence TL;DR
  rootCauses: RootCause[];
  repairSteps: RepairStep[];
  partsToInspect: string[];
  estimatedCost: string;        // e.g. "$40–$120 DIY"
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  notableFinds: NotableFinding[]; // the "hidden gem" old posts
  disclaimer: string;
}

interface RootCause {
  title: string;
  description: string;
  frequency: "very common" | "common" | "occasional" | "rare";
}

interface RepairStep {
  step: number;
  action: string;
  detail: string;
  tip?: string;
}

interface NotableFinding {
  quote: string;        // verbatim short excerpt from the thread
  source: ThreadResult;
  why: string;          // why this finding is notable
}
```

---

## Behavior & features

### 1. Forum domain list (`lib/forums.ts`)
Maintain a curated array of `{ domain: string; name: string; weight: number }` objects. **Include at least 150 domains** (5× the prior baseline) covering generic mechanic communities plus brand-, model-, and powertrain-specific forums across all major makes. Weight convention:

- `weight: 1` — generic / cross-brand mechanic & DIY communities (the **always-include** pool; added to every query regardless of make/model)
- `weight: 2` — brand-general forums
- `weight: 3` — high-signal model-specific or powertrain-specific forums

**Curated set (≥150 domains):**

**Generic / mechanic / DIY (always-include pool, weight 1)**
- `reddit.com/r/MechanicAdvice` — r/MechanicAdvice
- `reddit.com/r/AskMechanics` — r/AskMechanics
- `reddit.com/r/Cartalk` — r/Cartalk
- `reddit.com/r/Justrolledintotheshop` — r/Justrolledintotheshop
- `reddit.com/r/Autobody` — r/Autobody
- `reddit.com/r/Cars` — r/Cars
- `reddit.com/r/Trucks` — r/Trucks
- `garagejournal.com` — The Garage Journal
- `bobistheoilguy.com` — Bob Is The Oil Guy
- `justanswer.com` — JustAnswer (Car)
- `carcomplaints.com` — CarComplaints
- `automotiveforums.com` — AutomotiveForums.com
- `secondchancegarage.com` — Second Chance Garage
- `hotrodders.com` — Hot Rodders Bulletin Board

**GM — full-size trucks / SUVs (weight 2–3)**
- `gm-trucks.com` — GM-Trucks
- `silveradosierra.com` — Silverado Sierra Forum
- `gmtruckclub.com` — GM Truck Club
- `chevroletforum.com` — Chevrolet Forum
- `tahoeyukonforum.com` — Tahoe Yukon Forum
- `chevyavalanchefanclub.com` — Chevy Avalanche Fan Club
- `coloradofans.com` — Colorado Fans
- `67-72chevytrucks.com` — 1967–72 Chevy Trucks
- `gbodyforum.com` — GBodyForum
- `reddit.com/r/gmtrucks` — r/gmtrucks

**GM — cars / performance (weight 2–3)**
- `chevytalk.org` — ChevyTalk
- `ls1tech.com` — LS1Tech
- `corvetteforum.com` — Corvette Forum
- `camaro5.com` — Camaro5 (5th gen)
- `camaro6.com` — Camaro6 (6th gen)
- `thirdgen.org` — ThirdGen (Camaro/Firebird)
- `impalassforum.com` — Impala SS Forum
- `montecarloss.com` — Monte Carlo SS Forum
- `cadillacforums.com` — Cadillac Forums
- `reddit.com/r/Chevy` — r/Chevy

**Ford — trucks / diesel (weight 2–3)**
- `f150forum.com` — F150 Forum
- `f150online.com` — F-150 Online
- `ford-trucks.com` — Ford-Trucks
- `fordforumsonline.com` — Ford Forums Online
- `fordf150.net` — FordF150.net
- `powerstroke.org` — Power Stroke Diesel Forum
- `powerstrokenation.com` — Powerstroke Nation
- `thedieselstop.com` — The Diesel Stop
- `ranger-forums.com` — Ranger Forums
- `bronco6g.com` — Bronco6G
- `fordraptorforum.com` — Ford Raptor Forum
- `mavericktruckclub.com` — Maverick Truck Club
- `reddit.com/r/f150` — r/f150

**Ford — cars / Mustang (weight 2–3)**
- `mustang6g.com` — Mustang6G
- `themustangsource.com` — The Mustang Source
- `allfordmustangs.com` — All Ford Mustangs
- `stangnet.com` — StangNet
- `vintage-mustang.com` — Vintage Mustang Forums
- `explorerforum.com` — Explorer Forum
- `focusfanatics.com` — Focus Fanatics
- `fiestastforum.com` — Fiesta ST Forum

**Mopar — Dodge / RAM / Chrysler (weight 2–3)**
- `dodgeforum.com` — Dodge Forum
- `ramforum.com` — RAM Forum
- `ramforumz.com` — RamForumz
- `dodgetalk.com` — DodgeTalk
- `cumminsforum.com` — Cummins Forum
- `dodgecummins.com` — Dodge Cummins
- `dieseltruckresource.com` — Diesel Truck Resource
- `moparforums.com` — Mopar Forums
- `challengertalk.com` — Challenger Talk
- `chargerforums.com` — Charger Forums
- `durangoforum.com` — Durango Forum
- `reddit.com/r/Dodge` — r/Dodge

**Jeep (weight 2–3)**
- `jeepforum.com` — JeepForum
- `wranglerforum.com` — Wrangler Forum
- `jlwranglerforums.com` — JL Wrangler Forums
- `jkowners.com` — JK Owners (JK Wrangler)
- `cherokeeforum.com` — Cherokee Forum
- `jeepgarage.org` — Jeep Garage
- `reddit.com/r/Jeep` — r/Jeep

**Toyota / Lexus / Scion (weight 2–3)**
- `tacomaworld.com` — Tacoma World
- `tundratalk.net` — Tundra Talk
- `tundras.com` — Tundras.com
- `toyotanation.com` — Toyota Nation
- `yotatech.com` — YotaTech
- `toyota-4runner.org` — Toyota 4Runner Forum
- `t4r.org` — 4Runners (T4R)
- `ih8mud.com` — IH8MUD (Land Cruiser)
- `priuschat.com` — PriusChat
- `rav4world.com` — RAV4World
- `clublexus.com` — ClubLexus
- `lexusownersclub.com` — Lexus Owners Club
- `ft86club.com` — FT86Club (86 / BRZ)
- `fjcruiserforums.com` — FJ Cruiser Forums
- `reddit.com/r/Toyota` — r/Toyota

**Honda / Acura (weight 2–3)**
- `honda-tech.com` — Honda-Tech
- `civicx.com` — CivicX (10th gen Civic)
- `8thcivic.com` — 8th Gen Civic Forum
- `driveaccord.net` — Drive Accord
- `crvownersclub.com` — CR-V Owners Club
- `elementownersclub.com` — Element Owners Club
- `s2ki.com` — S2KI (S2000)
- `nsxprime.com` — NSX Prime
- `acurazine.com` — AcuraZine
- `clubrsx.com` — Club RSX
- `ridgelineownersclub.com` — Ridgeline Owners Club
- `fitfreak.net` — Fit Freak
- `reddit.com/r/Honda` — r/Honda

**Nissan / Infiniti (weight 2–3)**
- `nicoclub.com` — NICOclub
- `titantalk.com` — Titan Talk
- `clubfrontier.org` — Club Frontier
- `thenewx.org` — The New X (Xterra)
- `maxima.org` — Maxima.org
- `my350z.com` — My350Z
- `the370z.com` — The370Z
- `nissanforums.com` — Nissan Forums
- `g35driver.com` — G35Driver (Infiniti)
- `myg37.com` — MyG37

**Subaru (weight 2–3)**
- `nasioc.com` — NASIOC
- `subaruforester.org` — Subaru Forester Owners Forum
- `subaruoutback.org` — Subaru Outback Forums
- `legacygt.com` — Legacy GT
- `subaruxvforum.com` — Subaru XV Forum
- `iwsti.com` — IWSTI (WRX STI)
- `ultimatesubaru.org` — Ultimate Subaru Message Board
- `reddit.com/r/subaru` — r/subaru

**Mazda (weight 2–3)**
- `miata.net` — Miata.net
- `mazda3forums.com` — Mazda3 Forums
- `mazda3revolution.com` — Mazda3 Revolution
- `mazdas247.com` — Mazdas247
- `rx7club.com` — RX7Club
- `rx8club.com` — RX8Club
- `cx5forum.com` — CX-5 Forum

**BMW / MINI (weight 2–3)**
- `bimmerfest.com` — Bimmerfest
- `bimmerforums.com` — Bimmer Forums
- `e46fanatics.com` — E46Fanatics
- `e90post.com` — E90Post
- `f30post.com` — F30Post
- `bimmerpost.com` — BimmerPost
- `xbimmers.com` — Xbimmers (X-series)
- `r3vlimited.com` — R3VLimited (E30)
- `1addicts.com` — 1Addicts (1 Series)
- `northamericanmotoring.com` — North American Motoring (MINI)

**Mercedes-Benz (weight 2–3)**
- `benzworld.org` — BenzWorld
- `mbworld.org` — MBWorld
- `peachparts.com` — PeachParts (Mercedes Shop)
- `mercedesforum.com` — Mercedes Forum
- `sprinter-source.com` — Sprinter Source
- `reddit.com/r/mercedes_benz` — r/mercedes_benz

**Audi / VW / Porsche (weight 2–3)**
- `audizine.com` — Audizine
- `audiworld.com` — AudiWorld
- `quattroworld.com` — QuattroWorld
- `vwvortex.com` — VWVortex
- `tdiclub.com` — TDIClub
- `golfmk7.com` — GolfMK7
- `thesamba.com` — TheSamba (aircooled VW)
- `newbeetle.org` — NewBeetle.org
- `vwatlasforum.com` — VW Atlas Forum
- `rennlist.com` — Rennlist (Porsche)
- `6speedonline.com` — 6SpeedOnline
- `planet-9.com` — Planet-9 (Porsche)

**Hyundai / Kia / Genesis (weight 2–3)**
- `hyundai-forums.com` — Hyundai Forums
- `kia-forums.com` — Kia Forums
- `genesisownersclub.com` — Genesis Owners Club

**Volvo / Saab (weight 2–3)**
- `swedespeed.com` — SwedeSpeed
- `volvoforums.com` — Volvo Forums
- `brickboard.com` — Brickboard (Volvo)
- `saabcentral.com` — SaabCentral

**Land Rover / Jaguar (weight 2–3)**
- `landroverforums.com` — Land Rover Forums
- `disco3.co.uk` — Disco3 (Discovery)
- `jaguarforums.com` — Jaguar Forums

**Mitsubishi / Suzuki / Isuzu (weight 2–3)**
- `evolutionm.net` — EvolutionM (Lancer / Evo)
- `mitsubishi-forums.com` — Mitsubishi Forums
- `suzuki-forums.com` — Suzuki Forums
- `planetisuzoo.com` — Planet Isuzoo

**EV (weight 2–3)**
- `teslamotorsclub.com` — Tesla Motors Club
- `mynissanleaf.com` — My Nissan Leaf
- `chevybolt.org` — Chevy Bolt EV Forum
- `insideevsforum.com` — InsideEVs Forum
- `rivianforums.com` — Rivian Forums
- `f150lightningforum.com` — F-150 Lightning Forum
- `macheforum.com` — Mach-E Forum

**Diesel / off-road / overland (weight 2–3)**
- `dieselplace.com` — Diesel Place
- `competitiondiesel.com` — Competition Diesel
- `turbodieselregister.com` — Turbo Diesel Register
- `expeditionportal.com` — Expedition Portal
- `pirate4x4.com` — Pirate 4x4

**Classic / muscle / other (weight 2–3)**
- `pro-touring.com` — Pro-Touring
- `classicoldsmobile.com` — Classic Oldsmobile
- `fordmuscleforums.com` — Ford Muscle Forums
- `saturnfans.com` — SaturnFans
- `g8board.com` — G8Board (Pontiac G8)

**RV / van / commercial (weight 2–3)**
- `irv2.com` — iRV2
- `fordtransitusaforum.com` — Ford Transit USA Forum
- `promasterforum.com` — ProMaster Forum

> Total: 150+ domains. **Validate at build time:** these are real, well-known forums, but TLDs/ownership change and some communities go dormant or rebrand — run a one-time health check (HTTP HEAD per domain) when seeding `lib/forums.ts` and drop or correct any that 404/redirect off-domain. Because search goes through Google's index (not the live site), a temporarily-down forum is fine, but a dead/rebranded domain pollutes the `site:` filter. **Selection at query time:** the system always includes the generic mechanic / DIY pool (weight 1), then adds the most relevant brand/model/powertrain forums based on exact and fuzzy matches against `make` + `model` (e.g. "GMC"/"Sierra" → `gm-trucks.com`, `silveradosierra.com`, `gmtruckclub.com`; "diesel"/"Cummins"/"Powerstroke" in the issue text pulls in the relevant diesel forums). Cap the final selection at **the 12 most relevant domains per Serper request** to keep `site:` OR-query length within Google/Serper limits; if more than 12 match, rank by `weight` then by match specificity (exact model > brand > generic).

### 2. Search query construction (`lib/search.ts`)
- Build a Serper query: `"[year] [make] [model]" "[normalized issue keywords]" site:[domain1] OR site:[domain2] OR ...`
- Run **3 parallel Serper requests**:
  1. Exact symptom search: `"[year] [make] [model]" "[issue]"`
  2. Year-range search: `"[make] [model]" "[issue]" [year-2]..[year+3]`
  3. Generic issue search: `"[make] [model]" "[key noun from issue]" fix repair solution`
- De-duplicate results by URL. Keep top 20 unique threads.
- Parse date from snippet using regex (`\b(Jan|Feb|...|Dec)\w*\s+\d{1,2},?\s+\d{4}\b` or `\d{1,2}/\d{1,2}/\d{2,4}`).
- Tag each result with the forum's human name.

### 3. LLM synthesis (`lib/synthesize.ts`)
- Send the 20 thread titles + snippets to **Claude (`claude-opus-4-8`) through the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)**. The SDK call runs **server-side only** (inside the API route) and **inherits the host's Claude Code authentication automatically** (the Max-plan OAuth login in `~/.claude/.credentials.json`). No API key is passed by the app.
- Call shape (single-turn, no tools, **schema-constrained JSON output**):
  ```ts
  import { query } from "@anthropic-ai/claude-agent-sdk";

  // SYNTHESIS_SCHEMA = a JSON Schema describing SynthesisResult (summary, rootCauses[],
  // repairSteps[], partsToInspect[], estimatedCost, difficultyRating, notableFinds[], disclaimer).
  const run = query({
    prompt: userSynthesisPrompt,         // the thread excerpts + task framing (data, not instructions)
    options: {
      model: "claude-opus-4-8",          // primary
      fallbackModel: "claude-sonnet-4-6",// auto-used if the primary call fails
      systemPrompt:
        "You are an expert automotive technician and forum researcher.",
      maxTurns: 1,                        // one synthesis pass, no agentic loop
      allowedTools: [],                   // disable all tools — no file/web/bash access
      settingSources: [],                 // load no filesystem settings (CLAUDE.md, etc.) — this is the default
      permissionMode: "default",
      outputFormat: { type: "json_schema", schema: SYNTHESIS_SCHEMA }, // schema-guaranteed output
      // maxBudgetUsd: 0.50,              // optional per-synthesis cost ceiling
    },
  });

  let synthesis: SynthesisResult | null = null;
  for await (const message of run) {
    if (message.type === "result") {
      if (message.subtype === "success") {
        synthesis = message.structured_output as SynthesisResult; // validated against SYNTHESIS_SCHEMA
      }
      // subtype "error_max_structured_output_retries" / "error_during_execution" → leave synthesis null
    }
  }
  ```
  - **Auth note:** the SDK resolves credentials exactly as the `claude` CLI does. On this machine that is the Claude Max OAuth login — synthesis "just works" with no key configured. If `ANTHROPIC_API_KEY` (or `CLAUDE_CODE_OAUTH_TOKEN`) is present in the server environment, the SDK uses it instead. See the **Auth model** callout in the Tech stack section for the policy and serverless caveats.
- **System prompt / task:** Analyze the provided forum excerpts for `[year] [make] [model]` with reported issue `[issue]`. Synthesize a structured repair guide. For `notableFinds`, specifically look for older posts (5–15+ years old) that contain root-cause discoveries, hidden wiring issues, TSBs, or non-obvious fixes that most mechanics overlook.
- **Output format:** Use the SDK's **`outputFormat: { type: "json_schema", schema: SYNTHESIS_SCHEMA }`** so the model is constrained to a schema matching `SynthesisResult`, and read the parsed object from `message.structured_output` on the `result` message. This replaces hand-rolled "respond with JSON only" prompting + `JSON.parse` — the SDK validates and retries internally. (If you switch to the direct `@anthropic-ai/sdk` for serverless, use `messages.parse()` with `output_config: { format: { type: "json_schema", schema: SYNTHESIS_SCHEMA } }` for the equivalent guarantee.)
- **Determinism / consistency:** Do **not** set a `temperature` parameter — `temperature` (and `top_p`/`top_k`) are removed on `claude-opus-4-8` and will error. Rely on the structured system prompt and the output schema for factual consistency. Keep adaptive thinking at its default.

### 4. Caching (`lib/cache.ts`)
- Cache key = SHA-256 of lowercase(`${year}|${make}|${model}|${issue}`)
- On hit: return cached `{ threads, synthesis }` immediately, mark response with `cached: true`
- On miss: fetch → synthesize → write to cache with `expiresAt = now + 24h`
- Expired entries are served stale while a background revalidation triggers (return `stale: true` flag)

### 5. API route (`app/api/search/route.ts`)
- `POST` body: `VehicleQuery`
- Validate: year must be 4 digits, 1900–2030; make/model non-empty; issue at least 10 chars
- Return `{ threads: ThreadResult[], synthesis: SynthesisResult, cached: boolean, stale: boolean }`
- On Claude or Serper error: return `500` with `{ error: string, partial: ThreadResult[] | null }` so the frontend can show raw threads even if synthesis fails. A missing/invalid Claude Code auth on the host is treated as a synthesis error (graceful degradation to raw threads), not a hard crash.

### 6. Search form
- **Year**: free-text input with datalist auto-complete (1980–current year + 1)
- **Make**: free-text with popular makes datalist (Ford, Chevrolet, GMC, Dodge, RAM, Toyota, Honda, Nissan, Jeep, BMW, Mercedes-Benz, Subaru, Mazda, Hyundai, Kia, Volkswagen, Audi, Lexus, Acura, Cadillac, Buick, Pontiac, Saturn, Chrysler, Mitsubishi, Isuzu, Suzuki, Scion, Infiniti, Volvo, Land Rover, Jaguar, Porsche, Tesla, Rivian, Lucid)
- **Model**: free-text (no auto-complete — too many)
- **Issue description**: `<textarea>` with placeholder: "Describe the problem in plain language, e.g. 'rough idle when cold, MAF sensor code P0101'"
- All fields required. Inline validation on blur.
- Submit triggers navigation to `/results?year=...&make=...&model=...&issue=...` with URL-encoded params

### 7. Results page
- On mount, read query params and `POST /api/search`
- Show `LoadingState` (animated skeleton) during fetch
- On success, render:
  1. `VehicleHeader` — large banner with vehicle string + issue summary
  2. `SynthesisCard` — full AI repair guide
  3. "Forum Threads" section — grid of `ThreadCard` components
  4. "Notable Finds" section at bottom — highlighted older/obscure posts with the `notableFinds` from synthesis
- "Search again" link back to `/`

---

## UX & visual design

### Color palette
| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#0D0D0F` | Page background |
| `bg-surface` | `#161618` | Card backgrounds |
| `bg-elevated` | `#1F1F23` | Hover states, inputs |
| `accent-orange` | `#F97316` | Primary CTA, highlights |
| `accent-amber` | `#FBBF24` | Severity / frequency badges |
| `accent-green` | `#22C55E` | "Easy" difficulty, success |
| `accent-red` | `#EF4444` | Errors, "Hard" difficulty |
| `text-primary` | `#F4F4F5` | Headings |
| `text-secondary` | `#A1A1AA` | Body, metadata |
| `border` | `#27272A` | Dividers, card borders |

### Typography
- Font: **Inter** (Google Fonts) — `font-sans`
- Heading scale: `text-4xl font-bold` (hero), `text-2xl font-semibold` (section), `text-lg font-medium` (card titles)
- Body: `text-sm` / `text-base`, `leading-relaxed`
- Monospace: `font-mono text-xs` for URLs and code snippets

### Spacing
- Base unit: 4px (Tailwind default)
- Card padding: `p-6`
- Section gap: `gap-6` or `gap-8`
- Max content width: `max-w-5xl mx-auto px-4`

### Landing page layout
- Full-viewport dark hero with a large centered search card
- Logo top-left (wrench + spark SVG in orange)
- Tagline: *"Decades of forum knowledge, seconds of search."*
- Search card: `bg-surface` rounded-2xl with subtle `border border-border` and `shadow-2xl`
- Bottom strip: scrolling ticker of popular vehicle searches (purely decorative)

### Results page layout
- Sticky top bar: vehicle name + "New search" button
- Two-column layout on desktop (`lg:grid-cols-3`): synthesis takes 2 cols, thread list takes 1 col
- On mobile: single column, synthesis first

### Motion
- Search card entrance: `initial={{ opacity: 0, y: 24 }}` → `animate={{ opacity: 1, y: 0 }}` over 400ms
- Loading state: pulsing skeleton shimmer (`animate-pulse`) on cards
- Thread cards: staggered fade-in (`delay: index * 60ms`)
- `SynthesisCard` sections: each `RootCause` and `RepairStep` reveals with a subtle left-slide from `x: -12`
- `NotableFinding` cards: amber left border + gentle glow `box-shadow: 0 0 12px rgba(251,191,36,0.15)` on hover

### ThreadCard design
- Forum favicon (fetched from `${domain}/favicon.ico` with fallback to a generic wrench icon)
- Forum name badge (pill, `bg-elevated text-text-secondary`)
- Thread title (link, `text-primary hover:text-accent-orange`)
- Date if available (metadata, small, right-aligned)
- Snippet excerpt (2 lines clamped)

### SynthesisCard design
- Top strip: difficulty stars (1–5 filled orange stars), estimated cost chip, a "DIY-friendly" / "Mechanic recommended" badge
- TL;DR summary in a slightly larger font at top
- Collapsible sections for Root Causes, Repair Steps, Parts to Inspect
- Each root cause has a frequency pill: "Very Common" = red, "Common" = amber, "Occasional" = zinc, "Rare" = blue
- Repair steps are numbered with a left accent line in orange
- Footer disclaimer in muted text, smaller

### Notable Finds section
- Amber/gold accent treatment — heading reads: "🔍 Hidden Gems from the Forums"
- Each card shows the verbatim quote in a styled blockquote, source link, and LLM's explanation of why it matters
- Cards have a subtle amber gradient border

---

## Edge cases & error handling

1. **No results from Serper**: Show "We couldn't find forum discussions for this exact vehicle and issue. Try broader terms." with suggested reformulations (shorter issue text, drop model trim).
2. **Claude synthesis failure**: Fall back to displaying the raw thread list with a banner: "AI synthesis unavailable — showing raw forum results." Thread cards still render fully. This path also covers the case where the host has no valid Claude Code auth (and no `ANTHROPIC_API_KEY`).
3. **Partial Serper failure** (one of 3 queries fails): Continue with available results; do not surface error to user unless all 3 fail.
4. **Very old or obscure vehicle** (pre-1990, very rare model): Synthesis prompt instructs model to lower confidence if source count < 5 and include a note in the disclaimer.
5. **Issue description too vague** (< 15 chars after trimming): Inline form error: "Please describe the issue in more detail so we can search precisely."
6. **Cache DB unavailable**: Degrade gracefully — skip cache check and proceed with live fetch, log warning server-side.
7. **Rate limiting on Serper** (429): Return cached stale results if available; otherwise 503 with user-facing message.
8. **Malformed / missing synthesis output**: With `outputFormat` schema constraints the SDK validates and retries structured output internally. If the `result` message arrives with `subtype: "error_max_structured_output_retries"` (or any non-`success` subtype, or `structured_output` is absent), treat it as a synthesis failure: return `synthesis: null` and surface raw threads (same path as Edge Case #2). Do not hand-parse model text.
9. **XSS / injection**: All user inputs sanitized before insertion into search queries (strip special characters except spaces, hyphens, numbers). Never render user input as raw HTML. Never pass unsanitized user text into the synthesis prompt as instructions — treat issue text strictly as data.
10. **Long issue text** (> 500 chars): Truncate to 500 before sending to Serper; keep full text for Claude synthesis context.
11. **Forum domain unreachable**: The Serper/Google search handles this — we search Google's index of these domains, not the domains directly, so downtime is irrelevant.
12. **Mobile keyboard**: textarea auto-resize as user types (JS `rows` adjustment on `input` event).

---

## Definition of done

- [ ] Landing page renders with search form; all 4 fields validate correctly on blur and on submit
- [ ] Submitting valid inputs navigates to `/results` with correct URL params
- [ ] Results page fetches `POST /api/search` and displays loading skeletons during request
- [ ] At least 3 forum threads render as `ThreadCard` components with title, source badge, snippet, and clickable link
- [ ] `SynthesisCard` renders all sections: summary, root causes (with frequency), repair steps (numbered), parts to inspect, cost estimate, difficulty rating
- [ ] "Notable Finds" section renders if `notableFinds.length > 0` with amber styling and verbatim quotes
- [ ] Cache hit path: second identical search returns instantly with `cached: true` (verify via server log or response header)
- [ ] **Claude synthesis runs via the Claude Agent SDK using the host's inherited Claude Code auth — no API key configured.** Verify a clean search produces a populated `SynthesisResult`.
- [ ] **If Claude synthesis fails (simulate by logging out of Claude Code, e.g. `claude logout` / temporarily renaming `~/.claude/.credentials.json`, with no `ANTHROPIC_API_KEY` set), raw threads still display with the fallback banner**
- [ ] If Serper returns 0 results, empty-state message renders (no crash)
- [ ] `lib/forums.ts` contains **at least 150 forum domains**, and query-time selection always includes the generic pool plus brand/model matches (capped at 12 per Serper request)
- [ ] All color tokens, typography, and spacing match spec — dark background, orange accent, no light-mode flicker
- [ ] Framer Motion entrance animations play on load; thread cards stagger visibly
- [ ] Form inputs include a populated `<datalist>` for year and make
- [ ] App runs without TypeScript errors (`tsc --noEmit` passes)
- [ ] Prisma schema is migrated and `SearchCache` table exists in SQLite
- [ ] `.env.local.example` lists `SERPER_API_KEY` (and documents that no LLM key is required — Claude auth is inherited from Claude Code; `ANTHROPIC_API_KEY` is an optional override)
- [ ] No API keys or secrets appear in client-side bundles (all Serper and Claude Agent SDK calls are server-side only in the API route)
- [ ] Responsive: layout is usable on 375px mobile viewport (single column, no overflow)
