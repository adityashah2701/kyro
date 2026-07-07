"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Check, ChevronsUpDown, FolderOpen, Globe } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Project = {
  id: string;
  name: string;
  slug: string;
};

export function ProjectSwitcher({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const currentProjectId = searchParams.get("projectId");
  const selectedProject = projects.find((p) => p.id === currentProjectId);

  const onSelect = (projectId: string | null) => {
    setOpen(false);
    const params = new URLSearchParams(searchParams);
    if (projectId) {
      params.set("projectId", projectId);
    } else {
      params.delete("projectId");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between h-8 px-2 hover:bg-muted/50 border-none font-medium"
          >
            <span className="flex items-center gap-2 truncate">
              {selectedProject ? (
                <>
                  <FolderOpen className="size-4 shrink-0" />
                  <span className="truncate">{selectedProject.name}</span>
                </>
              ) : (
                <>
                  <Globe className="size-4 shrink-0" />
                  <span className="truncate">All Projects</span>
                </>
              )}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      ></DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] p-0">
        <Command>
          <CommandInput
            placeholder="Search project..."
            onKeyDown={(e) => e.stopPropagation()}
          />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => onSelect(null)}
                className="text-sm cursor-pointer"
              >
                <Globe className="mr-2 size-4 text-muted-foreground" />
                All Projects
                <Check
                  className={cn(
                    "ml-auto size-4",
                    !currentProjectId ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => onSelect(project.id)}
                  className="text-sm cursor-pointer"
                >
                  <FolderOpen className="mr-2 size-4 text-muted-foreground" />
                  <span className="truncate">{project.name}</span>
                  <Check
                    className={cn(
                      "ml-auto size-4 shrink-0",
                      currentProjectId === project.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
