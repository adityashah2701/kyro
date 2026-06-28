import { db, schema, eq, and } from "@kyro/database";

export interface ResolvedRoute {
  deploymentId: string;
  projectId: string;
  artifactLocation: string;
}

export class RoutingService {
  /**
   * Resolves an incoming host (e.g. project-hash.localhost or project.localhost)
   * to the correct deployment artifact location.
   */
  public static async resolveHost(host: string): Promise<ResolvedRoute | null> {
    // Example hosts:
    // project-slug.localhost -> active deployment
    // project-slug-hash.localhost -> specific preview deployment

    // Strip port if present
    const hostname = host.split(":")[0];

    // For local testing, we assume domains end with .localhost
    // In production, it would be .kyro.dev
    const baseDomain = process.env.BASE_DOMAIN || "localhost";

    if (!hostname.endsWith(`.${baseDomain}`)) {
      return null;
    }

    const subdomain = hostname.replace(`.${baseDomain}`, "");

    // Try to find a specific preview URL first
    // Since previewUrl is saved as "projectId-hash.localhost" in processor.ts, wait!
    // Ah, in processor.ts we saved previewUrl = `${deploymentRecord.projectId}-${hash}.localhost`
    // Let's query by previewUrl exactly.
    const previewMatch = await db.query.deployment.findFirst({
      where: eq(schema.deployment.previewUrl, hostname),
    });

    if (previewMatch && previewMatch.artifactLocation) {
      return {
        deploymentId: previewMatch.id,
        projectId: previewMatch.projectId,
        artifactLocation: previewMatch.artifactLocation,
      };
    }

    // If not a preview URL, maybe it's the project's active deployment?
    // Project slug = subdomain
    const projectMatch = await db.query.project.findFirst({
      where: eq(schema.project.slug, subdomain),
    });

    if (projectMatch) {
      // Find the active deployment for this project
      const activeDeployment = await db.query.deployment.findFirst({
        where: and(
          eq(schema.deployment.projectId, projectMatch.id),
          eq(schema.deployment.active, true),
          eq(schema.deployment.status, "success"),
        ),
      });

      if (activeDeployment && activeDeployment.artifactLocation) {
        return {
          deploymentId: activeDeployment.id,
          projectId: projectMatch.id,
          artifactLocation: activeDeployment.artifactLocation,
        };
      }
    }

    return null;
  }
}
