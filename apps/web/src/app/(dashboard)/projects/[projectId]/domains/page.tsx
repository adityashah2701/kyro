import { DomainService } from "@/features/domains/services/domain.service";
import { DomainsTab } from "@/features/domains/components/domains-tab";

export default async function DomainsPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const params = await props.params;
  const projectDomains = await DomainService.getProjectDomains(
    params.projectId
  );

  return <DomainsTab domains={projectDomains} projectId={params.projectId} />;
}
