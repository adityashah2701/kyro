"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "../settings-card";
import { Activity, Clock, Globe, TrendingUp, ExternalLink } from "lucide-react";
import { updateProject } from "@/features/projects/actions";
import { toast } from "sonner";
import type {
  AnalyticsSummary,
  TopPage,
  RequestsPerDay,
  TopReferer,
  BrowserStat,
} from "@/features/analytics/actions";

interface ProjectData {
  id: string;
  webAnalyticsEnabled?: boolean | null;
}

interface AnalyticsTabProps {
  projectData: ProjectData;
  summary: AnalyticsSummary;
  topPages: TopPage[];
  requestsOverTime: RequestsPerDay[];
  topReferers: TopReferer[];
  browserStats: BrowserStat[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function AnalyticsTab({
  projectData,
  summary,
  topPages,
  requestsOverTime,
  topReferers,
  browserStats,
}: AnalyticsTabProps) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(!!projectData.webAnalyticsEnabled);

  const handleToggleAnalytics = async () => {
    setLoading(true);
    const newState = !enabled;
    const res = await updateProject({
      id: projectData.id,
      webAnalyticsEnabled: newState,
    });

    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setEnabled(newState);
      toast.success(`Web Analytics ${newState ? "enabled" : "disabled"}`);
    }
  };

  const maxRequests = Math.max(...requestsOverTime.map((d) => d.count), 1);
  const totalBrowserRequests =
    browserStats.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      {/* Toggle Card */}
      <SettingsCard
        layout="column"
        title="Web Analytics"
        description="Enable Web Analytics to track visitors, page views, and performance metrics directly on the Kyro platform."
      >
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-lg transition-colors">
          <TrendingUp
            className={`size-8 mb-4 ${enabled ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="text-sm font-medium text-muted-foreground mb-4">
            Web Analytics is currently {enabled ? "enabled" : "disabled"} for
            this project.
          </span>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={handleToggleAnalytics}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : enabled
                ? "Disable Web Analytics"
                : "Enable Web Analytics"}
          </Button>
        </div>
      </SettingsCard>

      {enabled && (
        <>
          {/* Summary Cards */}
          <SettingsCard
            layout="column"
            title="Overview"
            description="Metrics for the last 30 days."
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col p-4 border border-border/60 rounded-xl bg-card shadow-sm gap-1 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-2">
                  <Activity className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Requests
                  </span>
                </div>
                <span className="text-2xl font-semibold mt-1">
                  {formatNumber(summary.totalRequests)}
                </span>
              </div>

              <div className="flex flex-col p-4 border border-border/60 rounded-xl bg-card shadow-sm gap-1 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-2">
                  <Globe className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Bandwidth
                  </span>
                </div>
                <span className="text-2xl font-semibold mt-1">
                  {formatBytes(Number(summary.totalBandwidth))}
                </span>
              </div>

              <div className="flex flex-col p-4 border border-border/60 rounded-xl bg-card shadow-sm gap-1 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Avg Response
                  </span>
                </div>
                <span className="text-2xl font-semibold mt-1">
                  {summary.avgResponseTime}ms
                </span>
              </div>

              <div className="flex flex-col p-4 border border-border/60 rounded-xl bg-card shadow-sm gap-1 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-2">
                  <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Unique Pages
                  </span>
                </div>
                <span className="text-2xl font-semibold mt-1">
                  {summary.uniquePaths}
                </span>
              </div>
            </div>
          </SettingsCard>

          {/* Requests Over Time */}
          {requestsOverTime.length > 0 && (
            <SettingsCard
              layout="column"
              title="Requests (Last 14 Days)"
              description="Daily request volume over the past two weeks."
            >
              <div className="flex items-end gap-1 h-40 px-2">
                {requestsOverTime.map((day) => {
                  const heightPct = Math.max(
                    (day.count / maxRequests) * 100,
                    4
                  );
                  const dateLabel = new Date(day.date).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  );
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.count}
                      </span>
                      <div
                        className="w-full bg-primary/20 group-hover:bg-primary/40 rounded-sm transition-all relative"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div
                          className="absolute bottom-0 w-full bg-primary rounded-sm transition-all"
                          style={{ height: `${Math.min(heightPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground hidden lg:block">
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SettingsCard>
          )}

          {/* Top Pages & Referers side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Pages */}
            <SettingsCard
              layout="column"
              title="Top Pages"
              description="Most visited paths."
            >
              {topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No page views recorded yet.
                </p>
              ) : (
                <div className="flex flex-col">
                  {topPages.map((page, i) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between py-2.5 px-1 border-b border-border/30 last:border-0 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground text-xs w-5 shrink-0">
                          {i + 1}.
                        </span>
                        <span className="font-mono text-xs truncate">
                          {page.path}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs font-medium shrink-0 ml-2">
                        {formatNumber(page.count)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SettingsCard>

            {/* Top Referers */}
            <SettingsCard
              layout="column"
              title="Top Referers"
              description="Where your traffic comes from."
            >
              {topReferers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No referer data yet.
                </p>
              ) : (
                <div className="flex flex-col">
                  {topReferers.map((ref, i) => (
                    <div
                      key={ref.referer}
                      className="flex items-center justify-between py-2.5 px-1 border-b border-border/30 last:border-0 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground text-xs w-5 shrink-0">
                          {i + 1}.
                        </span>
                        <span className="font-mono text-xs truncate">
                          {ref.referer}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs font-medium shrink-0 ml-2">
                        {formatNumber(ref.count)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SettingsCard>
          </div>

          {/* Browser Breakdown */}
          {browserStats.length > 0 && (
            <SettingsCard
              layout="column"
              title="Browsers"
              description="Visitor browser distribution."
            >
              <div className="flex flex-col gap-3">
                {browserStats.map((stat) => {
                  const pct = Math.round(
                    (stat.count / totalBrowserRequests) * 100
                  );
                  return (
                    <div key={stat.browser} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stat.browser}</span>
                        <span className="text-muted-foreground text-xs">
                          {pct}% ({formatNumber(stat.count)})
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SettingsCard>
          )}
        </>
      )}
    </div>
  );
}
