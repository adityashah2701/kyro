import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitHubConnectCard } from "@/features/github/components/github-connect-card";
import { db } from "@kyro/database";
import { githubAccount, project } from "@kyro/database/schema";
import { eq, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectGitHub } from "@/features/github/actions";
import { redirect, notFound } from "next/navigation";

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

    return (
      <PageContainer>
        <PageHeader
          title="Project Settings"
          description={`Manage general settings for ${projectData.name}.`}
        />
        <div className="max-w-2xl space-y-4 animate-in fade-in-50 duration-500 mt-6">
          <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10 shadow-sm border border-border">
            <h2 className="text-base font-semibold tracking-tight">General</h2>
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
      </PageContainer>
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
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <Tabs defaultValue="general" className="mt-2">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <div className="flex max-w-3xl flex-col gap-6">
            <GitHubConnectCard
              isConnected={isConnected}
              username={ghAccount?.username}
              avatar={ghAccount?.avatar}
              installationUrl={process.env.GITHUB_APP_INSTALLATION_URL || "#"}
            />

            <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
              <h2 className="text-base font-semibold tracking-tight">
                Profile
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your personal account information.
              </p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Name</dt>
                  <dd className="mt-0.5 font-medium">
                    {session?.user?.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 font-medium">
                    {session?.user?.email || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
