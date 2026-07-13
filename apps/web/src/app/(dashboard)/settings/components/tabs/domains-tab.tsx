import { Button } from "@/components/ui/button";
import { SettingsCard } from "../settings-card";
import { Globe, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

export function DomainsTab() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Custom Domains"
        description="Connect custom domains to your project's production or preview environments."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Plus className="size-4 mr-2" />
              Add Domain
            </Button>
          </div>

          <div className="flex flex-col border rounded-lg overflow-hidden bg-background/50">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Globe className="size-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    project-name.kyro.app
                  </span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Production
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                  <div className="size-1.5 rounded-full bg-success animate-pulse" />
                  Active
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  nativeButton={false}
                  render={<Link href="https://kyro.app" target="_blank" />}
                >
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Domain Redirects"
        description="Permanently or temporarily redirect traffic from one path or domain to another."
      >
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-lg">
          <span className="text-sm font-medium text-muted-foreground mb-4">
            No redirects configured yet.
          </span>
          <Button variant="outline" size="sm" disabled>
            Add Redirect
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
