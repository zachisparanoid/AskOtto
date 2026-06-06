import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-elevated text-secondary",
        orange: "border-accent-orange/30 bg-accent-orange/10 text-accent-orange",
        amber: "border-accent-amber/30 bg-accent-amber/10 text-accent-amber",
        green: "border-accent-green/30 bg-accent-green/10 text-accent-green",
        red: "border-accent-red/30 bg-accent-red/10 text-accent-red",
        blue: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
        outline: "border-border bg-transparent text-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
