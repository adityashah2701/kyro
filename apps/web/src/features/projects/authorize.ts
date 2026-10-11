import { db, and, eq } from "@kyro/database";
import { project } from "@kyro/database/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** Returns the signed-in user's id if they own the project; throws otherwise. */
export async function requireProjectOwner(projectId: string): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const owned = await db.query.project.findFirst({
    where: and(eq(project.id, projectId), eq(project.userId, session.user.id)),
    columns: { id: true },
  });
  if (!owned) throw new Error("Project not found or unauthorized");

  return session.user.id;
}
