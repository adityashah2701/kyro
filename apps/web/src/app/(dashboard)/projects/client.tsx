/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Rows3,
  FolderOpen,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { staggerContainer } from "@/lib/motion";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectWizardDialog } from "@/features/projects/components/wizard/project-wizard-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  framework: string;
  visibility: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectsClientProps {
  initialProjects: Project[];
  searchQuery: string;
  currentSort: string;
}

type ViewMode = "grid" | "list";

export function ProjectsClient({
  initialProjects,
  searchQuery,
  currentSort,
}: ProjectsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");

  // Restore persisted view preference.
  useEffect(() => {
    const saved = localStorage.getItem("kyro:projects-view");
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  // Open the create modal when navigated to with `?new=1` (e.g. from the
  // command palette), then clean the URL.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setIsModalOpen(true);
      const params = new URLSearchParams(searchParams);
      params.delete("new");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router]);

  const setViewMode = (mode: ViewMode) => {
    setView(mode);
    localStorage.setItem("kyro:projects-view", mode);
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    if (sort !== "newest") {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage and monitor all your deployed projects."
      >
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="size-4" />
          New Project
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            className="h-9 pl-9"
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search projects"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex items-center rounded-lg border p-0.5"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                view === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                view === "list"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Rows3 className="size-4" />
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="size-4" />
                  Sort
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup
                value={currentSort}
                onValueChange={handleSort}
              >
                <DropdownMenuRadioItem value="newest">
                  Recently Updated
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">
                  Oldest First
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="alphabetical">
                  Alphabetical
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {initialProjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={searchQuery ? "No matching projects" : "No projects yet"}
          description={
            searchQuery
              ? "Try adjusting your search query."
              : "Create your first project to connect a repository and start deploying."
          }
          action={
            !searchQuery && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="size-4" />
                Create Project
              </Button>
            )
          }
        />
      ) : (
        <motion.div
          key={view}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className={cn(
            "grid gap-4",
            view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}
        >
          {initialProjects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </motion.div>
      )}

      <ProjectWizardDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </PageContainer>
  );
}
