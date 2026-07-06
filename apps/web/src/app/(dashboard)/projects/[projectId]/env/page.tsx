import { EnvService } from "@/features/environment/services/env.service";
import { EnvTab } from "@/features/environment/components/env-tab";

export default async function EnvPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const params = await props.params;
  const envVariables = await EnvService.getVariables(params.projectId);

  return <EnvTab variables={envVariables} projectId={params.projectId} />;
}
