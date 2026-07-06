"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isPendingStatus } from "../types";

/**
 * Refreshes the current server component tree on an interval while the
 * deployment is still in a pending state, so status/timestamps stay live
 * without a client-side data layer. No-op once the deployment is terminal.
 */
export function DeploymentLiveRefresh({
  status,
  intervalMs = 2500,
}: {
  status: string;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isPendingStatus(status)) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [status, intervalMs, router]);

  return null;
}
