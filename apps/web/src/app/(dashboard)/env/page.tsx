import Link from "next/link";
import { TerminalSquare, FolderOpen } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Environment Variables | Kyro" };

export default function EnvVariablesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Environment Variables"
        description="Environment variables are managed per project and encrypted with AES-256-GCM."
      />
      <EmptyState
        icon={TerminalSquare}
        title="Managed per project"
        description="Open a project's Environment Variables tab to add, import, and manage encrypted variables for each environment."
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
