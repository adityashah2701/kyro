"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { envVariableSchema } from "./schemas";
import { EnvService } from "./services/env.service";
import type { Environment } from "./schemas";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthenticated");
  return session.user.id;
}

export async function addVariableAction(
  projectId: string,
  formData: {
    key: string;
    value: string;
    environment: string;
    isSecret: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    const parsed = envVariableSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }
    const { key, value, environment, isSecret } = parsed.data;
    await EnvService.createVariable(
      projectId,
      userId,
      key,
      value,
      environment as Environment,
      isSecret
    );
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create variable";
    return { success: false, error: msg };
  }
}

export async function updateVariableAction(
  id: string,
  projectId: string,
  value: string,
  isSecret: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await getAuthenticatedUserId();
    await EnvService.updateVariable(id, projectId, value, isSecret);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update variable";
    return { success: false, error: msg };
  }
}

export async function deleteVariableAction(
  id: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await getAuthenticatedUserId();
    await EnvService.deleteVariable(id, projectId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete variable";
    return { success: false, error: msg };
  }
}

export async function revealVariableAction(
  id: string,
  projectId: string
): Promise<{ success: boolean; value?: string; error?: string }> {
  try {
    await getAuthenticatedUserId();
    const value = await EnvService.revealValue(id, projectId);
    return { success: true, value };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to reveal variable";
    return { success: false, error: msg };
  }
}
