"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gem,
  ExternalLink,
  SearchX,
  AlertTriangle,
  FlaskConical,
  MessagesSquare,
} from "lucide-react";
import type { SearchSuccessResponse } from "@/lib/types";
import { VehicleHeader } from "@/components/VehicleHeader";
import { SynthesisCard } from "@/components/SynthesisCard";
import { ThreadCard } from "@/components/ThreadCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "amber" | "red";
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const styles =
    tone === "amber"
      ? "border-accent-amber/30 bg-accent-amber/10 text-accent-amber"
      : "border-accent-red/30 bg-accent-red/10 text-accent-red";
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

function EmptyState({ vehicle }: { vehicle: SearchSuccessResponse["vehicle"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-xl py-16 text-center"
    >
      <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-border bg-surface">
        <SearchX className="h-8 w-8 text-secondary" />
      </span>
      <h2 className="font-display text-2xl font-bold text-primary">No forum discussions found</h2>
      <p className="mt-3 text-secondary">
        We couldn&apos;t find forum threads for{" "}
        <span className="text-primary">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </span>{" "}
        with that exact issue. Try broader terms.
      </p>
      <ul className="mx-auto mt-5 max-w-md space-y-2 text-left text-sm text-secondary">
        <li className="flex gap-2">
          <span className="text-accent-orange">→</span> Shorten the issue description to the core symptom or trouble code.
        </li>
        <li className="flex gap-2">
          <span className="text-accent-orange">→</span> Drop the trim level from the model (e.g. &ldquo;Sierra&rdquo; instead of &ldquo;Sierra 1500 Denali&rdquo;).
        </li>
        <li className="flex gap-2">
          <span className="text-accent-orange">→</span> Use common terms a forum poster would write.
        </li>
      </ul>
      <Link href="/" className={cn(buttonVariants({ variant: "secondary" }), "mt-7 inline-flex")}>
        Start a new search
      </Link>
    </motion.div>
  );
}

export function ResultsPanel({ data }: { data: SearchSuccessResponse }) {
  const { threads, synthesis, vehicle, sourceCount, demo, cached, stale, synthesisAvailable } = data;

  if (threads.length === 0) {
    return (
      <div className="mx-auto w-full max-w-content px-4">
        <EmptyState vehicle={vehicle} />
      </div>
    );
  }

  const notable = synthesis?.notableFinds ?? [];

  return (
    <div className="mx-auto w-full max-w-content space-y-8 px-4 pb-20">
      <VehicleHeader
        vehicle={vehicle}
        sourceCount={sourceCount}
        demo={demo}
        cached={cached}
        stale={stale}
        synthesisAvailable={synthesisAvailable}
      />

      <div className="space-y-3">
        {demo && (
          <Banner tone="amber" icon={FlaskConical}>
            Showing <strong>sample data</strong> — no <code className="font-mono">SERPER_API_KEY</code> is configured, so
            these threads are illustrative. The AI synthesis below still ran live against Claude. Add a Serper key for
            real forum results.
          </Banner>
        )}
        {!synthesisAvailable && (
          <Banner tone="red" icon={AlertTriangle}>
            AI synthesis is unavailable right now — showing the raw forum results below. Every thread is still fully
            linked and searchable.
          </Banner>
        )}
      </div>

      {synthesis ? (
        // Two-column: synthesis (2 cols) + thread list (1 col). Synthesis first on mobile.
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SynthesisCard synthesis={synthesis} />
          </div>
          <aside className="space-y-3">
            <h2 className="eyebrow flex items-center gap-2">
              <MessagesSquare className="h-3.5 w-3.5" />
              Forum Threads · {threads.length}
            </h2>
            {threads.map((t, i) => (
              <ThreadCard key={t.url + i} thread={t} index={i} />
            ))}
          </aside>
        </div>
      ) : (
        // No synthesis → raw threads, full-width grid.
        <div>
          <h2 className="eyebrow mb-4 flex items-center gap-2">
            <MessagesSquare className="h-3.5 w-3.5" />
            Forum Threads · {threads.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {threads.map((t, i) => (
              <ThreadCard key={t.url + i} thread={t} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Notable finds — "Hidden Gems" */}
      {notable.length > 0 && (
        <section className="pt-2">
          <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold text-primary">
            <Gem className="h-5 w-5 text-accent-amber" />
            Hidden Gems from the Forums
          </h2>
          <p className="mb-5 text-sm text-secondary">
            Older or obscure posts that contain the real root-cause fix — the kind most mechanics overlook.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {notable.map((find, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.08, 0.5) }}
                className="group relative overflow-hidden rounded-2xl border border-accent-amber/30 bg-surface p-5 transition-shadow hover:shadow-glow-amber"
              >
                <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent-amber to-accent-orange" aria-hidden />
                <blockquote className="border-l-2 border-accent-amber/50 pl-4 text-[15px] italic leading-relaxed text-primary/90">
                  &ldquo;{find.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 space-y-3">
                  <p className="text-sm leading-relaxed text-secondary">{find.why}</p>
                  <a
                    href={find.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-accent-amber transition-colors hover:text-accent-orange"
                  >
                    <span className="truncate">{find.source.forumName}</span>
                    {find.source.date && <span className="text-secondary/70">· {find.source.date}</span>}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
