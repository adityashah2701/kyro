"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 flex h-full w-full justify-center overflow-hidden">
      {/* Subtle grid background with fade out at bottom */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]opacity-20" />

      {/* Ambient glows */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-[-20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand/20 blur-[100px]"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-info/10 blur-[80px]"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2, delay: 0.7 }}
        className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-brand/10 blur-[100px]"
      />
    </div>
  );
}
