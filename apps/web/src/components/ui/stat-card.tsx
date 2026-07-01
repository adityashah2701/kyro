import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Optional sub-line under the value (e.g. a hint or trend). */
  hint?: React.ReactNode;
  /** Tint the icon with the brand accent instead of muted. */
  accent?: boolean;
}

/**
 * A single metric tile. Replaces the near-identical stat markup that was
 * duplicated in the dashboard and the project overview tab.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = false,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10 transition-colors",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {Icon && (
          <Icon
            className={cn(
              "size-4",
              accent ? "text-brand" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-2 truncate text-2xl font-semibold tracking-tight">
        {value}
      </div>
      {hint && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
