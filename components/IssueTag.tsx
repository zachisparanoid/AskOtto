import type { LucideIcon } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IssueTagProps {
  label: string;
  icon?: LucideIcon;
  variant?: BadgeProps["variant"];
  className?: string;
}

/** Pill tag for an issue / category, with optional leading icon. */
export function IssueTag({ label, icon: Icon, variant = "orange", className }: IssueTagProps) {
  return (
    <Badge variant={variant} className={cn("max-w-full", className)}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      <span className="truncate">{label}</span>
    </Badge>
  );
}
