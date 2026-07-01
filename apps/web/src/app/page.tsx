import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      {/* Subtle grid + brand glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[32px_32px] opacity-60 mask-[radial-gradient(ellipse_60%_50%_at_50%_40%,#000_60%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 size-112 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl"
      />

      <main className="relative z-10 flex w-full max-w-2xl flex-col items-center p-8 text-center sm:p-16">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Rocket className="size-3.5 text-brand" />
          Deploy from Git in seconds
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Kyro Deployment Platform
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          Connect a repository, and Kyro builds, deploys, and serves it — with
          custom domains, encrypted env vars, and instant rollbacks.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-11"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Get started
            <ArrowRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Open dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
