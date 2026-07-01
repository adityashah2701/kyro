import { Activity } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Activity | Kyro" };

export default function ActivityPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Activity"
        description="Recent activity and audit logs across your workspace."
      />
      <EmptyState
        icon={Activity}
        title="No recent activity"
        description="Activity from deployments, project changes, and domain updates will appear here as you use Kyro."
      />
    </PageContainer>
  );
}
