"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Rocket,
  Globe,
  Settings,
  Activity,
  TerminalSquare,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Deployments", href: "/deployments", icon: Rocket },
  { name: "Domains", href: "/domains", icon: Globe },
  {
    name: "Environment Variables",
    href: "/settings/env",
    icon: TerminalSquare,
  },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r bg-background md:block md:w-64 shrink-0 transition-all duration-300">
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-14 items-center border-b px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <span className="text-lg tracking-tight">Kyro</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-4 py-2">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    buttonVariants({
                      variant: isActive ? "secondary" : "ghost",
                    }),
                    "w-full justify-start gap-3 px-3 transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="mt-auto p-4">
          <Separator className="mb-4" />
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-sm">Documentation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
