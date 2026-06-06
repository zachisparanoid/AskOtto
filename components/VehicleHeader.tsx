"use client";

import { motion } from "framer-motion";
import { Wrench, FileText, FlaskConical, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { VehicleQuery } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { IssueTag } from "@/components/IssueTag";

interface VehicleHeaderProps {
  vehicle: VehicleQuery;
  sourceCount: number;
  demo: boolean;
  cached: boolean;
  stale: boolean;
  synthesisAvailable: boolean;
}

export function VehicleHeader({
  vehicle,
  sourceCount,
  demo,
  cached,
  stale,
  synthesisAvailable,
}: VehicleHeaderProps) {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim();

  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="border-b border-border pb-7"
    >
      <p className="eyebrow mb-2">Diagnosis for</p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
        {title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <IssueTag label={vehicle.issue} icon={Wrench} variant="orange" className="max-w-[36rem]" />

        <Badge variant="default">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          {sourceCount} forum {sourceCount === 1 ? "source" : "sources"}
        </Badge>

        {synthesisAvailable ? (
          <Badge variant="green">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            AI guide ready
          </Badge>
        ) : (
          <Badge variant="red">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            AI synthesis unavailable
          </Badge>
        )}

        {demo && (
          <Badge variant="amber">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            Sample data
          </Badge>
        )}

        {cached && (
          <Badge variant="blue">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {stale ? "Cached · refreshing" : "Cached result"}
          </Badge>
        )}
      </div>
    </motion.header>
  );
}
