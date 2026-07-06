import Link from "next/link";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { DeploymentActions } from "./deployment-actions";
import { DeploymentSubnav } from "./deployment-subnav";
import { Badge } from "@/components/ui/badge";

type HeaderDeployment = {
  id: string;
  deploymentNumber: number;
  status: string;
  active: boolean | null;
  previewUrl: string | null;
  projectId: string;
  branch: string;
};

type HeaderProject = { id: string; name: string; slug: string } | null;

/**
 * Shared header for the deployment detail + logs routes: breadcrumb, title,
 * status, primary actions, and the URL-addressable sub-navigation.
 */
export function DeploymentDetailHeader({
  deployment,
  project,
}: {
  deployment: HeaderDeployment;
  project: HeaderProject;
}) {
  return (
    <div className="space-y-5">
      <nav className="flex items-center text-sm text-muted-foreground">
        <Link
          href="/projects"
          className="transition-colors hover:text-foreground"
        >
          Projects
        </Link>
        <span className="mx-2">/</span>
        {project ? (
          <Link
            href={`/projects/${project.id}`}
            className="transition-colors hover:text-foreground"
          >
            {project.name}
          </Link>
        ) : (
          <span>Unknown project</span>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">
          Deployment #{deployment.deploymentNumber}
        </span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Deployment #{deployment.deploymentNumber}
          </h1>
          <DeploymentStatusBadge status={deployment.status} />
          {deployment.active && (
            <Badge className="border-0 bg-success/10 text-success">
              Active
            </Badge>
          )}
        </div>
        <DeploymentActions
          deployment={{
            id: deployment.id,
            status: deployment.status,
            active: deployment.active,
            previewUrl: deployment.previewUrl,
            projectId: deployment.projectId,
          }}
        />
      </div>

      <DeploymentSubnav deploymentId={deployment.id} />
    </div>
  );
}
