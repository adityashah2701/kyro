"use client";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
      </QueryProvider>
    </ThemeProvider>
  );
}
