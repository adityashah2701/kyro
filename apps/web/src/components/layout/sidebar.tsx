/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navSections, type NavItem } from "@/config/navigation";

const STORAGE_KEY = "kyro:sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  // Restore persisted collapse state on mount (client-only to avoid hydration mismatch).
  React.useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "hidden shrink-0 border-r bg-sidebar transition-[width] duration-200 ease-in-out md:block",
        collapsed ? "md:w-[4.25rem]" : "md:w-64"
      )}
    >
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Brand */}
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 font-semibold",
              collapsed && "w-full justify-center"
            )}
            aria-label="Kyro home"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground">
              K
            </span>
            {!collapsed && <span className="text-lg tracking-tight">Kyro</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[0.68rem] font-medium tracking-wider text-muted-foreground uppercase">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)
                  }
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: docs + collapse toggle */}
        <div className="flex flex-col gap-1 border-t p-3">
          <NavLink
            item={{ name: "Documentation", href: "/docs", icon: BookOpen }}
            collapsed={collapsed}
            active={false}
          />
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              collapsed ? "mx-auto" : "justify-start gap-3 px-3"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-sm transition-colors",
        collapsed ? "size-11 justify-center" : "gap-3 px-3 py-2",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {/* Brand active indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand" />
      )}
      <item.icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.name}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.name}</TooltipContent>
    </Tooltip>
  );
}
