"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import * as deploymentService from "./services/deployment.service";

export async function triggerDeploymentAction(projectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const newDeployment = await deploymentService.createDeployment(
    projectId,
    session.user.id,
    "manual"
  );
  await deploymentService.queueDeployment(newDeployment.id);

  revalidatePath(`/projects/${projectId}`);

  return { success: true, deployment: newDeployment };
}

export async function cancelDeploymentAction(
  deploymentId: string,
  projectId: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const updated = await deploymentService.cancelDeployment(
    deploymentId,
    session.user.id
  );

  revalidatePath(`/projects/${projectId}`);
  return { success: true, deployment: updated };
}

export async function retryDeploymentAction(
  deploymentId: string,
  projectId: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const updated = await deploymentService.retryDeployment(
    deploymentId,
    session.user.id
  );

  revalidatePath(`/projects/${projectId}`);
  return { success: true, deployment: updated };
}
