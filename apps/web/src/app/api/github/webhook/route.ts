import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@kyro/database";
import {
  projectRepository,
  deployment,
  project,
  githubAccount,
} from "@kyro/database/schema";
import { eq } from "drizzle-orm";
import { queueDeployment } from "@/features/deployment/services/deployment.service";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    const bodyText = await request.text();

    // Name matches .env.example; the old name is kept as a fallback.
    const secret =
      process.env.GITHUB_APP_WEBHOOK_SECRET ||
      process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.error("Webhook rejected: GITHUB_APP_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 503 }
      );
    }
    const expected = Buffer.from(
      "sha256=" +
        crypto.createHmac("sha256", secret).update(bodyText).digest("hex")
    );
    const received = Buffer.from(signature ?? "");
    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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

    const installationId = payload.installation?.id?.toString();
    const projRepos = await db.query.projectRepository.findMany({
      where: eq(projectRepository.repositoryId, repositoryId),
    });

    const deploymentIds: string[] = [];
    for (const projRepo of projRepos) {
      const proj = await db.query.project.findFirst({
        where: eq(project.id, projRepo.projectId),
      });
      if (!proj) continue;

      // Only the installation that owns the project may trigger it; otherwise
      // linking someone else's repo would let you receive its pushes.
      const owner = await db.query.githubAccount.findFirst({
        where: eq(githubAccount.userId, proj.userId),
      });
      if (!installationId || owner?.installationId !== installationId) continue;

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
            headCommit.author?.name ||
            headCommit.author?.username ||
            "Unknown",
          branch: branchName,
          status: "queued",
          triggerType: "push",
          deploymentNumber: deploymentNumber,
          production: isProduction,
        })
        .returning();

      await queueDeployment(newDeployment.id);
      deploymentIds.push(newDeployment.id);
    }

    if (deploymentIds.length === 0) {
      return NextResponse.json(
        { error: "Project not found for this repository" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deploymentIds });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
