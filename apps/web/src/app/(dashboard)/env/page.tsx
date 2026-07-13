import Link from "next/link";
import {
  TerminalSquare,
  FolderOpen,
  Lock,
  Globe,
  Server,
  Laptop,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { db } from "@kyro/database";
import { environmentVariable, project } from "@kyro/database/schema";
import { eq, desc, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EnvTab } from "@/features/environment/components/env-tab";
import { getSecretProvider } from "@/features/environment/providers/secret.provider";
import { type Environment } from "@/features/environment/schemas";

export const metadata = { title: "Environment Variables | Kyro" };

export default async function EnvVariablesPage(props: {
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

  let projectData = null;
  if (projectId) {
    projectData = await db.query.project.findFirst({
      where: and(
        eq(project.id, projectId),
        eq(project.userId, session.user.id)
      ),
    });

    if (!projectData) {
      notFound();
    }
  }

  const whereClause = projectId
    ? and(
        eq(project.userId, session.user.id),
        eq(environmentVariable.projectId, projectId)
      )
    : eq(project.userId, session.user.id);

  const userEnvsRaw = await db
    .select({
      id: environmentVariable.id,
      key: environmentVariable.key,
      environment: environmentVariable.environment,
      isSecret: environmentVariable.isSecret,
      encryptedValue: environmentVariable.encryptedValue,
      createdAt: environmentVariable.createdAt,
      updatedAt: environmentVariable.updatedAt,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
    })
    .from(environmentVariable)
    .innerJoin(project, eq(environmentVariable.projectId, project.id))
    .where(whereClause)
    .orderBy(desc(environmentVariable.createdAt));

  const provider = getSecretProvider();
  const MASK = "••••••••";

  const userEnvs = await Promise.all(
    userEnvsRaw.map(async (row) => {
      let displayValue = MASK;
      if (!row.isSecret) {
        try {
          displayValue = await provider.decrypt(row.encryptedValue);
        } catch {
          displayValue = "[decryption error]";
        }
      }
      return {
        id: row.id,
        key: row.key,
        displayValue,
        environment: row.environment as Environment,
        isSecret: row.isSecret,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        project: row.project,
      };
    })
  );

  const getEnvIcon = (env: string) => {
    switch (env) {
      case "production":
        return <Globe className="size-3" />;
      case "preview":
        return <Server className="size-3" />;
      case "development":
        return <Laptop className="size-3" />;
      default:
        return null;
    }
  };

  if (projectId) {
    return (
      <PageContainer className="max-w-4xl pb-12">
        <PageHeader
          title="Environment Variables"
          description={`Manage environment variables for ${projectData?.name}.`}
        />
        <div className="mt-8 animate-in fade-in-50 duration-500">
          <EnvTab variables={userEnvs} projectId={projectId} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Environment Variables"
        description="Environment variables are managed per project and encrypted with AES-256-GCM. View your workspace-wide configuration here."
      />

      {userEnvs.length === 0 ? (
        <EmptyState
          icon={TerminalSquare}
          title="Managed per project"
          description="Open a project's Environment Variables tab to add, import, and manage encrypted variables for each environment."
          action={
            <Button nativeButton={false} render={<Link href="/projects" />}>
              <FolderOpen className="size-4" />
              Go to Projects
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col border rounded-xl overflow-hidden bg-card/40">
          <div className="grid grid-cols-[1.5fr_1fr_1.5fr_auto] gap-4 items-center px-5 py-3 border-b border-border/50 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div>Variable Name</div>
            <div>Environment</div>
            <div>Project</div>
            <div className="w-[100px] text-right">Actions</div>
          </div>
          {userEnvs.map((env, i) => (
            <div
              key={env.id}
              className={`grid grid-cols-[1.5fr_1fr_1.5fr_auto] gap-4 items-center px-5 py-4 hover:bg-muted/40 transition-colors ${
                i !== userEnvs.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              {/* Variable Key */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm font-medium">{env.key}</div>
                  {env.isSecret && (
                    <Lock
                      className="size-3.5 text-muted-foreground"
                      aria-label="Secret"
                    />
                  )}
                </div>
              </div>

              {/* Environment */}
              <div>
                <Badge
                  variant="secondary"
                  className="gap-1.5 capitalize font-medium"
                >
                  {getEnvIcon(env.environment)}
                  {env.environment}
                </Badge>
              </div>

              {/* Project Link */}
              <div>
                <Link
                  href={`/dashboard?projectId=${env.project.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FolderOpen className="size-4" />
                  {env.project.name}
                </Link>
              </div>

              {/* Actions */}
              <div className="flex justify-end w-[100px]">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/env?projectId=${env.project.id}`} />}
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
