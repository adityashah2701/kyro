import { NextRequest, NextResponse } from "next/server";
import { db } from "@kyro/database";
import { domain } from "@kyro/database/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const domainParam = req.nextUrl.searchParams.get("domain");

  if (!domainParam) {
    return new NextResponse("Missing domain parameter", { status: 400 });
  }

  try {
    // Check if the domain exists in our database
    const existingDomain = await db.query.domain.findFirst({
      where: eq(domain.hostname, domainParam),
    });

    if (existingDomain) {
      // Return 200 OK to tell Caddy to provision the certificate
      return new NextResponse("OK", { status: 200 });
    } else {
      // Return 404 to tell Caddy to reject the request and not provision SSL
      return new NextResponse("Domain not found", { status: 404 });
    }
  } catch (error) {
    console.error("[Caddy Ask] Error checking domain:", error);
    // Return an error status so Caddy doesn't provision if DB fails
    return new NextResponse("Internal Error", { status: 500 });
  }
}
