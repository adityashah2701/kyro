"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Rocket, Globe, Settings, Shield } from "lucide-react";

interface ProjectSubnavProps {
  projectId: string;
}

export function ProjectSubnav({ projectId }: ProjectSubnavProps) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  const navItems = [
    {
      name: "Overview",
      href: basePath,
      icon: LayoutDashboard,
      isActive: pathname === basePath,
    },
    {
      name: "Deployments",
      href: `${basePath}/deployments`,
      icon: Rocket,
      isActive: pathname.startsWith(`${basePath}/deployments`),
    },
    {
      name: "Domains",
      href: `${basePath}/domains`,
      icon: Globe,
      isActive: pathname.startsWith(`${basePath}/domains`),
    },
    {
      name: "Environment Variables",
      href: `${basePath}/env`,
      icon: Shield,
      isActive: pathname.startsWith(`${basePath}/env`),
    },
    {
      name: "Settings",
      href: `${basePath}/settings`,
      icon: Settings,
      isActive: pathname.startsWith(`${basePath}/settings`),
    },
  ];

  return (
    <div className="border-b border-border mb-8">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              item.isActive
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground",
              "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors"
            )}
          >
            <item.icon
              className={cn(
                item.isActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
                "-ml-0.5 mr-2 h-4 w-4"
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
