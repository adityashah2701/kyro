import { db } from "@kyro/database";
import { domain } from "@kyro/database/schema";
import { eq, and } from "@kyro/database";
import { DnsCheckerService } from "./dns.service";
import { getSslProvider } from "./ssl.service";

export class DomainService {
  public static async addDomain(projectId: string, hostname: string) {
    // 1. Check if domain already exists globally
    const existing = await db.query.domain.findFirst({
      where: eq(domain.hostname, hostname),
    });

    if (existing) {
      throw new Error("Domain is already in use by another project.");
    }

    // 2. Check if this is the first domain for the project to set as primary
    const projectDomains = await db.query.domain.findMany({
      where: eq(domain.projectId, projectId),
    });
    const isPrimary = projectDomains.length === 0;

    // 3. Insert domain record
    const [newDomain] = await db
      .insert(domain)
      .values({
        projectId,
        hostname,
        isPrimary,
        verificationStatus: "pending",
        dnsStatus: "pending",
        sslStatus: "pending",
      })
      .returning();

    return newDomain;
  }

  public static async verifyDomain(domainId: string, projectId: string) {
    const domainRecord = await db.query.domain.findFirst({
      where: and(eq(domain.id, domainId), eq(domain.projectId, projectId)),
    });

    if (!domainRecord) {
      throw new Error("Domain not found.");
    }

    // Update status to verifying
    await db
      .update(domain)
      .set({ verificationStatus: "verifying" })
      .where(eq(domain.id, domainId));

    // 1. Check DNS
    const dnsResult = await DnsCheckerService.verifyOwnership(
      domainRecord.hostname
    );

    if (!dnsResult.verified) {
      const [updated] = await db
        .update(domain)
        .set({
          verificationStatus: "failed",
          dnsStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(domain.id, domainId))
        .returning();
      return updated;
    }

    // DNS is verified
    await db
      .update(domain)
      .set({
        verificationStatus: "verified",
        dnsStatus: "configured",
        verifiedAt: new Date(),
        sslStatus: "issuing",
        updatedAt: new Date(),
      })
      .where(eq(domain.id, domainId));

    // 2. Issue SSL Certificate (Fire and Forget or await)
    // For MVP, we await it since we are using a fast Mock
    try {
      const sslProvider = getSslProvider();
      const sslResult = await sslProvider.issueCertificate(
        domainRecord.hostname
      );

      if (sslResult.status === "ready") {
        const [updated] = await db
          .update(domain)
          .set({
            sslStatus: "ready",
            updatedAt: new Date(),
          })
          .where(eq(domain.id, domainId))
          .returning();
        return updated;
      } else {
        const [updated] = await db
          .update(domain)
          .set({
            sslStatus: "failed",
            updatedAt: new Date(),
          })
          .where(eq(domain.id, domainId))
          .returning();
        return updated;
      }
    } catch (error) {
      console.error("SSL Issuance failed:", error);
      const [updated] = await db
        .update(domain)
        .set({
          sslStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(domain.id, domainId))
        .returning();
      return updated;
    }
  }

  public static async deleteDomain(domainId: string, projectId: string) {
    const [deleted] = await db
      .delete(domain)
      .where(and(eq(domain.id, domainId), eq(domain.projectId, projectId)))
      .returning();

    if (!deleted) {
      throw new Error("Domain not found or unauthorized.");
    }
    return deleted;
  }

  public static async setPrimaryDomain(domainId: string, projectId: string) {
    // Unset current primary
    await db
      .update(domain)
      .set({ isPrimary: false })
      .where(eq(domain.projectId, projectId));

    // Set new primary
    const [updated] = await db
      .update(domain)
      .set({ isPrimary: true })
      .where(and(eq(domain.id, domainId), eq(domain.projectId, projectId)))
      .returning();

    if (!updated) {
      throw new Error("Domain not found or unauthorized.");
    }

    return updated;
  }

  public static async getProjectDomains(projectId: string) {
    return await db.query.domain.findMany({
      where: eq(domain.projectId, projectId),
    });
  }
}
