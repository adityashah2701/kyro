"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { ProjectCard } from "@/features/projects/components/project-card";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { motion } from "framer-motion";
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function ProjectsClient({
  initialProjects,
  searchQuery,
  currentSort,
}: ProjectsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Projects"
        description="Manage and monitor all your deployed projects."
      >
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </PageHeader>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9 bg-background"
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 w-full sm:w-auto">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Sort By
            </DropdownMenuTrigger>
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
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50 duration-500 bg-muted/10">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query."
                : "You haven't created any projects yet. Start by creating a new project."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {initialProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              onEdit={() => console.log("Edit project", project.id)}
            />
          ))}
        </motion.div>
      )}

      <CreateProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
