import { Button } from "@/components/ui/button";
import { SettingsCard } from "../settings-card";
import { Blocks, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function IntegrationsTab() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Project Integrations"
        description="Connect your project with third-party services and tools."
      >
        <div className="flex items-center gap-2 w-full mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              className="pl-9 bg-background/50 h-10 shadow-sm"
              disabled
            />
          </div>
          <Button disabled variant="secondary" className="h-10 shadow-sm">
            Browse Directory
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-lg">
          <Blocks className="size-8 text-muted-foreground mb-4" />
          <span className="text-sm font-medium text-muted-foreground mb-4">
            No integrations installed.
          </span>
          <span className="text-xs text-muted-foreground max-w-xs mb-4">
            Connect tools like Slack, Sentry, Datadog, or PlanetScale to enhance
            your deployment workflow.
          </span>
        </div>
      </SettingsCard>
    </div>
  );
}
