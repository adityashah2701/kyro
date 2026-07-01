import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Primary CTA, e.g. a <Button>. */
  action?: React.ReactNode;
  /** Optional secondary CTA rendered next to the primary one. */
  secondaryAction?: React.ReactNode;
  /** Render inside a dashed card (default) or bare (for use inside existing cards). */
  bordered?: boolean;
}

/**
 * A consistent, beautiful empty state used across every page: a soft icon badge,
 * a title, helper text, and up to two CTAs. Replaces the ad-hoc empty blocks
 * that were missing icons (`mt-4` with nothing above it) throughout the app.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  bordered = true,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        bordered && "rounded-xl border border-dashed bg-muted/20",
        className
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
