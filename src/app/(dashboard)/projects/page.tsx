import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { project } from "@/db/schema";
import { eq, and, ne, desc, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ProjectCard } from "@/features/projects/components/project-card";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { ProjectsClient } from "./client"; // A client component to manage modal state and search input

export const metadata = {
  title: "Projects | Kyro",
};

export default async function ProjectsPage(props: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const sort = searchParams.sort || "newest";

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
