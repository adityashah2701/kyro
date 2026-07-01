import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, links). */
  action?: React.ReactNode;
}

/**
 * Consistent section heading (title + optional description + optional action).
 * Standardizes the "section title" level of the typographic hierarchy so every
 * page renders sub-sections identically.
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn("flex items-end justify-between gap-4", className)}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
}

/** A vertically-spaced section: header followed by content. */
export function Section({
  title,
  description,
  action,
  className,
  children,
  ...props
}: SectionHeaderProps) {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      <SectionHeader title={title} description={description} action={action} />
      {children}
    </section>
  );
}
