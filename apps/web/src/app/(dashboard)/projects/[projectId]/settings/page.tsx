import { db } from "@kyro/database";
import { project } from "@kyro/database/schema";
import { eq, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function SettingsPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) return null;

  const projectData = await db.query.project.findFirst({
    where: and(
      eq(project.id, params.projectId),
      eq(project.userId, session.user.id)
    ),
  });

  if (!projectData) notFound();

  return (
    <div className="max-w-2xl space-y-4 animate-in fade-in-50 duration-500">
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10 shadow-sm border border-border">
        <h2 className="text-base font-semibold tracking-tight">
          Project Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage general settings for this project.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Name</dt>
            <dd className="mt-0.5 font-medium">{projectData.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Slug</dt>
            <dd className="mt-0.5 font-medium">{projectData.slug}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Visibility</dt>
            <dd className="mt-0.5 font-medium capitalize">
              {projectData.visibility}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Framework</dt>
            <dd className="mt-0.5 font-medium">{projectData.framework}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
