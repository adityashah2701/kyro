import { Button } from "@/components/ui/button";
import { SettingsCard } from "../settings-card";
import { Shield, Key, FileText, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function SecurityTab() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Password Protection"
        description="Require a password for visitors to access your Preview Deployments or Production Deployment."
      >
        <div className="flex items-center justify-between w-full md:max-w-md p-4 border rounded-lg bg-background/50">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Protect Deployments</span>
            <span className="text-xs text-muted-foreground">
              Require a shared password.
            </span>
          </div>
          <Switch checked={false} disabled />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Trusted IPs"
        description="Restrict access to your Deployments to a specific set of IP addresses or ranges."
      >
        <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/20 border border-dashed rounded-lg">
          <Globe className="size-6 text-muted-foreground mb-3" />
          <span className="text-sm font-medium text-muted-foreground mb-3">
            Trusted IPs are available on the Enterprise plan.
          </span>
          <Button variant="outline" size="sm" disabled>
            Upgrade to Enterprise
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Deployment Tokens"
        description="Create tokens to authenticate deployment requests from CI/CD providers."
      >
        <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/20 border border-dashed rounded-lg">
          <Key className="size-6 text-muted-foreground mb-3" />
          <span className="text-sm font-medium text-muted-foreground mb-3">
            No deployment tokens created yet.
          </span>
          <Button variant="outline" size="sm" disabled>
            Create Token
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Audit Logs"
        description="View a log of all security and administrative events for this project."
      >
        <div className="flex items-center justify-between w-full p-4 border rounded-lg bg-background/50">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                View Project Audit Logs
              </span>
              <span className="text-xs text-muted-foreground">
                Retained for 90 days.
              </span>
            </div>
          </div>
          <Button variant="secondary" size="sm" disabled>
            View Logs
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
