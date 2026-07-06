import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Presentational terminal shell: a dark, rounded container with an optional
 * sticky header (toolbar) and a monospace body. Behaviour (streaming, search,
 * auto-scroll, virtualization) is layered on by consumers such as LogTerminal.
 */
function Terminal({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="terminal"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg bg-black text-xs ring-1 ring-white/15",
        className
      )}
      {...props}
    />
  );
}

function TerminalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="terminal-header"
      className={cn(
        "sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#111] px-3 py-2",
        className
      )}
      {...props}
    />
  );
}

function TerminalBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="terminal-body"
      className={cn(
        "min-h-0 flex-1 overflow-auto font-mono leading-relaxed text-white/90 bg-black p-1",
        className
      )}
      {...props}
    />
  );
}

export { Terminal, TerminalHeader, TerminalBody };
