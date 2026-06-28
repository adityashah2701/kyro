import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitHubConnectCard } from "@/features/github/components/github-connect-card";
import { db } from "@kyro/database";
import { githubAccount } from "@kyro/database/schema";
import { eq } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectGitHub } from "@/features/github/actions";
import { redirect } from "next/navigation";

export default async function SettingsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const installationId = searchParams?.installation_id as string | undefined;

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

  let ghAccount = null;
  if (session?.user) {
    ghAccount = await db.query.githubAccount.findFirst({
      where: eq(githubAccount.userId, session.user.id),
    });
  }

  const isConnected = !!ghAccount;

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-500">
            <GitHubConnectCard
              isConnected={isConnected}
              username={ghAccount?.username}
              avatar={ghAccount?.avatar}
              installationUrl={process.env.GITHUB_APP_INSTALLATION_URL || "#"}
            />

            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium">Profile Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update your personal information.
              </p>
              {/* Form placeholder */}
              <div className="mt-4 h-32 rounded bg-muted/50" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
