import Link from "next/link";
import { Globe, FolderOpen, ShieldCheck, ShieldAlert } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { db } from "@kyro/database";
import { domain, project } from "@kyro/database/schema";
import { eq, desc, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata = { title: "Domains | Kyro" };

export default async function DomainsPage(props: {
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
    ? and(eq(project.userId, session.user.id), eq(domain.projectId, projectId))
    : eq(project.userId, session.user.id);

  const userDomains = await db
    .select({
      id: domain.id,
      hostname: domain.hostname,
      isPrimary: domain.isPrimary,
      verificationStatus: domain.verificationStatus,
      sslStatus: domain.sslStatus,
      dnsStatus: domain.dnsStatus,
      createdAt: domain.createdAt,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
    })
    .from(domain)
    .innerJoin(project, eq(domain.projectId, project.id))
    .where(whereClause)
    .orderBy(desc(domain.createdAt));

  return (
    <PageContainer>
      <PageHeader
        title="Domains"
        description="Manage custom domains and SSL certificates across all your projects."
      />

      {userDomains.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No domains configured"
          description="Custom domains are attached to a project. Open a project's Domains tab to connect a domain and configure DNS."
          action={
            <Button nativeButton={false} render={<Link href="/projects" />}>
              <FolderOpen className="size-4" />
              Go to Projects
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col border rounded-xl overflow-hidden bg-card/40">
          <div className="grid grid-cols-[2fr_1fr_1.5fr_auto] gap-4 items-center px-5 py-3 border-b border-border/50 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div>Domain</div>
            <div>Status</div>
            <div>Project</div>
            <div className="w-[100px] text-right">Actions</div>
          </div>
          {userDomains.map((d, i) => (
            <div
              key={d.id}
              className={`grid grid-cols-[2fr_1fr_1.5fr_auto] gap-4 items-center px-5 py-4 hover:bg-muted/40 transition-colors ${
                i !== userDomains.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              {/* Domain Name */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <a
                    href={`https://${d.hostname}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold hover:underline"
                  >
                    {d.hostname}
                  </a>
                  {d.isPrimary && (
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Primary Domain
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                {d.verificationStatus === "verified" &&
                d.sslStatus === "ready" ? (
                  <Badge
                    variant="secondary"
                    className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 border-teal-500/20 gap-1.5"
                  >
                    <ShieldCheck className="size-3" /> Valid Configuration
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 gap-1.5"
                  >
                    <ShieldAlert className="size-3" /> Invalid Configuration
                  </Badge>
                )}
              </div>

              {/* Project Link */}
              <div>
                <Link
                  href={`/dashboard?projectId=${d.project.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FolderOpen className="size-4" />
                  {d.project.name}
                </Link>
              </div>

              {/* Actions */}
              <div className="flex justify-end w-[100px]">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/domains?projectId=${d.project.id}`} />}
                >
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
