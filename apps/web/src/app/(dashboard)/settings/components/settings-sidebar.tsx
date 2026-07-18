"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings,
  GitBranch,
  TerminalSquare,
  Rocket,
  Globe,
  Lock,
  Activity,
  Blocks,
  Shield,
  Users,
  Sliders,
  ScrollText,
} from "lucide-react";

interface SettingsSidebarProps {
  projectId: string;
}

export function SettingsSidebar({ projectId }: SettingsSidebarProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "general";

  const navItems = [
    { name: "General", id: "general", icon: Settings },
    { name: "Git", id: "git", icon: GitBranch },
    { name: "Build & Runtime", id: "build", icon: TerminalSquare },
    { name: "Deployment", id: "deployment", icon: Rocket },
    { name: "Domains", id: "domains", icon: Globe },
    { name: "Environment Variables", id: "env", icon: Lock },
    { name: "Analytics", id: "analytics", icon: Activity },
    { name: "Integrations", id: "integrations", icon: Blocks },
    { name: "Security", id: "security", icon: Shield },
    { name: "Team", id: "team", icon: Users },
    { name: "Logs", id: "logs", icon: ScrollText },
    { name: "Advanced", id: "advanced", icon: Sliders },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={`?projectId=${projectId}&tab=${item.id}`}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
