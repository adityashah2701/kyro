import * as React from "react";
import { cn } from "@/lib/utils";

interface SettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  danger?: boolean;
  layout?: "row" | "column";
}

export function SettingsCard({
  title,
  description,
  children,
  className,
  danger,
  layout = "row",
  ...props
}: SettingsCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border shadow-sm overflow-hidden transition-all",
        danger
          ? "border-destructive/30 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10"
          : "border-border/40 bg-card/40 hover:border-border/60 hover:bg-card/60",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex gap-6 p-6",
          layout === "column"
            ? "flex-col"
            : "flex-col lg:flex-row justify-between"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-1.5 shrink-0",
            layout === "row" && "lg:max-w-[45%]"
          )}
        >
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {description && (
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-full flex flex-col gap-5 justify-center",
            layout === "row" && "lg:pl-6"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SettingsCardFooter({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-muted/30 px-6 py-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}
