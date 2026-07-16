import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsCard, SettingsCardFooter } from "../settings-card";
import { GitCommit, GitBranch } from "lucide-react";

import { formatDistanceToNow } from "date-fns";

interface ProjectRepo {
  repositoryName: string;
  owner: string;
  selectedBranch: string;
  createdAt: Date;
}

interface GitTabProps {
  projectRepo?: ProjectRepo | null;
}

export function GitTab({ projectRepo }: GitTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Connected Repository"
        description="The Git repository connected to this project. Pushes to this repository will automatically trigger deployments."
      >
        <div className="flex items-center justify-between p-4 border rounded-lg bg-background/50 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <GitCommit className="size-5 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span
                className="text-sm font-medium truncate"
                title={
                  projectRepo
                    ? `${projectRepo.owner}/${projectRepo.repositoryName}`
                    : "No repository connected"
                }
              >
                {projectRepo
                  ? `${projectRepo.owner}/${projectRepo.repositoryName}`
                  : "No repository connected"}
              </span>
              {projectRepo?.createdAt && (
                <span className="text-xs text-muted-foreground truncate">
                  Connected{" "}
                  {formatDistanceToNow(new Date(projectRepo.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" disabled className="shrink-0">
            Disconnect
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Production Branch"
        description="By default, every commit pushed to the production branch will trigger a Production Deployment instead of a Preview Deployment."
      >
        <div className="flex flex-col gap-2 w-full md:max-w-md">
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-muted-foreground" />
            <Input
              defaultValue={projectRepo?.selectedBranch || "main"}
              disabled
              className="bg-background/50 h-10 shadow-sm"
            />
          </div>
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            The branch used as the baseline for this project.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

      <SettingsCard
        title="Auto Deploy"
        description="Automatically trigger deployments when code is pushed to the connected repository."
      >
        <div className="flex items-center justify-between w-full md:max-w-md p-4 border rounded-lg bg-background/50">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Production Deployments</span>
            <span className="text-xs text-muted-foreground">
              Pushes to the production branch.
            </span>
          </div>
          <Switch checked disabled />
        </div>
        <div className="flex items-center justify-between w-full md:max-w-md p-4 border rounded-lg bg-background/50 mt-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Preview Deployments</span>
            <span className="text-xs text-muted-foreground">
              Pushes to all other branches.
            </span>
          </div>
          <Switch checked disabled />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Deploy Hooks"
        description="Deploy Hooks allow you to trigger deployments using a unique HTTP URL. Useful for CMS integrations."
      >
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-lg">
          <span className="text-sm font-medium text-muted-foreground mb-4">
            No deploy hooks configured yet.
          </span>
          <Button variant="outline" size="sm" disabled>
            Create Deploy Hook
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
