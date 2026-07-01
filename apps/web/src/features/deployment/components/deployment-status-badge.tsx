import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

export type DeploymentStatus =
  | "queued"
  | "initializing"
  | "cloning"
  | "installing"
  | "building"
  | "uploading"
  | "deploying"
  | "success"
  | "failed"
  | "cancelled";

const spinner = <Loader2 className="mr-1 size-3 animate-spin" />;

const statusConfig: Record<
  DeploymentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  queued: {
    label: "Queued",
    color: "bg-muted text-muted-foreground",
    icon: <Clock className="mr-1 size-3" />,
  },
  initializing: {
    label: "Initializing",
    color: "bg-info/10 text-info",
    icon: spinner,
  },
  cloning: {
    label: "Cloning",
    color: "bg-info/10 text-info",
    icon: spinner,
  },
  installing: {
    label: "Installing",
    color: "bg-info/10 text-info",
    icon: spinner,
  },
  building: {
    label: "Building",
    color: "bg-warning/10 text-warning",
    icon: spinner,
  },
  uploading: {
    label: "Uploading",
    color: "bg-brand/10 text-brand",
    icon: spinner,
  },
  deploying: {
    label: "Deploying",
    color: "bg-brand/10 text-brand",
    icon: spinner,
  },
  success: {
    label: "Success",
    color: "bg-success/10 text-success",
    icon: <CheckCircle2 className="mr-1 size-3" />,
  },
  failed: {
    label: "Failed",
    color: "bg-destructive/10 text-destructive",
    icon: <XCircle className="mr-1 size-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground",
    icon: <AlertCircle className="mr-1 size-3" />,
  },
};

export function DeploymentStatusBadge({
  status,
}: {
  status: DeploymentStatus | string;
}) {
  const config =
    statusConfig[status as DeploymentStatus] || statusConfig.queued;

  return (
    <Badge
      variant="secondary"
      className={`${config.color} border-0 font-medium`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
