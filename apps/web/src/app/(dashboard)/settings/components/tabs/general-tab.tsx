"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsCard, SettingsCardFooter } from "../settings-card";
import { updateProject } from "@/features/projects/actions";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  createdAt: Date;
}

interface GeneralTabProps {
  projectData: ProjectData;
}

export function GeneralTab({ projectData }: GeneralTabProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSave = async (
    formData: FormData,
    field: "name" | "slug" | "visibility"
  ) => {
    setLoading(field);
    const value = formData.get(field) as string;

    const dataToUpdate = {
      id: projectData.id,
      [field]: value,
    };

    const res = await updateProject(dataToUpdate);
    setLoading(null);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Project ${field} updated successfully`);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <form action={(fd) => handleSave(fd, "name")}>
        <SettingsCard
          title="Project Name"
          description="Used to identify your project on the Dashboard, CLI, and in the URL."
        >
          <Input
            key={`name-${projectData.name}`}
            name="name"
            defaultValue={projectData.name}
            className="bg-background/50 h-10 shadow-sm w-full md:max-w-md"
            required
            maxLength={64}
          />
          <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
            <span className="text-[13px] text-muted-foreground">
              A maximum of 64 characters.
            </span>
            <Button
              type="submit"
              disabled={loading === "name"}
              size="sm"
              className="h-8"
            >
              {loading === "name" ? "Saving..." : "Save"}
            </Button>
          </SettingsCardFooter>
        </SettingsCard>
      </form>

      <form action={(fd) => handleSave(fd, "slug")}>
        <SettingsCard
          title="Project Slug"
          description="The unique identifier for your project. This will be used in your default kyro.app domain."
        >
          <div className="flex items-center gap-2 w-full md:max-w-md">
            <div className="bg-muted px-3 h-10 flex items-center justify-center rounded-l-md border border-r-0 border-input text-sm text-muted-foreground">
              kyro.app/
            </div>
            <Input
              key={`slug-${projectData.slug}`}
              name="slug"
              defaultValue={projectData.slug}
              className="bg-background/50 h-10 rounded-l-none font-mono text-[13px] shadow-sm flex-1"
              required
              maxLength={64}
              pattern="[a-z0-9-]+"
            />
          </div>
          <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
            <span className="text-[13px] text-muted-foreground">
              Lowercase letters, numbers, and hyphens only.
            </span>
            <Button
              type="submit"
              disabled={loading === "slug"}
              size="sm"
              className="h-8"
            >
              {loading === "slug" ? "Saving..." : "Save"}
            </Button>
          </SettingsCardFooter>
        </SettingsCard>
      </form>

      <SettingsCard
        title="Project Icon"
        description="Update your project's icon to make it easier to identify."
      >
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl shrink-0">
            {projectData.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col gap-2 w-full md:max-w-md">
            <Input
              type="file"
              disabled
              className="h-10 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              An image of at least 256x256 pixels.
            </p>
          </div>
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            Feature coming soon.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

      <form action={(fd) => handleSave(fd, "visibility")}>
        <SettingsCard
          title="Visibility"
          description="Control who can view this project. Public projects are visible to anyone on the internet."
        >
          <div className="flex flex-col gap-2 w-full md:max-w-md">
            <select
              key={`visibility-${projectData.visibility}`}
              name="visibility"
              defaultValue={projectData.visibility}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
            <span className="text-[13px] text-muted-foreground">
              Caution: changing to public exposes your project to the world.
            </span>
            <Button
              type="submit"
              disabled={loading === "visibility"}
              size="sm"
              className="h-8"
            >
              {loading === "visibility" ? "Saving..." : "Save"}
            </Button>
          </SettingsCardFooter>
        </SettingsCard>
      </form>

      <SettingsCard
        title="Project Metadata"
        description="Useful information about this project."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Project ID
            </Label>
            <div className="font-mono text-sm">{projectData.id}</div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Created Date
            </Label>
            <div className="text-sm">
              {new Date(projectData.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
