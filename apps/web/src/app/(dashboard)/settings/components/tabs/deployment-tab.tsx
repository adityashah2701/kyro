import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsCard, SettingsCardFooter } from "../settings-card";

export function DeploymentTab() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Deployment Regions"
        description="Select the regions where your Serverless Functions and Edge Functions will execute."
      >
        <div className="w-full md:max-w-md">
          <Input
            defaultValue="iad1 (Washington, D.C., USA)"
            disabled
            className="bg-background/50 h-10 shadow-sm"
          />
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            Multi-region deployment is available on the Pro plan.
          </span>
          <Button disabled size="sm" className="h-8">
            Upgrade
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

      <SettingsCard
        title="Deployment Timeout"
        description="The maximum amount of time a deployment can run before it is automatically cancelled."
      >
        <div className="flex flex-col gap-2 w-full md:max-w-md">
          <div className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              defaultValue={45}
              disabled
              className="bg-background/50 h-10 shadow-sm w-24"
            />
            <span className="text-muted-foreground">minutes</span>
          </div>
        </div>
        <SettingsCardFooter className="-mx-6 -mb-6 mt-2">
          <span className="text-[13px] text-muted-foreground">
            Default is 45 minutes. Maximum is 120 minutes.
          </span>
          <Button disabled size="sm" className="h-8">
            Save
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

      <SettingsCard
        title="Deployment Protection"
        description="Require an authentication mechanism to access Preview Deployments."
      >
        <div className="flex items-center justify-between w-full md:max-w-md p-4 border rounded-lg bg-background/50">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Vercel Authentication</span>
            <span className="text-xs text-muted-foreground">
              Require visitors to be logged in to your team.
            </span>
          </div>
          <Switch checked={false} disabled />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Maintenance Mode"
        description="Temporarily pause all traffic to your project and serve a maintenance page."
      >
        <div className="flex items-center justify-between w-full p-4 border border-warning/30 bg-warning/5 rounded-lg">
          <div className="flex flex-col gap-1 lg:max-w-[70%]">
            <span className="text-sm font-medium">Enable Maintenance Mode</span>
            <span className="text-xs text-muted-foreground">
              All incoming requests will receive a 503 Service Unavailable
              response with a customized maintenance page. Active deployments
              will not be affected.
            </span>
          </div>
          <Switch checked={false} disabled />
        </div>
      </SettingsCard>
    </div>
  );
}
