"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EnvVariablesPage() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Environment Variables"
        description="Manage environment variables for your projects and deployments."
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Variable
        </Button>
      </PageHeader>

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50 duration-500">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">
            No environment variables
          </h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You haven&apos;t defined any global environment variables yet.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add First Variable
          </Button>
        </div>
      </div>
    </div>
  );
}
