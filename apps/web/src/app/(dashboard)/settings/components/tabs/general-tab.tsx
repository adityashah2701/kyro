import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsCard, SettingsCardFooter } from "../settings-card";

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
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Project Name"
        description="Used to identify your project on the Dashboard, CLI, and in the URL."
      >
        <Input
          defaultValue={projectData.name}
          disabled
          className="bg-background/50 h-10 shadow-sm w-full md:max-w-md"
        />
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            Please contact support to change project name.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

      <SettingsCard
        title="Project Slug"
        description="The unique identifier for your project. This will be used in your default kyro.app domain."
      >
        <div className="flex items-center gap-2 w-full md:max-w-md">
          <div className="bg-muted px-3 h-10 flex items-center justify-center rounded-l-md border border-r-0 border-input text-sm text-muted-foreground">
            kyro.app/
          </div>
          <Input
            defaultValue={projectData.slug}
            disabled
            className="bg-background/50 h-10 rounded-l-none font-mono text-[13px] shadow-sm flex-1"
          />
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            Please contact support to change project slug.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

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

      <SettingsCard
        title="Visibility"
        description="Control who can view this project. Public projects are visible to anyone on the internet."
      >
        <div className="flex flex-col gap-2 w-full md:max-w-md">
          <Input
            defaultValue={projectData.visibility}
            disabled
            className="bg-background/50 h-10 capitalize shadow-sm"
          />
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            Visibility is locked to private for early access.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

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
