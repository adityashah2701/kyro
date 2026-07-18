import { db, schema, eq, and } from "@kyro/database";

export interface ResolvedRoute {
  deploymentId: string;
  projectId: string;
  artifactLocation: string;
  startCommand: string | null;
  nodeVersion: string;
  maintenanceMode: boolean;
  passwordProtectionEnabled: boolean;
  passwordProtectionPassword: string | null;
  webAnalyticsEnabled: boolean;
}

/** Extracts the node major version recorded on a deployment, defaulting to 20. */
function nodeVersionOf(deployment: { metadata?: unknown }): string {
  const meta = deployment.metadata as { nodeVersion?: string } | null;
  return meta?.nodeVersion || "20";
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

    // 1. Check Custom Domains first
    const customDomainMatch = await db.query.domain.findFirst({
      where: and(
        eq(schema.domain.hostname, hostname),
        eq(schema.domain.verificationStatus, "verified"),
      ),
    });

    if (customDomainMatch) {
      const activeDeployment = await db.query.deployment.findFirst({
        where: and(
          eq(schema.deployment.projectId, customDomainMatch.projectId),
          eq(schema.deployment.active, true),
          eq(schema.deployment.status, "success"),
        ),
      });

      if (activeDeployment && activeDeployment.artifactLocation) {
        const proj = await db.query.project.findFirst({
          where: eq(schema.project.id, customDomainMatch.projectId),
        });
        return {
          deploymentId: activeDeployment.id,
          projectId: customDomainMatch.projectId,
          artifactLocation: activeDeployment.artifactLocation,
          startCommand: proj?.startCommand || null,
          nodeVersion: nodeVersionOf(activeDeployment),
          maintenanceMode: proj?.maintenanceMode ?? false,
          passwordProtectionEnabled: proj?.passwordProtectionEnabled ?? false,
          passwordProtectionPassword: proj?.passwordProtectionPassword ?? null,
          webAnalyticsEnabled: proj?.webAnalyticsEnabled ?? false,
        };
      }
    }

    // 2. Check system domains (e.g. project-hash.localhost or project.localhost)
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
      const proj = await db.query.project.findFirst({
        where: eq(schema.project.id, previewMatch.projectId),
      });
      return {
        deploymentId: previewMatch.id,
        projectId: previewMatch.projectId,
        artifactLocation: previewMatch.artifactLocation,
        startCommand: proj?.startCommand || null,
        nodeVersion: nodeVersionOf(previewMatch),
        maintenanceMode: proj?.maintenanceMode ?? false,
        passwordProtectionEnabled: proj?.passwordProtectionEnabled ?? false,
        passwordProtectionPassword: proj?.passwordProtectionPassword ?? null,
        webAnalyticsEnabled: proj?.webAnalyticsEnabled ?? false,
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
          startCommand: projectMatch.startCommand || null,
          nodeVersion: nodeVersionOf(activeDeployment),
          maintenanceMode: projectMatch.maintenanceMode ?? false,
          passwordProtectionEnabled:
            projectMatch.passwordProtectionEnabled ?? false,
          passwordProtectionPassword:
            projectMatch.passwordProtectionPassword ?? null,
          webAnalyticsEnabled: projectMatch.webAnalyticsEnabled ?? false,
        };
      }
    }

    return null;
  }
}
