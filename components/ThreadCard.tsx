"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wrench, CalendarDays, ExternalLink } from "lucide-react";
import type { ThreadResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ThreadCardProps {
  thread: ThreadResult;
  index?: number;
}

export function ThreadCard({ thread, index = 0 }: ThreadCardProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const host = thread.source.split("/")[0];
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;

  return (
    <motion.a
      href={thread.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.6), ease: "easeOut" }}
      className="group block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent-orange/40 hover:bg-elevated"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-[5px] bg-elevated">
            {faviconFailed ? (
              <Wrench className="h-3 w-3 text-secondary" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl}
                alt=""
                width={16}
                height={16}
                loading="lazy"
                onError={() => setFaviconFailed(true)}
                className="h-4 w-4"
              />
            )}
          </span>
          <Badge variant="default" className="truncate">
            {thread.forumName}
          </Badge>
        </span>
        {thread.date && (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-secondary">
            <CalendarDays className="h-3 w-3" aria-hidden />
            {thread.date}
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium leading-snug text-primary transition-colors group-hover:text-accent-orange">
        {thread.title}
      </h3>

      {thread.snippet && (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-secondary">
          {thread.snippet}
        </p>
      )}

      <div className="mt-3 flex items-center gap-1 font-mono text-[11px] text-secondary/70 transition-colors group-hover:text-accent-orange/80">
        <span className="truncate">{host}</span>
        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
      </div>
    </motion.a>
  );
}
