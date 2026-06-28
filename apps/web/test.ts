import { db, schema } from "@kyro/database";
import { queueDeployment } from "./src/features/deployment/services/deployment.service";

async function test() {
  try {
    const project = await db.query.project.findFirst();
    if (!project) throw new Error("No project found");
    const newDeployment = await db
      .insert(schema.deployment)
      .values({
        projectId: project.id,
        userId: project.userId,
        triggerType: "manual",
        branch: "main",
        status: "queued",
      })
      .returning();
    console.log("Inserted deployment:", newDeployment[0].id);
    await queueDeployment(newDeployment[0].id);
    console.log("Queued successfully!");
  } catch (e) {
    console.error("FAILED:", e);
  }
  process.exit(0);
}
test();
