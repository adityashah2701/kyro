"use server";

import { revalidatePath } from "next/cache";
import { addDomainSchema, type AddDomainInput } from "./schemas";
import { DomainService } from "./services/domain.service";
import { requireProjectOwner } from "@/features/projects/authorize";

export async function addDomainAction(data: AddDomainInput) {
  try {
    const parsedData = addDomainSchema.safeParse(data);
    if (!parsedData.success) {
      return { error: "Invalid domain", details: parsedData.error.flatten() };
    }

    await requireProjectOwner(parsedData.data.projectId);
    await DomainService.addDomain(
      parsedData.data.projectId,
      parsedData.data.hostname.toLowerCase()
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
    await requireProjectOwner(projectId);
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
    await requireProjectOwner(projectId);
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
    await requireProjectOwner(projectId);
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
