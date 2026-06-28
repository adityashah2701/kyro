import { NextRequest, NextResponse } from "next/server";
import { db, schema, eq } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ deploymentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deploymentId } = await params;

    const deployment = await db.query.deployment.findFirst({
      where: eq(schema.deployment.id, deploymentId),
    });

    if (!deployment || deployment.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (deployment.status !== "success") {
      return NextResponse.json(
        { error: "Cannot activate an incomplete or failed deployment" },
        { status: 400 }
      );
    }

    // Mark all deployments for this project as inactive
    await db
      .update(schema.deployment)
      .set({ active: false })
      .where(eq(schema.deployment.projectId, deployment.projectId));

    // Mark this deployment as active
    await db
      .update(schema.deployment)
      .set({ active: true, activatedAt: new Date() })
      .where(eq(schema.deployment.id, deploymentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to activate deployment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
