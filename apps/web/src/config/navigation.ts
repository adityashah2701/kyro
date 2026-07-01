import {
  LayoutDashboard,
  FolderOpen,
  Rocket,
  Globe,
  Settings,
  Activity,
  TerminalSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Short label used in the collapsed sidebar tooltip / command palette. */
  keywords?: string[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Single source of truth for primary navigation. Consumed by the desktop
 * sidebar, the mobile nav drawer, and the command palette so they never drift.
 */
export const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Projects", href: "/projects", icon: FolderOpen },
      { name: "Deployments", href: "/deployments", icon: Rocket },
    ],
  },
  {
    label: "Configuration",
    items: [
      { name: "Domains", href: "/domains", icon: Globe },
      {
        name: "Environment Variables",
        href: "/env",
        icon: TerminalSquare,
        keywords: ["env", "secrets"],
      },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Activity", href: "/activity", icon: Activity },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** Flat list of all nav items (handy for the command palette). */
export const navItems: NavItem[] = navSections.flatMap((s) => s.items);
