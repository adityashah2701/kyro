"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsCard, SettingsCardFooter } from "../settings-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateProject } from "@/features/projects/actions";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  framework?: string | null;
  buildCommand?: string | null;
  installCommand?: string | null;
  outputDirectory?: string | null;
  rootDirectory?: string | null;
}

interface BuildTabProps {
  projectData: ProjectData;
}

export function BuildTab({ projectData }: BuildTabProps) {
  const [loading, setLoading] = useState<string | null>(null);

  // Local state for switches
  const [overrideBuild, setOverrideBuild] = useState(
    !!projectData.buildCommand
  );
  const [overrideInstall, setOverrideInstall] = useState(
    !!projectData.installCommand
  );

  const handleSave = async (formData: FormData, fieldName: string) => {
    setLoading(fieldName);

    const dataToUpdate: Parameters<typeof updateProject>[0] = {
      id: projectData.id,
    };

    if (fieldName === "framework") {
      dataToUpdate.framework = formData.get("framework") as string;
    } else if (fieldName === "commands") {
      dataToUpdate.buildCommand = overrideBuild
        ? (formData.get("buildCommand") as string)
        : undefined;
      dataToUpdate.installCommand = overrideInstall
        ? (formData.get("installCommand") as string)
        : undefined;
    } else if (fieldName === "directories") {
      dataToUpdate.outputDirectory =
        (formData.get("outputDirectory") as string) || undefined;
      dataToUpdate.rootDirectory =
        (formData.get("rootDirectory") as string) || "/";
    }

    const res = await updateProject(dataToUpdate);
    setLoading(null);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Settings updated successfully");
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <form action={(fd) => handleSave(fd, "framework")}>
        <SettingsCard
          title="Framework Preset"
          description="We automatically detect the framework based on your package.json. You can override it here."
        >
          <div className="w-full md:max-w-md">
            <select
              name="framework"
              defaultValue={projectData.framework || "nextjs"}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="nextjs">Next.js</option>
              <option value="react">React (Vite)</option>
              <option value="vue">Vue</option>
              <option value="svelte">SvelteKit</option>
              <option value="node">Node.js</option>
            </select>
          </div>
          <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
            <span className="text-[13px] text-muted-foreground">
              Changes to the framework will apply to future deployments.
            </span>
            <Button
              type="submit"
              disabled={loading === "framework"}
              size="sm"
              className="h-8"
            >
              {loading === "framework" ? "Saving..." : "Save"}
            </Button>
          </SettingsCardFooter>
        </SettingsCard>
      </form>

      <form action={(fd) => handleSave(fd, "commands")}>
        <SettingsCard
          title="Build & Install Commands"
          description="Configure the commands used to install dependencies and build your project."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Build Command
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={overrideBuild}
                  onCheckedChange={setOverrideBuild}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Override
                </span>
              </div>
              <Input
                name="buildCommand"
                defaultValue={projectData.buildCommand || "npm run build"}
                disabled={!overrideBuild}
                className="bg-background/50 h-10 font-mono text-sm shadow-sm mt-1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Install Command
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={overrideInstall}
                  onCheckedChange={setOverrideInstall}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Override
                </span>
              </div>
              <Input
                name="installCommand"
                defaultValue={projectData.installCommand || "npm install"}
                disabled={!overrideInstall}
                className="bg-background/50 h-10 font-mono text-sm shadow-sm mt-1"
              />
            </div>
          </div>
          <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
            <span className="text-[13px] text-muted-foreground">
              Leave the override disabled to use default commands based on your
              framework.
            </span>
            <Button
              type="submit"
              disabled={loading === "commands"}
              size="sm"
              className="h-8"
            >
              {loading === "commands" ? "Saving..." : "Save"}
            </Button>
          </SettingsCardFooter>
        </SettingsCard>
      </form>

      <form action={(fd) => handleSave(fd, "directories")}>
        <SettingsCard
          title="Directories"
          description="Specify the directories used for your project source and build output."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Output Directory
              </Label>
              <Input
                name="outputDirectory"
                defaultValue={projectData.outputDirectory || ".next"}
                className="bg-background/50 h-10 font-mono text-sm shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Root Directory
              </Label>
              <Input
                name="rootDirectory"
                defaultValue={projectData.rootDirectory || "/"}
                placeholder="/"
                className="bg-background/50 h-10 font-mono text-sm shadow-sm"
              />
            </div>
          </div>
          <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
            <span className="text-[13px] text-muted-foreground">
              The root directory is the base directory of your project. Output
              directory is relative to the root.
            </span>
            <Button
              type="submit"
              disabled={loading === "directories"}
              size="sm"
              className="h-8"
            >
              {loading === "directories" ? "Saving..." : "Save"}
            </Button>
          </SettingsCardFooter>
        </SettingsCard>
      </form>

      <SettingsCard
        title="Runtime Configuration"
        description="Configure the environment running your application."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Node.js Version
            </Label>
            <Select disabled defaultValue="20.x">
              <SelectTrigger className="bg-background/50 h-10">
                <SelectValue placeholder="Select Node.js version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20.x">20.x</SelectItem>
                <SelectItem value="18.x">18.x</SelectItem>
                <SelectItem value="16.x">16.x (Deprecated)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Package Manager
            </Label>
            <Select disabled defaultValue="npm">
              <SelectTrigger className="bg-background/50 h-10">
                <SelectValue placeholder="Select package manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="npm">npm</SelectItem>
                <SelectItem value="yarn">Yarn</SelectItem>
                <SelectItem value="pnpm">pnpm</SelectItem>
                <SelectItem value="bun">Bun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
