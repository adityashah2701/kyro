import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@kyro/database";
import { projectRepository, deployment, project } from "@kyro/database/schema";
import { eq } from "drizzle-orm";
import { queueDeployment } from "@/features/deployment/services/deployment.service";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    const bodyText = await request.text();

    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret && signature) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = "sha256=" + hmac.update(bodyText).digest("hex");
      if (signature !== digest) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    if (event !== "push") {
      return NextResponse.json({ message: "Ignored event type" });
    }

    const payload = JSON.parse(bodyText);
    const repositoryId = payload.repository?.id?.toString();
    const branchName = payload.ref?.replace("refs/heads/", "");
    const headCommit = payload.head_commit;

    if (!repositoryId || !branchName || !headCommit) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const projRepo = await db.query.projectRepository.findFirst({
      where: eq(projectRepository.repositoryId, repositoryId),
    });

    if (!projRepo) {
      return NextResponse.json(
        { error: "Project not found for this repository" },
        { status: 404 }
      );
    }

    const proj = await db.query.project.findFirst({
      where: eq(project.id, projRepo.projectId),
    });

    if (!proj) {
      return NextResponse.json({ error: "Project missing" }, { status: 404 });
    }

    const isProduction = branchName === projRepo.defaultBranch;

    const existingDeployments = await db.query.deployment.findMany({
      where: eq(deployment.projectId, projRepo.projectId),
    });
    const deploymentNumber = existingDeployments.length + 1;

    const [newDeployment] = await db
      .insert(deployment)
      .values({
        projectId: projRepo.projectId,
        userId: proj.userId,
        commitSha: headCommit.id,
        commitMessage: headCommit.message,
        commitAuthorName:
          headCommit.author?.name || headCommit.author?.username || "Unknown",
        branch: branchName,
        status: "queued",
        triggerType: "push",
        deploymentNumber: deploymentNumber,
        production: isProduction,
      })
      .returning();

    await queueDeployment(newDeployment.id);

    return NextResponse.json({ success: true, deploymentId: newDeployment.id });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
