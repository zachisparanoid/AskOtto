import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={ariaInvalid}
      className={cn(
        "min-h-[7rem] w-full resize-none rounded-xl border border-border bg-elevated px-4 py-3 text-sm leading-relaxed text-primary transition-colors",
        "placeholder:text-secondary/60",
        "focus:border-accent-orange/70 focus:outline-none focus:ring-1 focus:ring-accent-orange/40",
        "aria-[invalid=true]:border-accent-red/70 aria-[invalid=true]:focus:ring-accent-red/40",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
