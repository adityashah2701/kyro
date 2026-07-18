"use server";

import { db, schema, eq, and, sql } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function authorizeProject(projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const proj = await db.query.project.findFirst({
    where: and(
      eq(schema.project.id, projectId),
      eq(schema.project.userId, session.user.id)
    ),
  });

  return proj || null;
}

export interface AnalyticsSummary {
  totalRequests: number;
  totalBandwidth: number;
  avgResponseTime: number;
  uniquePaths: number;
}

export async function getAnalyticsSummary(
  projectId: string
): Promise<AnalyticsSummary> {
  const proj = await authorizeProject(projectId);
  if (!proj)
    return {
      totalRequests: 0,
      totalBandwidth: 0,
      avgResponseTime: 0,
      uniquePaths: 0,
    };

  const result = await db
    .select({
      totalRequests: sql<number>`count(*)::int`,
      totalBandwidth: sql<number>`coalesce(sum(${schema.analyticsEvent.bytesServed}), 0)::bigint`,
      avgResponseTime: sql<number>`coalesce(avg(${schema.analyticsEvent.responseTime}), 0)::int`,
      uniquePaths: sql<number>`count(distinct ${schema.analyticsEvent.path})::int`,
    })
    .from(schema.analyticsEvent)
    .where(
      and(
        eq(schema.analyticsEvent.projectId, projectId),
        sql`${schema.analyticsEvent.timestamp} > now() - interval '30 days'`
      )
    );

  return (
    result[0] || {
      totalRequests: 0,
      totalBandwidth: 0,
      avgResponseTime: 0,
      uniquePaths: 0,
    }
  );
}

export interface TopPage {
  path: string;
  count: number;
}

export async function getTopPages(projectId: string): Promise<TopPage[]> {
  const proj = await authorizeProject(projectId);
  if (!proj) return [];

  const result = await db
    .select({
      path: schema.analyticsEvent.path,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.analyticsEvent)
    .where(
      and(
        eq(schema.analyticsEvent.projectId, projectId),
        sql`${schema.analyticsEvent.timestamp} > now() - interval '30 days'`
      )
    )
    .groupBy(schema.analyticsEvent.path)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  return result;
}

export interface RequestsPerDay {
  date: string;
  count: number;
}

export async function getRequestsOverTime(
  projectId: string
): Promise<RequestsPerDay[]> {
  const proj = await authorizeProject(projectId);
  if (!proj) return [];

  const result = await db
    .select({
      date: sql<string>`to_char(${schema.analyticsEvent.timestamp}::date, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.analyticsEvent)
    .where(
      and(
        eq(schema.analyticsEvent.projectId, projectId),
        sql`${schema.analyticsEvent.timestamp} > now() - interval '14 days'`
      )
    )
    .groupBy(sql`${schema.analyticsEvent.timestamp}::date`)
    .orderBy(sql`${schema.analyticsEvent.timestamp}::date asc`);

  return result;
}

export interface TopReferer {
  referer: string;
  count: number;
}

export async function getTopReferers(projectId: string): Promise<TopReferer[]> {
  const proj = await authorizeProject(projectId);
  if (!proj) return [];

  const result = await db
    .select({
      referer: sql<string>`coalesce(${schema.analyticsEvent.referer}, 'Direct')`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.analyticsEvent)
    .where(
      and(
        eq(schema.analyticsEvent.projectId, projectId),
        sql`${schema.analyticsEvent.timestamp} > now() - interval '30 days'`
      )
    )
    .groupBy(schema.analyticsEvent.referer)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  return result;
}

export interface BrowserStat {
  browser: string;
  count: number;
}

export async function getBrowserStats(
  projectId: string
): Promise<BrowserStat[]> {
  const proj = await authorizeProject(projectId);
  if (!proj) return [];

  const result = await db
    .select({
      browser: sql<string>`coalesce(${schema.analyticsEvent.browser}, 'Unknown')`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.analyticsEvent)
    .where(
      and(
        eq(schema.analyticsEvent.projectId, projectId),
        sql`${schema.analyticsEvent.timestamp} > now() - interval '30 days'`
      )
    )
    .groupBy(schema.analyticsEvent.browser)
    .orderBy(sql`count(*) desc`)
    .limit(8);

  return result;
}
