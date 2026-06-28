"use client";

import { PageHeader } from "@/components/layout/page-header";

export default function ActivityPage() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Activity"
        description="View the recent activity and audit logs for your team."
      />

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50 duration-500">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No recent activity</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Activity logs for deployments, project changes, and team actions
            will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
