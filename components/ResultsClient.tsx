"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCw, AlertTriangle } from "lucide-react";
import type { SearchSuccessResponse, VehicleQuery } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { LoadingState } from "@/components/LoadingState";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "loading" | "success" | "error";

export function ResultsClient({ query }: { query: VehicleQuery }) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<SearchSuccessResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const startedFor = useRef<string | null>(null);

  const vehicleStr = `${query.year} ${query.make} ${query.model}`.trim();
  const hasAllFields = Boolean(query.year && query.make && query.model && query.issue);

  const run = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json) {
        setData(json as SearchSuccessResponse);
        setStatus("success");
        return;
      }
      // Error path — render partial threads if the API provided any (Edge Case #3/#2).
      if (json && Array.isArray(json.partial) && json.partial.length > 0) {
        setData({
          threads: json.partial,
          synthesis: null,
          cached: false,
          stale: false,
          demo: false,
          synthesisAvailable: false,
          vehicle: query,
          sourceCount: json.partial.length,
          generatedAt: new Date().toISOString(),
        });
        setStatus("success");
        return;
      }
      setErrorMsg((json && json.error) || `Search failed (${res.status}).`);
      setStatus("error");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setErrorMsg("Network error — please check your connection and try again.");
      setStatus("error");
    }
  }, [query]);

  useEffect(() => {
    if (!hasAllFields) {
      setStatus("error");
      setErrorMsg("This results page is missing search parameters. Start a new search.");
      return;
    }
    // Guard against React 18 StrictMode double-invoke so we fire exactly one
    // request (and one synthesis). We deliberately do NOT abort on cleanup:
    // StrictMode re-runs effects on the same instance with the ref persisted,
    // so aborting here would cancel the sole in-flight request and the second
    // run would skip re-fetching — stranding the page in a loading state.
    const key = JSON.stringify(query);
    if (startedFor.current === key) return;
    startedFor.current = key;
    void run();
  }, [hasAllFields, query, run]);

  return (
    <main className="min-h-dvh">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-content items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="shrink-0">
            <Logo size={30} />
          </Link>
          {hasAllFields && (
            <p className="hidden min-w-0 flex-1 truncate text-center font-mono text-xs text-secondary sm:block">
              {vehicleStr}
            </p>
          )}
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0 gap-1.5")}
          >
            <ArrowLeft className="h-4 w-4" />
            New search
          </Link>
        </div>
      </div>

      {status === "loading" && <LoadingState vehicle={vehicleStr} />}

      {status === "error" && (
        <div className="mx-auto w-full max-w-content px-4">
          <div className="mx-auto max-w-md py-20 text-center">
            <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-accent-red/30 bg-accent-red/10">
              <AlertTriangle className="h-8 w-8 text-accent-red" />
            </span>
            <h2 className="font-display text-2xl font-bold text-primary">Search hit a snag</h2>
            <p className="mt-3 text-secondary">{errorMsg}</p>
            <div className="mt-7 flex items-center justify-center gap-3">
              {hasAllFields && (
                <Button variant="secondary" onClick={() => run()} className="gap-1.5">
                  <RotateCw className="h-4 w-4" />
                  Try again
                </Button>
              )}
              <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
                Start over
              </Link>
            </div>
          </div>
        </div>
      )}

      {status === "success" && data && (
        <div className="pt-8">
          <ResultsPanel data={data} />
        </div>
      )}
    </main>
  );
}
