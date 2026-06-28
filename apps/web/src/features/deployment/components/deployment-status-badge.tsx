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

const statusConfig: Record<
  DeploymentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  queued: {
    label: "Queued",
    color: "bg-muted text-muted-foreground hover:bg-muted",
    icon: <Clock className="w-3 h-3 mr-1" />,
  },
  initializing: {
    label: "Initializing",
    color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
  },
  cloning: {
    label: "Cloning",
    color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
  },
  installing: {
    label: "Installing",
    color: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
    icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
  },
  building: {
    label: "Building",
    color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
    icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
  },
  uploading: {
    label: "Uploading",
    color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
  },
  deploying: {
    label: "Deploying",
    color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
  },
  success: {
    label: "Success",
    color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
  },
  failed: {
    label: "Failed",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    icon: <XCircle className="w-3 h-3 mr-1" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground hover:bg-muted",
    icon: <AlertCircle className="w-3 h-3 mr-1" />,
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
