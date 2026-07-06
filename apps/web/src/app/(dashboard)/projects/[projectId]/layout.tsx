import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { db } from "@kyro/database";
import { project, projectRepository } from "@kyro/database/schema";
import { eq, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { DeployButton } from "@/features/deployment/components/deploy-button";
import { DomainService } from "@/features/domains/services/domain.service";
import { ProjectSubnav } from "@/features/projects/components/project-subnav";

export default async function ProjectLayout(props: {
  params: Promise<{ projectId: string }>;
  children: React.ReactNode;
}) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return null;
  }

  const projectData = await db.query.project.findFirst({
    where: and(
      eq(project.id, params.projectId),
      eq(project.userId, session.user.id)
    ),
  });

  if (!projectData) {
    notFound();
  }

  const linkedRepo = await db.query.projectRepository.findFirst({
    where: eq(projectRepository.projectId, params.projectId),
  });

  const projectDomains = await DomainService.getProjectDomains(
    params.projectId
  );

  const verifiedPrimaryDomain = projectDomains.find(
    (d) => d.isPrimary && d.verificationStatus === "verified"
  );

  const baseDomain = process.env.BASE_DOMAIN || "localhost";
  const isLocal = baseDomain === "localhost";
  const scheme = isLocal ? "http" : "https";
  const portSuffix = isLocal ? ":8000" : "";

  const mainHost = verifiedPrimaryDomain
    ? verifiedPrimaryDomain.hostname
    : `${projectData.slug}.${baseDomain}`;

  const visitUrl = `${scheme}://${mainHost}${portSuffix}`;

  return (
    <PageContainer>
      <div className="mb-6 flex items-center text-sm text-muted-foreground">
        <Link
          href="/projects"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{projectData.name}</span>
      </div>

      <PageHeader
        title={projectData.name}
        description={
          projectData.description ||
          `Manage deployments and settings for ${projectData.name}`
        }
      >
        <div className="flex gap-2">
          <DeployButton
            projectId={params.projectId}
            isRepositoryLinked={!!linkedRepo}
          />
          <a href={visitUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit
            </Button>
          </a>
        </div>
      </PageHeader>

      <ProjectSubnav projectId={params.projectId} />

      {props.children}
    </PageContainer>
  );
}
