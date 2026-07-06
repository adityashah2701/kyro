"use client";

import { motion } from "framer-motion";
import { Globe, Lock, RefreshCw, Zap } from "lucide-react";

const features = [
  {
    title: "Instant Deployments",
    description: "Deploy in seconds.",
    icon: Zap,
    className: "md:col-span-2",
  },
  {
    title: "Custom Domains",
    description: "One-click SSL.",
    icon: Globe,
    className: "md:col-span-1",
  },
  {
    title: "Environment Variables",
    description: "Encrypted by default.",
    icon: Lock,
    className: "md:col-span-1",
  },
  {
    title: "Instant Rollbacks",
    description: "Zero downtime.",
    icon: RefreshCw,
    className: "md:col-span-2",
  },
];

export function Features() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Everything you need.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`group relative overflow-hidden rounded-3xl border bg-card p-8 transition-all hover:shadow-xl hover:shadow-brand/5 dark:hover:shadow-brand/10 ${feature.className}`}
          >
            <div className="absolute inset-0 bg-linear-to-br from-brand/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand mb-6">
              <feature.icon className="size-6" />
            </div>

            <h3 className="relative z-10 mb-1 text-2xl font-semibold text-foreground">
              {feature.title}
            </h3>

            <p className="relative z-10 text-lg text-muted-foreground">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
