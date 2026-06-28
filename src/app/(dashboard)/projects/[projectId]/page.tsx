import { PageHeader } from "@/components/layout/page-header";
import { db } from "@/db";
import { project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Settings,
  Globe,
  TerminalSquare,
  Activity,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default async function ProjectDetailsPage(props: {
  params: Promise<{ projectId: string }>;
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

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
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
        <Button variant="outline">
          <ExternalLink className="mr-2 h-4 w-4" />
          Visit
        </Button>
      </PageHeader>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  Framework
                </h3>
                <TerminalSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">
                {projectData.framework}
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">
                  Deployments
                </h3>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">0</div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Domains</h3>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">0</div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Status</h3>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2 capitalize">
                {projectData.status}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50 duration-500 bg-muted/10">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <h3 className="mt-4 text-lg font-semibold">No deployments yet</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Push code to a connected repository to trigger your first
                deployment.
              </p>
              <Button disabled>
                <Rocket className="mr-2 h-4 w-4" />
                Trigger Deployment
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deployments">
          <div className="text-sm text-muted-foreground p-4 border rounded-md">
            Deployments content placeholder
          </div>
        </TabsContent>

        <TabsContent value="domains">
          <div className="text-sm text-muted-foreground p-4 border rounded-md">
            Domains content placeholder
          </div>
        </TabsContent>

        <TabsContent value="env">
          <div className="text-sm text-muted-foreground p-4 border rounded-md">
            Environment variables placeholder
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-sm text-muted-foreground p-4 border rounded-md">
            Settings placeholder
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
