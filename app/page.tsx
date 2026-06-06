import { Logo } from "@/components/Logo";
import { SearchForm } from "@/components/SearchForm";
import { Search, Sparkles, Wrench } from "lucide-react";

const POPULAR = [
  "2006 GMC Sierra 1500 — rough idle, P0101",
  "2011 Ford F-250 6.7 — no-start when hot",
  "2008 Honda Accord — VTC actuator rattle",
  "2013 Jeep Wrangler JK — death wobble",
  "2015 Subaru Outback — oil consumption",
  "2007 Toyota Tundra — air injection P2440",
  "2012 Chevy Cruze — coolant smell, no leak",
  "2010 BMW 335i — N54 HPFP failure",
  "2014 RAM 2500 Cummins — grid heater bolt",
  "2009 Nissan Altima — CVT judder",
  "2016 VW Jetta TDI — limp mode",
  "2005 Toyota Tacoma — frame rust",
];

function Ticker() {
  const items = [...POPULAR, ...POPULAR];
  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-t border-border py-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
    >
      <div className="flex w-max animate-ticker gap-3">
        {items.map((it, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-xs text-secondary"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-orange/60" />
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <header className="mx-auto flex w-full max-w-content items-center justify-between px-4 py-5">
        <Logo />
        <span className="hidden items-center gap-2 font-mono text-xs text-secondary sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-spark" />
          150+ forums indexed
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-2xl text-center">
          <p className="eyebrow mb-4 animate-fade-up">Automotive repair research</p>
          <h1
            className="animate-fade-up font-display text-4xl font-bold leading-[1.05] tracking-tight text-primary sm:text-6xl"
            style={{ animationDelay: "60ms" }}
          >
            Decades of forum knowledge,
            <br />
            <span className="text-accent-orange">seconds of search.</span>
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl animate-fade-up text-pretty text-base leading-relaxed text-secondary sm:text-lg"
            style={{ animationDelay: "120ms" }}
          >
            Enter your year, make, model, and the problem in plain English. GrillSearch reads 150+ real
            mechanic forums and synthesizes a cited, root-cause repair guide — including the obscure old
            posts with the fix most shops never find.
          </p>
        </div>

        <div className="mt-9 w-full max-w-2xl">
          <SearchForm />
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-secondary">
          <li className="inline-flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-accent-orange" /> Real forum threads, cited
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent-orange" /> Claude-synthesized guide
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-accent-orange" /> Root-cause focused
          </li>
        </ul>
      </section>

      <Ticker />
    </main>
  );
}
