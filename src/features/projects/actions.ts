"use server";

import { db } from "@/db";
import { project } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "./schemas";

export async function createProject(data: CreateProjectInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const parsedData = createProjectSchema.safeParse(data);
    if (!parsedData.success) {
      return { error: "Invalid data", details: parsedData.error.flatten() };
    }

    // Check if slug is taken (globally)
    const existing = await db.query.project.findFirst({
      where: eq(project.slug, parsedData.data.slug),
    });

    if (existing) {
      return { error: "Slug is already taken. Please choose another." };
    }

    const [newProject] = await db
      .insert(project)
      .values({
        userId: session.user.id,
        name: parsedData.data.name,
        slug: parsedData.data.slug,
        description: parsedData.data.description || null,
        framework: parsedData.data.framework,
        visibility: parsedData.data.visibility,
      })
      .returning();

    revalidatePath("/projects");
    return { success: true, project: newProject };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "Failed to create project. Please try again." };
  }
}

export async function updateProject(data: UpdateProjectInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const parsedData = updateProjectSchema.safeParse(data);
    if (!parsedData.success) {
      return { error: "Invalid data", details: parsedData.error.flatten() };
    }

    const { id, ...updateData } = parsedData.data;

    if (updateData.slug) {
      const existing = await db.query.project.findFirst({
        where: and(eq(project.slug, updateData.slug)),
      });
      if (existing && existing.id !== id) {
        return { error: "Slug is already taken." };
      }
    }

    // Ensure they only update their own project
    const [updatedProject] = await db
      .update(project)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(project.id, id), eq(project.userId, session.user.id)))
      .returning();

    if (!updatedProject) {
      return { error: "Project not found or unauthorized" };
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { success: true, project: updatedProject };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { error: "Failed to update project. Please try again." };
  }
}

export async function deleteProject(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    // Ensure they only delete their own project
    const [deleted] = await db
      .delete(project)
      .where(and(eq(project.id, id), eq(project.userId, session.user.id)))
      .returning();

    if (!deleted) {
      return { error: "Project not found or unauthorized" };
    }

    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { error: "Failed to delete project. Please try again." };
  }
}

export async function archiveProject(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const [archived] = await db
      .update(project)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(project.id, id), eq(project.userId, session.user.id)))
      .returning();

    if (!archived) {
      return { error: "Project not found or unauthorized" };
    }

    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to archive project:", error);
    return { error: "Failed to archive project. Please try again." };
  }
}
