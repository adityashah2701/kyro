import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { db } from "@kyro/database";
import { project } from "@kyro/database/schema";
import { eq, ne, and } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let projects: { id: string; name: string; slug: string }[] = [];

  if (session?.user) {
    projects = await db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
      })
      .from(project)
      .where(
        and(eq(project.userId, session.user.id), ne(project.status, "archived"))
      )
      .orderBy(project.createdAt);
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header projects={projects} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
