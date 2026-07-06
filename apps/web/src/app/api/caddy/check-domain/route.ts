import { NextRequest, NextResponse } from "next/server";
import { db } from "@kyro/database";
import { domain, deployment, project } from "@kyro/database/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const domainParam = req.nextUrl.searchParams.get("domain");

  if (!domainParam) {
    return new NextResponse("Missing domain parameter", { status: 400 });
  }

  try {
    const baseDomain = process.env.BASE_DOMAIN || "localhost";
    const isSystemDomain = domainParam.endsWith(`.${baseDomain}`);

    if (!isSystemDomain) {
      // 1. Check if the custom domain exists in our database
      const existingDomain = await db.query.domain.findFirst({
        where: eq(domain.hostname, domainParam),
      });

      if (existingDomain) {
        // Return 200 OK to tell Caddy to provision the certificate
        return new NextResponse("OK", { status: 200 });
      }
    } else {
      // 2. Check system domains (preview URLs and project default domains)

      // Check if it's a specific preview URL
      const previewMatch = await db.query.deployment.findFirst({
        where: eq(deployment.previewUrl, domainParam),
      });

      if (previewMatch) {
        return new NextResponse("OK", { status: 200 });
      }

      // Check if it's a project default domain
      const subdomain = domainParam.replace(`.${baseDomain}`, "");
      const projectMatch = await db.query.project.findFirst({
        where: eq(project.slug, subdomain),
      });

      if (projectMatch) {
        return new NextResponse("OK", { status: 200 });
      }
    }

    // Return 404 to tell Caddy to reject the request and not provision SSL
    return new NextResponse("Domain not found", { status: 404 });
  } catch (error) {
    console.error("[Caddy Ask] Error checking domain:", error);
    // Return an error status so Caddy doesn't provision if DB fails
    return new NextResponse("Internal Error", { status: 500 });
  }
}
