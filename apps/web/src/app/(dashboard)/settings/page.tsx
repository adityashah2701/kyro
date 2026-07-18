import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { GitHubConnectCard } from "@/features/github/components/github-connect-card";
import { db, sql } from "@kyro/database";
import {
  githubAccount,
  project,
  projectRepository,
  deployment,
} from "@kyro/database/schema";
import { eq, and, desc } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectGitHub } from "@/features/github/actions";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SettingsSidebar } from "./components/settings-sidebar";
import { GeneralTab } from "./components/tabs/general-tab";
import { GitTab } from "./components/tabs/git-tab";
import { BuildTab } from "./components/tabs/build-tab";
import { DeploymentTab } from "./components/tabs/deployment-tab";
import { DomainsTab } from "./components/tabs/domains-tab";
import { EnvVariablesTab } from "./components/tabs/env-variables-tab";
import { AnalyticsTab } from "./components/tabs/analytics-tab";
import { IntegrationsTab } from "./components/tabs/integrations-tab";
import { SecurityTab } from "./components/tabs/security-tab";
import { TeamTab } from "./components/tabs/team-tab";
import { AdvancedTab } from "./components/tabs/advanced-tab";
import { LogsTab } from "./components/tabs/logs-tab";
import {
  getAnalyticsSummary,
  getTopPages,
  getRequestsOverTime,
  getTopReferers,
  getBrowserStats,
} from "@/features/analytics/actions";

export default async function SettingsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const installationId = searchParams?.installation_id as string | undefined;
  const projectId = searchParams?.projectId as string | undefined;

  if (installationId) {
    try {
      await connectGitHub(installationId);
    } catch (e) {
      console.error("Failed to connect GitHub:", e);
    }
    redirect("/settings");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) return null;

  if (projectId) {
    // Render Project Settings
    const projectData = await db.query.project.findFirst({
      where: and(
        eq(project.id, projectId),
        eq(project.userId, session.user.id)
      ),
    });

    if (!projectData) notFound();

    const projectRepo = await db.query.projectRepository.findFirst({
      where: eq(projectRepository.projectId, projectId),
    });

    const currentTab = searchParams?.tab as string | undefined;

    let TabContent = <GeneralTab projectData={projectData} />;
    switch (currentTab) {
      case "git":
        TabContent = <GitTab projectRepo={projectRepo} />;
        break;
      case "build":
        TabContent = <BuildTab projectData={projectData} />;
        break;
      case "deployment":
        TabContent = <DeploymentTab projectData={projectData} />;
        break;
      case "domains":
        TabContent = <DomainsTab />;
        break;
      case "env":
        TabContent = <EnvVariablesTab projectId={projectId} />;
        break;
      case "analytics": {
        const [summary, topPages, requestsOverTime, topReferers, browserStats] =
          await Promise.all([
            getAnalyticsSummary(projectId),
            getTopPages(projectId),
            getRequestsOverTime(projectId),
            getTopReferers(projectId),
            getBrowserStats(projectId),
          ]);
        TabContent = (
          <AnalyticsTab
            projectData={projectData}
            summary={summary}
            topPages={topPages}
            requestsOverTime={requestsOverTime}
            topReferers={topReferers}
            browserStats={browserStats}
          />
        );
        break;
      }
      case "integrations":
        TabContent = <IntegrationsTab />;
        break;
      case "security":
        TabContent = <SecurityTab projectData={projectData} />;
        break;
      case "team":
        TabContent = <TeamTab session={session} />;
        break;
      case "advanced":
        TabContent = <AdvancedTab projectData={projectData} />;
        break;
      case "logs": {
        const deploymentLogs = await db
          .select({
            id: deployment.id,
            deploymentNumber: deployment.deploymentNumber,
            status: deployment.status,
            branch: deployment.branch,
            commitMessage: deployment.commitMessage,
            commitSha: deployment.commitSha,
            buildDuration: deployment.buildDuration,
            createdAt: deployment.createdAt,
            logs: deployment.logs,
          })
          .from(deployment)
          .where(eq(deployment.projectId, projectId))
          .orderBy(desc(deployment.createdAt))
          .limit(15);
        TabContent = (
          <LogsTab
            deployments={deploymentLogs.map((d) => ({
              ...d,
              createdAt: d.createdAt.toISOString(),
            }))}
          />
        );
        break;
      }
      default:
        TabContent = <GeneralTab projectData={projectData} />;
        break;
    }

    return (
      <div className="flex flex-col h-full">
        {/* Fixed header — never scrolls */}
        <div className="shrink-0 px-4 sm:px-6 pt-6 sm:pt-10 pb-4 max-w-6xl mx-auto w-full border-b border-border/40">
          <PageHeader
            title="Project Settings"
            description={`Manage configuration for ${projectData.name}.`}
          />
        </div>

        {/* Body: fixed sidebar + scrollable content */}
        <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-8">
          {/* Sidebar — never scrolls */}
          <div className="w-full md:w-56 lg:w-64 shrink-0">
            <SettingsSidebar projectId={projectId} />
          </div>

          {/* Tab content — the ONLY scrollable area */}
          <div
            className="flex-1 min-w-0 overflow-y-auto pb-12"
            key={projectData.updatedAt?.toString()}
          >
            {TabContent}
          </div>
        </div>
      </div>
    );
  }

  // Render Account Settings
  let ghAccount = null;
  if (session?.user) {
    ghAccount = await db.query.githubAccount.findFirst({
      where: eq(githubAccount.userId, session.user.id),
    });
  }

  const isConnected = !!ghAccount;

  return (
    <PageContainer className="max-w-4xl pb-12">
      <PageHeader
        title="Account Settings"
        description="Manage your account settings and preferences."
      />

      <div className="mt-8 flex flex-col gap-8 animate-in fade-in-50 duration-500">
        {/* Profile Card */}
        <div className="flex flex-col rounded-xl border border-border/40 bg-card/40 shadow-sm overflow-hidden transition-all hover:border-border/60 hover:bg-card/60">
          <div className="flex flex-col md:flex-row justify-between gap-6 p-6">
            <div className="flex flex-col gap-1.5 md:max-w-[50%]">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Profile Information
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Your personal account information used to identify you on Kyro.
              </p>
            </div>
            <div className="w-full md:w-[400px] flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Name
                </Label>
                <Input
                  defaultValue={session?.user?.name || ""}
                  disabled
                  className="bg-background/50 h-10 shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Email
                </Label>
                <Input
                  defaultValue={session?.user?.email || ""}
                  disabled
                  className="bg-background/50 h-10 shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="bg-muted/30 px-6 py-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">
              Profile information is managed by your authentication provider.
            </span>
            <Button disabled size="sm" className="h-8">
              Save
            </Button>
          </div>
        </div>

        {/* Integrations */}
        <div className="flex flex-col rounded-xl border border-border/40 bg-card/40 shadow-sm overflow-hidden transition-all hover:border-border/60 hover:bg-card/60">
          <div className="flex flex-col p-6 gap-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Integrations
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Manage connections to external services and providers.
              </p>
            </div>

            <GitHubConnectCard
              isConnected={isConnected}
              username={ghAccount?.username}
              avatar={ghAccount?.avatar}
              installationUrl={process.env.GITHUB_APP_INSTALLATION_URL || "#"}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
