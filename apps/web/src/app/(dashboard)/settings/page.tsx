import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { GitHubConnectCard } from "@/features/github/components/github-connect-card";
import { db } from "@kyro/database";
import { githubAccount, project } from "@kyro/database/schema";
import { eq, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectGitHub } from "@/features/github/actions";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <PageContainer className="max-w-4xl pb-12">
        <PageHeader
          title="Project Settings"
          description={`Manage configuration for ${projectData.name}.`}
        />

        <div className="mt-8 flex flex-col gap-8 animate-in fade-in-50 duration-500">
          {/* Project Name Card */}
          <div className="flex flex-col rounded-xl border border-border/40 bg-card/40 shadow-sm overflow-hidden transition-all hover:border-border/60 hover:bg-card/60">
            <div className="flex flex-col md:flex-row justify-between gap-6 p-6">
              <div className="flex flex-col gap-1.5 md:max-w-[50%]">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Project Name
                </h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Used to identify your project on the Dashboard.
                </p>
              </div>
              <div className="w-full md:w-[400px]">
                <Input
                  defaultValue={projectData.name}
                  disabled
                  className="bg-background/50 h-10 shadow-sm"
                />
              </div>
            </div>
            <div className="bg-muted/30 px-6 py-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                Please contact support to change project name.
              </span>
              <Button disabled size="sm" className="h-8">
                Save
              </Button>
            </div>
          </div>

          {/* Project Details Card */}
          <div className="flex flex-col rounded-xl border border-border/40 bg-card/40 shadow-sm overflow-hidden transition-all hover:border-border/60 hover:bg-card/60">
            <div className="flex flex-col md:flex-row justify-between gap-6 p-6">
              <div className="flex flex-col gap-1.5 md:max-w-[50%]">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Project Configuration
                </h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Technical details about how your project is built and
                  deployed.
                </p>
              </div>
              <div className="w-full md:w-[400px] flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Project Slug
                  </Label>
                  <Input
                    defaultValue={projectData.slug}
                    disabled
                    className="bg-background/50 h-10 font-mono text-[13px] shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Framework
                  </Label>
                  <Input
                    defaultValue={projectData.framework}
                    disabled
                    className="bg-background/50 h-10 shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Visibility
                  </Label>
                  <Input
                    defaultValue={projectData.visibility}
                    disabled
                    className="bg-background/50 h-10 capitalize shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="flex flex-col rounded-xl border border-destructive/20 bg-destructive/5 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between gap-6 p-6">
              <div className="flex flex-col gap-1.5 md:max-w-[50%]">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Delete Project
                </h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  The project will be permanently deleted, including its
                  deployments and domains. This action is irreversible and can
                  not be undone.
                </p>
              </div>
              <div className="w-full md:w-[400px] flex md:justify-end items-center">
                <Button
                  variant="destructive"
                  className="w-full md:w-auto h-10 shadow-sm hover:shadow-md transition-all"
                >
                  Delete Project
                </Button>
              </div>
            </div>
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
