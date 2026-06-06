"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ChevronDown,
  CircleDollarSign,
  Lightbulb,
  AlertOctagon,
  ListChecks,
  Search,
  CircleDot,
  Sparkles,
} from "lucide-react";
import type { Frequency, SynthesisResult } from "@/lib/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Variant = BadgeProps["variant"];

const FREQ: Record<Frequency, { variant: Variant; label: string }> = {
  "very common": { variant: "red", label: "Very Common" },
  common: { variant: "amber", label: "Common" },
  occasional: { variant: "default", label: "Occasional" },
  rare: { variant: "blue", label: "Rare" },
};

const CONFIDENCE: Record<SynthesisResult["confidence"], { variant: Variant; label: string }> = {
  high: { variant: "green", label: "High confidence" },
  medium: { variant: "amber", label: "Medium confidence" },
  low: { variant: "red", label: "Low confidence" },
};

function difficultyMeta(d: number): { label: string; variant: Variant } {
  if (d <= 2) return { label: "DIY-friendly", variant: "green" };
  if (d === 3) return { label: "Intermediate", variant: "amber" };
  return { label: "Mechanic recommended", variant: "red" };
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border pt-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="inline-flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-accent-orange" />
          <span className="font-display text-base font-semibold text-primary">{title}</span>
          {typeof count === "number" && <Badge variant="default">{count}</Badge>}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-secondary transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const slideIn = (i: number) => ({
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.35, delay: Math.min(i * 0.05, 0.4), ease: "easeOut" as const },
});

export function SynthesisCard({ synthesis }: { synthesis: SynthesisResult }) {
  const diff = difficultyMeta(synthesis.difficultyRating);
  const conf = CONFIDENCE[synthesis.confidence];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="panel overflow-hidden p-6 sm:p-7"
    >
      <p className="eyebrow mb-4 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-accent-orange" />
        AI Repair Guide
      </p>

      {/* Top strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="inline-flex items-center gap-2">
          <span className="eyebrow">Difficulty</span>
          <span className="flex gap-0.5" aria-label={`Difficulty ${synthesis.difficultyRating} of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < synthesis.difficultyRating ? "fill-accent-orange text-accent-orange" : "text-border",
                )}
              />
            ))}
          </span>
        </div>
        <span className="hidden h-4 w-px bg-border sm:block" />
        <Badge variant="default" className="gap-1.5">
          <CircleDollarSign className="h-3.5 w-3.5 text-accent-green" />
          <span className="font-mono text-primary">{synthesis.estimatedCost}</span>
        </Badge>
        <Badge variant={diff.variant}>{diff.label}</Badge>
        <Badge variant={conf.variant}>{conf.label}</Badge>
      </div>

      {/* TL;DR */}
      <div className="mt-5">
        <p className="eyebrow mb-1.5">TL;DR</p>
        <p className="text-pretty text-[15px] leading-relaxed text-primary/90 sm:text-base">
          {synthesis.summary}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {/* Root causes */}
        {synthesis.rootCauses.length > 0 && (
          <CollapsibleSection title="Root Causes" icon={AlertOctagon} count={synthesis.rootCauses.length}>
            <div className="space-y-3">
              {synthesis.rootCauses.map((c, i) => (
                <motion.div
                  key={i}
                  {...slideIn(i)}
                  className="rounded-xl border border-border bg-base/40 p-4"
                >
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    <h4 className="font-medium text-primary">{c.title}</h4>
                    <Badge variant={FREQ[c.frequency].variant} className="shrink-0">
                      {FREQ[c.frequency].label}
                    </Badge>
                  </div>
                  {c.description && (
                    <p className="text-sm leading-relaxed text-secondary">{c.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Repair steps */}
        {synthesis.repairSteps.length > 0 && (
          <CollapsibleSection title="Repair Steps" icon={ListChecks} count={synthesis.repairSteps.length}>
            <ol className="space-y-3">
              {synthesis.repairSteps.map((s, i) => (
                <motion.li
                  key={s.step}
                  {...slideIn(i)}
                  className="relative overflow-hidden rounded-xl border border-border bg-base/40 p-4 pl-5"
                >
                  <span className="absolute left-0 top-0 h-full w-1 bg-accent-orange" aria-hidden />
                  <div className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-orange/15 font-mono text-sm font-semibold text-accent-orange">
                      {s.step}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-primary">{s.action}</p>
                      {s.detail && (
                        <p className="mt-1 text-sm leading-relaxed text-secondary">{s.detail}</p>
                      )}
                      {s.tip && (
                        <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-accent-amber/10 px-2.5 py-1.5 text-xs leading-relaxed text-accent-amber">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{s.tip}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ol>
          </CollapsibleSection>
        )}

        {/* Parts to inspect */}
        {synthesis.partsToInspect.length > 0 && (
          <CollapsibleSection title="Parts to Inspect" icon={Search} count={synthesis.partsToInspect.length}>
            <div className="flex flex-wrap gap-2">
              {synthesis.partsToInspect.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-base/40 px-3 py-1.5 text-sm text-primary"
                >
                  <CircleDot className="h-3.5 w-3.5 text-accent-orange" />
                  {p}
                </span>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Disclaimer */}
      <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-secondary/80">
        {synthesis.disclaimer}
      </p>
    </motion.section>
  );
}
