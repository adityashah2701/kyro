"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 px-6 py-20 text-center shadow-2xl dark:bg-card sm:px-16 sm:py-24"
      >
        {/* Background glow effects */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-brand/20 via-zinc-950 to-zinc-950 dark:via-card dark:to-card" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-[80%] rounded-full bg-brand/30 blur-[80px]" />

        <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Start deploying today.
        </h2>

        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button
            size="lg"
            className="h-12 bg-white text-zinc-950 hover:bg-zinc-200 px-8 text-base font-semibold group dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Start for free
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
