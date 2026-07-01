"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  /** Accessible label + tooltip text. */
  label?: string;
  /** Toast shown on copy; pass null to suppress. */
  toastMessage?: string | null;
  className?: string;
  size?: "icon-xs" | "icon-sm" | "icon";
  disabled?: boolean;
}

/**
 * Copy-to-clipboard button with an animated check micro-interaction and toast.
 * Consolidates the several hand-rolled copy handlers scattered across the
 * deployment table, domains, and env tabs.
 */
export function CopyButton({
  value,
  label = "Copy",
  toastMessage = "Copied to clipboard",
  className,
  size = "icon-sm",
  disabled,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  React.useEffect(() => () => clearTimeout(timeout.current), []);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (toastMessage) toast.success(toastMessage);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  }, [value, toastMessage]);

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={handleCopy}
      disabled={disabled}
      aria-label={copied ? "Copied" : label}
      title={label}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex"
          >
            <Check className="size-3.5 text-success" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex"
          >
            <Copy className="size-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
