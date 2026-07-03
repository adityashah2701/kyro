"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  FolderOpen,
  MoreVertical,
  Globe,
  Lock,
  Trash2,
  Archive,
  Edit,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { deleteProject, archiveProject } from "../actions";

export interface ProjectCardProps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  framework: string;
  visibility: string;
  status: string;
  updatedAt: Date;
  onEdit?: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
} as const;

export function ProjectCard({
  id,
  name,
  slug,
  description,
  framework,
  visibility,
  status,
  updatedAt,
  onEdit,
}: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      setIsDeleting(true);
      const res = await deleteProject(id);
      if (res?.error) {
        toast.error(res.error);
        setIsDeleting(false);
      } else {
        toast.success("Project deleted successfully");
      }
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    const res = await archiveProject(id);
    if (res?.error) {
      toast.error(res.error);
      setIsArchiving(false);
    } else {
      toast.success("Project archived successfully");
    }
  };

  if (status === "archived") {
    // Optionally return null or an archived version of the card
    return null;
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="group relative flex h-full flex-col overflow-hidden ring-foreground/10 transition-all hover:ring-brand/40">
        <Link
          href={`/projects/${id}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${name}`}
        />

        <CardHeader className="flex flex-row items-start justify-between pb-2 z-10 pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="pointer-events-auto flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <FolderOpen className="size-4" />
              </div>
              <CardTitle className="text-base pointer-events-auto hover:underline relative">
                <Link href={`/projects/${id}`}>{name}</Link>
              </CardTitle>
              {visibility === "private" ? (
                <Lock className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Globe className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <CardDescription className="text-xs truncate max-w-[200px] mt-1">
              {slug}
            </CardDescription>
          </div>

          <div className="pointer-events-auto relative z-20">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 -mr-2">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Project
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex-1 mt-2 z-10 pointer-events-none">
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {description}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between z-10 pointer-events-none mt-auto pt-4 border-t border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal">
              {framework}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
