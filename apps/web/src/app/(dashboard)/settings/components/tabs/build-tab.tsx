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

interface ProjectData {
  framework?: string | null;
}

interface BuildTabProps {
  projectData: ProjectData;
}

export function BuildTab({ projectData }: BuildTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Framework Preset"
        description="We automatically detect the framework based on your package.json. You can override it here."
      >
        <div className="w-full md:max-w-md">
          <Select disabled defaultValue={projectData.framework || "nextjs"}>
            <SelectTrigger className="bg-background/50 h-10">
              <SelectValue placeholder="Select a framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nextjs">Next.js</SelectItem>
              <SelectItem value="react">React (Vite)</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="svelte">SvelteKit</SelectItem>
              <SelectItem value="node">Node.js</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            Changes to the framework will apply to future deployments.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

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
              <Switch checked disabled />
              <span className="text-sm font-medium text-muted-foreground">
                Override
              </span>
            </div>
            <Input
              defaultValue="npm run build"
              disabled
              className="bg-background/50 h-10 font-mono text-sm shadow-sm mt-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Install Command
            </Label>
            <div className="flex items-center gap-2">
              <Switch checked disabled />
              <span className="text-sm font-medium text-muted-foreground">
                Override
              </span>
            </div>
            <Input
              defaultValue="npm install"
              disabled
              className="bg-background/50 h-10 font-mono text-sm shadow-sm mt-1"
            />
          </div>
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            Leave the override disabled to use default commands based on your
            framework.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

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
              defaultValue=".next"
              disabled
              className="bg-background/50 h-10 font-mono text-sm shadow-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Root Directory
            </Label>
            <Input
              placeholder="/"
              disabled
              className="bg-background/50 h-10 font-mono text-sm shadow-sm"
            />
          </div>
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            The root directory is the base directory of your project. Output
            directory is relative to the root.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

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
