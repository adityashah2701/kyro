"use client";

import { PageHeader } from "@/components/layout/page-header";

export default function DeploymentsPage() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Deployments"
        description="View the status of your recent deployments."
      />

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50 duration-500">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No deployments</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You don&apos;t have any deployments yet. Push code to a connected
            repository to trigger a deployment.
          </p>
        </div>
      </div>
    </div>
  );
}
