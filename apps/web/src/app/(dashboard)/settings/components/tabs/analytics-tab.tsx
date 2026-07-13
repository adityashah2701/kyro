import { Button } from "@/components/ui/button";
import { SettingsCard } from "../settings-card";
import {
  Activity,
  Clock,
  Database,
  UploadCloud,
  TrendingUp,
} from "lucide-react";

export function AnalyticsTab() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        layout="column"
        title="Usage Metrics"
        description="Monitor the resources consumed by this project over the current billing cycle."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col p-5 border border-border/60 rounded-xl bg-card shadow-sm gap-2 hover:border-primary/50 hover:shadow-md transition-all group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="size-12" />
            </div>
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Requests</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-semibold">1.2M</span>
            </div>
          </div>

          <div className="flex flex-col p-5 border border-border/60 rounded-xl bg-card shadow-sm gap-2 hover:border-primary/50 hover:shadow-md transition-all group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <UploadCloud className="size-12" />
            </div>
            <div className="flex items-center gap-2">
              <UploadCloud className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Bandwidth</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-semibold">45.2 GB</span>
            </div>
          </div>

          <div className="flex flex-col p-5 border border-border/60 rounded-xl bg-card shadow-sm gap-2 hover:border-primary/50 hover:shadow-md transition-all group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Clock className="size-12" />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Build Time</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-semibold">324m</span>
            </div>
          </div>

          <div className="flex flex-col p-5 border border-border/60 rounded-xl bg-card shadow-sm gap-2 hover:border-primary/50 hover:shadow-md transition-all group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Database className="size-12" />
            </div>
            <div className="flex items-center gap-2">
              <Database className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-semibold">120 MB</span>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        layout="column"
        title="Web Analytics"
        description="Enable Web Analytics to track visitors, page views, and performance metrics directly on the Kyro platform."
      >
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-lg">
          <TrendingUp className="size-8 text-muted-foreground mb-4" />
          <span className="text-sm font-medium text-muted-foreground mb-4">
            Web Analytics is currently disabled for this project.
          </span>
          <Button variant="outline" size="sm" disabled>
            Enable Web Analytics
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
