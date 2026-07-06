"use client";

import { useState } from "react";
import { signIn } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn.social({ provider: "github", callbackURL: "/dashboard" });
    } catch {
      setError("Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Form Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col space-y-2 text-center lg:text-left"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-[13px] text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Action */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <Button
          size="lg"
          className="group relative h-12 w-full overflow-hidden rounded-xl bg-[#24292F] text-white hover:bg-[#24292F]/90 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all active:scale-[0.98]"
          onClick={handleGitHubLogin}
          disabled={isLoading}
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            {isLoading ? (
              <Loader2 className="size-5 animate-spin opacity-70" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="size-5 fill-current transition-transform duration-300 group-hover:scale-110"
                aria-hidden="true"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"></path>
              </svg>
            )}
            <span className="font-medium text-[15px]">
              {isLoading ? "Signing in..." : "Continue with GitHub"}
            </span>
          </div>
        </Button>

        <p className="mt-8 text-center text-[13px] text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Privacy Policy
          </a>
          .
        </p>
      </motion.div>
    </div>
  );
}
