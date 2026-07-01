import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard page shell. Replaces the `p-6 sm:p-10 max-w-6xl mx-auto` wrapper that
 * was copy-pasted across every page, giving all pages identical padding, max
 * width, and centering. Ultra-wide friendly via the shared max width.
 */
export function PageContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
