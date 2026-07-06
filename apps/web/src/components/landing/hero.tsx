"use client";

import Image from "next/image";
import { Terminal } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 sm:pt-15 sm:pb-20">
      <div className="flex flex-col items-start text-left max-w-4xl mb-5">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-xl font-bold tracking-tighter text-foreground sm:text-2xl lg:text-4xl leading-0"
        >
          Deployments, mastered.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-6 text-md tracking-widest text-muted-foreground sm:text-xl leading-relaxed max-w-2xl"
        >
          Push to Git. We build and deploy instantly.
        </motion.p>
      </div>

      {/* Massive Mockup Preview Area */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        className="w-full"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-b-0 bg-card shadow-2xl">
          {/* Faux window header */}
          <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-yellow-500/80" />
            <div className="size-3 rounded-full bg-green-500/80" />
          </div>
          <div className="relative h-[calc(100%-49px)] w-full">
            <Image
              src="/Images/kyro-light.png"
              alt="Kyro Dashboard Light Mode"
              fill
              className="dark:hidden object-cover object-top"
              priority
            />
            <Image
              src="/Images/kyro-dark.png"
              alt="Kyro Dashboard Dark Mode"
              fill
              className="hidden dark:block object-cover object-top"
              priority
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
