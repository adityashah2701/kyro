"use client";

import { useState } from "react";
import { signIn } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn.social({ provider: "github", callbackURL: "/dashboard" });
    } catch {
      setError("Failed to sign in with GitHub. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md shadow-xl ring-foreground/10">
      <CardHeader className="items-center space-y-3 pt-8 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-brand-foreground shadow-sm">
          K
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-2xl tracking-tight">
            Welcome to Kyro
          </CardTitle>
          <CardDescription>
            Sign in to deploy and manage your projects.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-8">
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          size="lg"
          className="h-11 w-full text-sm"
          onClick={handleGitHubLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Github className="size-4" />
          )}
          {isLoading ? "Redirecting…" : "Continue with GitHub"}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Secured with GitHub OAuth
        </p>
      </CardContent>
    </Card>
  );
}
