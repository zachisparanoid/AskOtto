"use client";

import { useEffect, useState } from "react";
import { Wrench, Search, Network, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STAGES = [
  { icon: Search, label: "Querying automotive forums" },
  { icon: Network, label: "Clustering threads by symptom" },
  { icon: Wrench, label: "Reading root-cause discussions" },
  { icon: Sparkles, label: "Synthesizing your repair guide" },
];

export function LoadingState({ vehicle }: { vehicle?: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2400);
    return () => clearInterval(id);
  }, []);

  const Active = STAGES[stage].icon;

  return (
    <div className="mx-auto w-full max-w-content px-4 py-10">
      {/* Live status */}
      <div className="mb-8 flex items-center gap-4">
        <span className="relative grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface">
          <Active className="h-6 w-6 animate-pulse text-accent-orange" />
          <span className="absolute inset-0 animate-ping rounded-xl border border-accent-orange/30" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-primary">
            {STAGES[stage].label}
            <span className="ml-0.5 inline-flex">
              <span className="animate-[spark_1s_ease-in-out_infinite]">.</span>
              <span className="animate-[spark_1s_ease-in-out_infinite_0.2s]">.</span>
              <span className="animate-[spark_1s_ease-in-out_infinite_0.4s]">.</span>
            </span>
          </p>
          {vehicle && (
            <p className="truncate font-mono text-xs text-secondary">{vehicle}</p>
          )}
        </div>
      </div>

      {/* Stage progress ticks */}
      <div className="mb-10 flex gap-1.5">
        {STAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              i <= stage ? "bg-accent-orange" : "bg-elevated"
            }`}
          />
        ))}
      </div>

      {/* Skeleton layout mirroring the results grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
