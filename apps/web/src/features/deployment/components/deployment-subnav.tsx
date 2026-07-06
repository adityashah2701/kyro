"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * URL-addressable sub-navigation for a single deployment.
 */
export function DeploymentSubnav({ deploymentId }: { deploymentId: string }) {
  const pathname = usePathname();
  const base = `/deployments/${deploymentId}`;

  const items = [
    { href: base, label: "Overview", icon: LayoutDashboard },
    { href: `${base}/logs`, label: "Build Logs", icon: ScrollText },
  ];

  return (
    <nav className="flex items-center gap-2 border-b overflow-x-auto scrollbar-none">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
