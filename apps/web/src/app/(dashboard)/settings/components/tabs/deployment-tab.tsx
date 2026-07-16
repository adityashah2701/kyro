"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsCard, SettingsCardFooter } from "../settings-card";
import { updateProject } from "@/features/projects/actions";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  deploymentRegion?: string | null;
  buildTimeout?: number | null;
  maintenanceMode?: boolean | null;
  passwordProtectionEnabled?: boolean | null;
  passwordProtectionPassword?: string | null;
}

interface DeploymentTabProps {
  projectData: ProjectData;
}

export function DeploymentTab({ projectData }: DeploymentTabProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(
    !!projectData.maintenanceMode
  );

  const [passwordProtection, setPasswordProtection] = useState(
    !!projectData.passwordProtectionEnabled
  );

  const handleSave = async (formData: FormData, fieldName: string) => {
    setLoading(fieldName);

    const dataToUpdate: Parameters<typeof updateProject>[0] = {
      id: projectData.id,
    };

    if (fieldName === "region") {
      dataToUpdate.deploymentRegion = formData.get("region") as string;
    } else if (fieldName === "timeout") {
      dataToUpdate.buildTimeout = parseInt(
        formData.get("timeout") as string,
        10
      );
    } else if (fieldName === "password") {
      dataToUpdate.passwordProtectionPassword = formData.get(
        "password"
      ) as string;
    }

    const res = await updateProject(dataToUpdate);
    setLoading(null);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Settings updated successfully");
    }
  };

  const handleToggleMaintenance = async (checked: boolean) => {
    setMaintenanceMode(checked);
    const res = await updateProject({
      id: projectData.id,
      maintenanceMode: checked,
    });

    if (res?.error) {
      toast.error(res.error);
      setMaintenanceMode(!checked);
    } else {
      toast.success(`Maintenance mode ${checked ? "enabled" : "disabled"}`);
    }
  };

  const handleTogglePasswordProtection = async (checked: boolean) => {
    setPasswordProtection(checked);
    const res = await updateProject({
      id: projectData.id,
      passwordProtectionEnabled: checked,
    });

    if (res?.error) {
      toast.error(res.error);
      setPasswordProtection(!checked);
    } else {
      toast.success(`Password protection ${checked ? "enabled" : "disabled"}`);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <form action={(fd) => handleSave(fd, "region")}>
        <SettingsCard
          title="Deployment Region"
          description="Select the region where your Serverless Functions and Edge Functions will execute."
        >
          <div className="w-full md:max-w-md">
            <select
              name="region"
              defaultValue={projectData.deploymentRegion || "sfo1"}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="sfo1">sfo1 (San Francisco, USA)</option>
              <option value="iad1">iad1 (Washington, D.C., USA)</option>
              <option value="fra1">fra1 (Frankfurt, Germany)</option>
              <option value="hnd1">hnd1 (Tokyo, Japan)</option>
            </select>
          </div>
          <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
            <span className="text-[13px] text-muted-foreground">
              Changing the region will take effect on the next deployment.
            </span>
            <Button
              type="submit"
              disabled={loading === "region"}
              size="sm"
              className="h-8"
            >
              {loading === "region" ? "Saving..." : "Save"}
            </Button>
          </SettingsCardFooter>
        </SettingsCard>
      </form>

      <form action={(fd) => handleSave(fd, "timeout")}>
        <SettingsCard
          title="Deployment Timeout"
          description="The maximum amount of time a deployment can run before it is automatically cancelled."
        >
          <div className="flex flex-col gap-2 w-full md:max-w-md">
            <div className="flex items-center gap-2 text-sm">
              <Input
                name="timeout"
                type="number"
                defaultValue={projectData.buildTimeout || 45}
                min={1}
                max={120}
                required
                className="bg-background/50 h-10 shadow-sm w-24"
              />
              <span className="text-muted-foreground">minutes</span>
            </div>
          </div>
          <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
            <span className="text-[13px] text-muted-foreground">
              Default is 45 minutes. Maximum is 120 minutes.
            </span>
            <Button
              type="submit"
              disabled={loading === "timeout"}
              size="sm"
              className="h-8"
            >
              {loading === "timeout" ? "Saving..." : "Save"}
            </Button>
          </SettingsCardFooter>
        </SettingsCard>
      </form>

      <SettingsCard
        title="Deployment Protection"
        description="Require an authentication mechanism to access Preview Deployments."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full md:max-w-md p-4 border rounded-lg bg-background/50">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Password Protection</span>
              <span className="text-xs text-muted-foreground">
                Require a password to access deployments.
              </span>
            </div>
            <Switch
              checked={passwordProtection}
              onCheckedChange={handleTogglePasswordProtection}
              className="shrink-0"
            />
          </div>

          {passwordProtection && (
            <form
              action={(fd) => handleSave(fd, "password")}
              className="flex flex-col gap-2 w-full md:max-w-md mt-2"
            >
              <div className="flex gap-2">
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter a password"
                  defaultValue={projectData.passwordProtectionPassword || ""}
                  required
                  className="bg-background/50 h-10 shadow-sm flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading === "password"}
                  className="h-10 shrink-0"
                >
                  {loading === "password" ? "Saving..." : "Save Password"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Maintenance Mode"
        description="Temporarily pause all traffic to your project and serve a maintenance page."
      >
        <div
          className={`flex items-center justify-between w-full p-4 border rounded-lg transition-colors ${maintenanceMode ? "border-warning/30 bg-warning/5" : "bg-background/50"}`}
        >
          <div className="flex flex-col gap-1 lg:max-w-[70%]">
            <span className="text-sm font-medium">Enable Maintenance Mode</span>
            <span className="text-xs text-muted-foreground">
              All incoming requests will receive a 503 Service Unavailable
              response with a customized maintenance page. Active deployments
              will not be affected.
            </span>
          </div>
          <Switch
            checked={maintenanceMode}
            onCheckedChange={handleToggleMaintenance}
            className="shrink-0"
          />
        </div>
      </SettingsCard>
    </div>
  );
}
