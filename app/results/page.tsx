import type { Metadata } from "next";
import { ResultsClient } from "@/components/ResultsClient";

export const metadata: Metadata = {
  title: "Results",
  robots: { index: false, follow: false },
};

// Reads query params on the server (no useSearchParams / Suspense needed) and
// hands a plain VehicleQuery to the client component that performs the fetch.
function pick(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v ?? "").trim();
}

export default function ResultsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const query = {
    year: pick(searchParams.year),
    make: pick(searchParams.make),
    model: pick(searchParams.model),
    issue: pick(searchParams.issue),
  };

  return <ResultsClient query={query} />;
}
