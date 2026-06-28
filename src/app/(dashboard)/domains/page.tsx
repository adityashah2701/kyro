"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DomainsPage() {
  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Domains"
        description="Manage your custom domains and SSL certificates."
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </PageHeader>

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50 duration-500">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No domains configured</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Connect a custom domain to your projects to make them accessible to
            the world.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Domain
          </Button>
        </div>
      </div>
    </div>
  );
}
