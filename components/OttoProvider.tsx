"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { OttoContext } from "@/lib/otto";

interface OttoCtxValue {
  /** Compact context about the page the user is viewing (set by the results page). */
  context: OttoContext | null;
  setContext: (c: OttoContext | null) => void;
}

const OttoCtx = createContext<OttoCtxValue>({ context: null, setContext: () => {} });

/** Read/set the context Otto uses to answer follow-ups. */
export function useOtto(): OttoCtxValue {
  return useContext(OttoCtx);
}

/** Wraps the app: provides Otto context and renders the site-wide chat widget. */
export function OttoProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<OttoContext | null>(null);
  return (
    <OttoCtx.Provider value={{ context, setContext }}>{children}</OttoCtx.Provider>
  );
}
