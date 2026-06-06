import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={ariaInvalid}
      className={cn(
        "h-12 w-full rounded-xl border border-border bg-elevated px-4 text-sm text-primary transition-colors",
        "placeholder:text-secondary/60",
        "focus:border-accent-orange/70 focus:outline-none focus:ring-1 focus:ring-accent-orange/40",
        "aria-[invalid=true]:border-accent-red/70 aria-[invalid=true]:focus:ring-accent-red/40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
