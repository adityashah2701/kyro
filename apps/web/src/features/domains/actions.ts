"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { addDomainSchema, type AddDomainInput } from "./schemas";
import { DomainService } from "./services/domain.service";

export async function addDomainAction(data: AddDomainInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const parsedData = addDomainSchema.safeParse(data);
    if (!parsedData.success) {
      return { error: "Invalid domain", details: parsedData.error.flatten() };
    }

    await DomainService.addDomain(
      parsedData.data.projectId,
      parsedData.data.hostname
    );
    revalidatePath(`/projects/${parsedData.data.projectId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to add domain:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to add domain.",
    };
  }
}

export async function verifyDomainAction(domainId: string, projectId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    await DomainService.verifyDomain(domainId, projectId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to verify domain:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to verify domain.",
    };
  }
}

export async function removeDomainAction(domainId: string, projectId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    await DomainService.deleteDomain(domainId, projectId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to remove domain:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to remove domain.",
    };
  }
}

export async function setPrimaryDomainAction(
  domainId: string,
  projectId: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    await DomainService.setPrimaryDomain(domainId, projectId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to set primary domain:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to set primary domain.",
    };
  }
}
