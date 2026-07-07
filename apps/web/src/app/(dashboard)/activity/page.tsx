import Link from "next/link";
import {
  Activity,
  FolderOpen,
  ArrowRight,
  GitCommitHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

import { db } from "@kyro/database";
import { deployment, project } from "@kyro/database/schema";
import { eq, desc, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata = { title: "Activity | Kyro" };

export default async function ActivityPage(props: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const projectId = searchParams.projectId;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return null;
  }

  const whereClause = projectId
    ? and(
        eq(project.userId, session.user.id),
        eq(deployment.projectId, projectId)
      )
    : eq(project.userId, session.user.id);

  const recentDeployments = await db
    .select({
      id: deployment.id,
      commitMessage: deployment.commitMessage,
      deploymentNumber: deployment.deploymentNumber,
      status: deployment.status,
      createdAt: deployment.createdAt,
      project: {
        id: project.id,
        name: project.name,
      },
    })
    .from(deployment)
    .innerJoin(project, eq(deployment.projectId, project.id))
    .where(whereClause)
    .orderBy(desc(deployment.createdAt))
    .limit(50);

  return (
    <PageContainer>
      <PageHeader
        title="Activity"
        description="Recent activity and audit logs across your workspace."
      />

      {recentDeployments.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Activity from deployments, project changes, and domain updates will appear here as you use Kyro."
        />
      ) : (
        <div className="flex flex-col border rounded-xl overflow-hidden bg-card/40 divide-y divide-border/50">
          {recentDeployments.map((d) => {
            const commitMessage =
              d.commitMessage || `Manual Deployment #${d.deploymentNumber}`;
            let statusColor = "bg-muted-foreground";
            if (d.status === "success")
              statusColor = "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]";
            else if (d.status === "failed") statusColor = "bg-destructive";
            else if (d.status === "building")
              statusColor = "bg-amber-500 animate-pulse";

            return (
              <div
                key={d.id}
                className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <GitCommitHorizontal className="size-4 text-muted-foreground" />
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground truncate max-w-[300px]">
                        {commitMessage}
                      </span>
                      <span className="text-muted-foreground">
                        was deployed to
                      </span>
                      <Link
                        href={`/dashboard?projectId=${d.project.id}`}
                        className="font-medium text-foreground hover:underline flex items-center gap-1"
                      >
                        <FolderOpen className="size-3" />
                        {d.project.name}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${statusColor}`}
                        />
                        <span className="capitalize">{d.status}</span>
                      </div>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(d.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    nativeButton={false}
                    render={<Link href={`/deployments/${d.id}`} />}
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
