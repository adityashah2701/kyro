"use client";

import { MotionConfig } from "framer-motion";

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
        <MotionConfig reducedMotion="user">
          <TooltipProvider>{children}</TooltipProvider>
        </MotionConfig>
        <Toaster position="bottom-right" richColors closeButton />
      </QueryProvider>
    </ThemeProvider>
  );
}
