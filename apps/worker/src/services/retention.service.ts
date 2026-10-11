import { db, schema, eq, and, isNotNull, desc } from "@kyro/database";
import { createStorageFromEnv } from "@kyro/storage";
import { logger } from "../logger";

const storage = createStorageFromEnv();

/** How many successful deployments per project (and per kind) stay rollback-able. */
export const KEEP_DEPLOYMENTS = Math.max(
  1,
  parseInt(process.env.KEEP_DEPLOYMENTS || "5", 10),
);

// Artifacts always live under "deployments/<deploymentId>"; refuse anything else.
const isArtifactPrefix = (p: string | null): p is string =>
  !!p && /^deployments\/[\w-]+$/.test(p);

export class RetentionService {
  /**
   * Deletes artifacts of old successful deployments, keeping the active one and
   * the newest `keep` (production and preview counted separately, so a busy
   * feature branch can't push production history out). The row stays, marked
   * `metadata.pruned`, so build history and logs survive; rollback to it is
   * refused because its files are gone. Returns how many were pruned.
   */
  public static async prune(
    projectId: string,
    keep = KEEP_DEPLOYMENTS,
  ): Promise<number> {
    const rows = await db.query.deployment.findMany({
      where: and(
        eq(schema.deployment.projectId, projectId),
        eq(schema.deployment.status, "success"),
        isNotNull(schema.deployment.artifactLocation),
      ),
      orderBy: [desc(schema.deployment.createdAt)],
    });

    const kept = { production: 0, preview: 0 };
    const stale = rows.filter((row) => {
      const kind = row.production ? "production" : "preview";
      if (row.active || kept[kind] < keep) {
        kept[kind]++;
        return false;
      }
      return true;
    });

    let pruned = 0;
    for (const row of stale) {
      if (!isArtifactPrefix(row.artifactLocation)) {
        logger.warn(
          { deploymentId: row.id, location: row.artifactLocation },
          "Skipping prune: unexpected artifact location",
        );
        continue;
      }
      try {
        await storage.removePrefix(row.artifactLocation);
        await db
          .update(schema.deployment)
          .set({
            artifactLocation: null,
            metadata: {
              ...((row.metadata as object | null) ?? {}),
              pruned: true,
              prunedAt: new Date().toISOString(),
            },
          })
          .where(eq(schema.deployment.id, row.id));
        pruned++;
      } catch (err) {
        // Row stays unpruned, so the next deploy retries it.
        logger.warn({ err, deploymentId: row.id }, "Failed to prune deployment");
      }
    }
    return pruned;
  }

  /** Removes whatever a failed or cancelled build managed to upload. */
  public static async discard(deploymentId: string): Promise<void> {
    try {
      await storage.removePrefix(`deployments/${deploymentId}`);
    } catch (err) {
      logger.warn({ err, deploymentId }, "Failed to discard partial artifacts");
    }
  }

  /** Deletes artifacts for a deleted project (the rows are already gone). */
  public static async purge(prefixes: string[]): Promise<void> {
    for (const prefix of prefixes) {
      if (!isArtifactPrefix(prefix)) {
        logger.warn({ prefix }, "Skipping purge: unexpected artifact prefix");
        continue;
      }
      await storage.removePrefix(prefix);
    }
  }
}
