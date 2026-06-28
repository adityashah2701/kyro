/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput } from "../schemas";
import { createProject } from "../actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FRAMEWORKS = [
  "Next.js",
  "React",
  "Vue",
  "Nuxt",
  "Svelte",
  "Astro",
  "Remix",
  "Angular",
  "Other",
];

export function CreateProjectModal({
  open,
  onOpenChange,
}: CreateProjectModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      framework: "Next.js",
      visibility: "private",
    },
  });

  // Auto-generate slug when name changes (if slug hasn't been manually edited)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setValue("name", newName);

    if (!slugTouched && newName) {
      const generatedSlug = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateProjectInput) => {
    setIsPending(true);

    // Using a random string for global uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const finalData = { ...data, slug: `${data.slug}-${randomSuffix}` };

    const result = await createProject(finalData);

    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Project created successfully");
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isPending) onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Deploy your new project in seconds. Fill out the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="My awesome app"
              {...register("name", { onChange: handleNameChange })}
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-[0.8rem] text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="my-awesome-app"
              {...register("slug", {
                onChange: () => setSlugTouched(true),
              })}
              disabled={isPending}
            />
            {errors.slug && (
              <p className="text-[0.8rem] text-destructive">
                {errors.slug.message}
              </p>
            )}
            <p className="text-[0.8rem] text-muted-foreground">
              A random suffix will be appended to ensure global uniqueness.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="framework">Framework</Label>
            <Select
              onValueChange={(val) =>
                setValue("framework", val ?? "Loading...")
              }
              defaultValue={watch("framework")}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a framework" />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map((fw) => (
                  <SelectItem key={fw} value={fw}>
                    {fw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.framework && (
              <p className="text-[0.8rem] text-destructive">
                {errors.framework.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this project about?"
              {...register("description")}
              disabled={isPending}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-[0.8rem] text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
