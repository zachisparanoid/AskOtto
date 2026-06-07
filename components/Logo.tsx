import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Pixel size of the icon badge. */
  size?: number;
  showWordmark?: boolean;
}

/** Wrench-spark mark + "AskOtto" wordmark. */
export function Logo({ className, size = 34, showWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex select-none items-center gap-2.5", className)}>
      <span
        className="relative grid shrink-0 place-items-center rounded-xl border border-border bg-surface"
        style={{ width: size, height: size }}
      >
        <Wrench
          className="text-accent-orange"
          style={{ width: size * 0.52, height: size * 0.52 }}
          strokeWidth={2.25}
        />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent-amber shadow-glow-amber animate-spark" />
      </span>
      {showWordmark && (
        <span className="font-display text-lg font-bold leading-none tracking-tight">
          <span className="text-primary">Ask</span>
          <span className="text-accent-orange">Otto</span>
        </span>
      )}
    </span>
  );
}
