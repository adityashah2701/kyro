"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Check, ChevronsUpDown, Globe, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
            className="w-[260px] justify-between h-9 px-2 hover:bg-accent border-none font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2 truncate">
              {selectedProject ? (
                <>
                  <Avatar className="size-5 shrink-0 rounded-sm">
                    <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[10px] font-semibold">
                      {selectedProject.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selectedProject.name}</span>
                </>
              ) : (
                <>
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <Globe className="size-3.5" />
                  </div>
                  <span className="truncate">All Projects</span>
                </>
              )}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground opacity-50" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="start"
        className="w-[400px] p-0 shadow-lg rounded-xl overflow-hidden"
      >
        <Command>
          <CommandInput
            placeholder="Search project..."
            onKeyDown={(e) => e.stopPropagation()}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup heading="Projects">
              <CommandItem
                onSelect={() => onSelect(null)}
                className="text-sm cursor-pointer py-1.5 justify-between"
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary mr-2">
                  <Globe className="size-3.5" />
                </div>
                <span className="truncate font-medium">All Projects</span>
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    !currentProjectId ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => onSelect(project.id)}
                  className="text-sm cursor-pointer py-1.5"
                >
                  <Avatar className="size-5 shrink-0 rounded-sm mr-2">
                    <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[10px] font-semibold">
                      {project.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">{project.name}</span>
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
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  router.push("/projects/new");
                }}
                className="text-sm cursor-pointer py-1.5"
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground mr-2">
                  <Plus className="size-3.5" />
                </div>
                <span className="font-medium text-muted-foreground">
                  Create Project
                </span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
