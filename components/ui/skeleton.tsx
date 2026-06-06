import * as React from "react";
import { cn } from "@/lib/utils";

/** Shimmering placeholder block (uses the .shimmer overlay from globals.css). */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-elevated/80", className)}
      {...props}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}

export { Skeleton };
