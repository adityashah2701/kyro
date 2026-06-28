import { db } from "@kyro/database";
import { project } from "@kyro/database/schema";
import { eq, and, ne } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { ProjectsClient } from "./client";
import { connectGitHub } from "@/features/github/actions";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Projects | Kyro",
};

export default async function ProjectsPage(props: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    installation_id?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const sort = searchParams.sort || "newest";
  const installationId = searchParams.installation_id;

  if (installationId) {
    try {
      await connectGitHub(installationId);
    } catch (e) {
      console.error("Failed to connect GitHub:", e);
    }
    redirect("/projects");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return null;
  }

  // Fetch projects for this user, excluding archived unless explicitly requested (for now just exclude archived)
  const userProjects = await db.query.project.findMany({
    where: and(
      eq(project.userId, session.user.id),
      ne(project.status, "archived")
    ),
    orderBy: (project, { desc, asc }) => {
      if (sort === "oldest") return [asc(project.createdAt)];
      if (sort === "alphabetical") return [asc(project.name)];
      return [desc(project.createdAt)]; // default 'newest'
    },
  });

  // Simple client-side like filtering for search (we could do ILIKE in DB, but doing it in memory is fine for small lists)
  const filteredProjects = userProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.slug.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <ProjectsClient
      initialProjects={filteredProjects}
      searchQuery={q}
      currentSort={sort}
    />
  );
}
