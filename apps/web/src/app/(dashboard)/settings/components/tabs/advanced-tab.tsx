import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsCard, SettingsCardFooter } from "../settings-card";

interface ProjectData {
  id: string;
}

interface AdvancedTabProps {
  projectData: ProjectData;
}

export function AdvancedTab({ projectData }: AdvancedTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Project Configuration"
        description="Low-level identifiers and API integration details."
      >
        <div className="flex flex-col gap-5 w-full md:max-w-md">
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Project ID
            </Label>
            <Input
              defaultValue={projectData.id}
              disabled
              className="bg-background/50 h-10 font-mono text-[13px] shadow-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              API Endpoint
            </Label>
            <Input
              defaultValue={`https://api.kyro.app/v1/projects/${projectData.id}`}
              disabled
              className="bg-background/50 h-10 font-mono text-[13px] shadow-sm"
            />
          </div>
        </div>
      </SettingsCard>

      <div className="mt-8 border-t border-destructive/20 pt-8 flex flex-col gap-8">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">
          Danger Zone
        </h2>

        <SettingsCard
          danger
          title="Transfer Ownership"
          description="Transfer this project to another user or team."
        >
          <div className="w-full flex md:justify-end items-center">
            <Button
              variant="outline"
              className="w-full md:w-auto h-10 shadow-sm transition-all"
              disabled
            >
              Transfer Project
            </Button>
          </div>
        </SettingsCard>

        <SettingsCard
          danger
          title="Delete Project"
          description="The project will be permanently deleted, including its deployments and domains. This action is irreversible and can not be undone."
        >
          <div className="w-full flex md:justify-end items-center">
            <Button
              variant="destructive"
              className="w-full md:w-auto h-10 shadow-sm hover:shadow-md transition-all"
            >
              Delete Project
            </Button>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
