"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Loader2, AlertTriangle, Gauge, Wrench, CircleDollarSign, ListChecks } from "lucide-react";
import type { CodeLookupResult, CodeSeverity } from "@/lib/types";
import { isValidCode } from "@/lib/codes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const SEVERITY: Record<CodeSeverity, { variant: BadgeProps["variant"]; label: string }> = {
  low: { variant: "green", label: "Low severity" },
  moderate: { variant: "amber", label: "Moderate" },
  high: { variant: "orange", label: "High" },
  severe: { variant: "red", label: "Severe" },
};

type Status = "idle" | "loading" | "done" | "error";

export function CodeLookup() {
  const [code, setCode] = useState("");
  const [make, setMake] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<CodeLookupResult | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!isValidCode(c)) {
      setError("Enter a code like P0420, P0301, or U0100.");
      setStatus("error");
      return;
    }
    setError("");
    setStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, make: make.trim() || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.result) {
        setResult(json.result as CodeLookupResult);
        setStatus("done");
      } else {
        setError(json?.error || `Lookup failed (${res.status}).`);
        setStatus("error");
      }
    } catch {
      setError("Network error — please try again.");
      setStatus("error");
    }
  }

  const sev = result ? SEVERITY[result.severity] : null;

  return (
    <div className="panel p-4 sm:p-5">
      <p className="eyebrow mb-3 flex items-center gap-2">
        <ScanLine className="h-3.5 w-3.5 text-accent-orange" />
        Or decode a trouble code
      </p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="OBD-II trouble code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="P0420"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono uppercase placeholder:normal-case sm:flex-1"
          aria-invalid={status === "error" && !result}
        />
        <Input
          aria-label="Vehicle make (optional)"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          placeholder="Make (optional)"
          autoComplete="off"
          className="sm:w-44"
        />
        <Button type="submit" disabled={status === "loading"} className="sm:w-32">
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Decoding…
            </>
          ) : (
            "Decode"
          )}
        </Button>
      </form>

      {status === "error" && error && (
        <p role="alert" className="mt-2 text-xs text-accent-red">
          {error}
        </p>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-xl border border-border bg-background/40 p-4 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-semibold text-accent-orange">{result.code}</span>
                {sev && <Badge variant={sev.variant}>{sev.label}</Badge>}
                <span className="ml-auto font-mono text-[11px] text-secondary">{result.category}</span>
              </div>

              <h3 className="mt-2 font-medium text-primary">{result.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-secondary">{result.meaning}</p>

              {result.driveable && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-elevated px-3 py-2 text-sm leading-relaxed text-primary/90">
                  <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
                  <span>
                    <span className="font-medium">Driveability:</span> {result.driveable}
                  </span>
                </p>
              )}

              {result.commonCauses.length > 0 && (
                <div className="mt-3">
                  <p className="eyebrow mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" /> Common causes
                  </p>
                  <ul className="space-y-1 text-sm text-secondary">
                    {result.commonCauses.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-accent-orange">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.whatToDo.length > 0 && (
                <div className="mt-3">
                  <p className="eyebrow mb-1.5 flex items-center gap-1.5">
                    <ListChecks className="h-3 w-3" /> What to do
                  </p>
                  <ol className="space-y-1 text-sm text-secondary">
                    {result.whatToDo.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-accent-orange">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="default" className="gap-1.5">
                  <CircleDollarSign className="h-3.5 w-3.5 text-accent-green" />
                  <span className="font-mono text-primary">{result.estimatedCost}</span>
                </Badge>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-secondary/70">
                  <Wrench className="h-3 w-3" /> AI-decoded — verify before repairs
                </span>
              </div>

              <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-secondary/70">
                {result.disclaimer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
