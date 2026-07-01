import Link from "next/link";
import { Globe, FolderOpen } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Domains | Kyro" };

export default function DomainsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Domains"
        description="Manage custom domains and SSL certificates."
      />
      <EmptyState
        icon={Globe}
        title="No domains configured"
        description="Custom domains are attached to a project. Open a project's Domains tab to connect a domain and configure DNS."
        action={
          <Button nativeButton={false} render={<Link href="/projects" />}>
            <FolderOpen className="size-4" />
            Go to Projects
          </Button>
        }
      />
    </PageContainer>
  );
}
