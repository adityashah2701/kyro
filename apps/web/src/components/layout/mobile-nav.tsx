"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { navSections } from "@/config/navigation";

/**
 * Mobile navigation drawer. Previously the header's hamburger button had no
 * handler, so there was *no navigation at all* below the `md` breakpoint. This
 * wires that button to a Sheet drawer that reuses the shared nav config.
 */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="h-14 flex-row items-center border-b px-6">
          <SheetTitle className="text-lg tracking-tight">Kyro</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-5 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-[0.68rem] font-medium tracking-wider text-muted-foreground uppercase">
                {section.label}
              </p>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
