"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Loader2 } from "lucide-react";
import { triggerDeploymentAction } from "../actions";
import { toast } from "sonner";

export function DeployButton({
  projectId,
  isRepositoryLinked,
}: {
  projectId: string;
  isRepositoryLinked: boolean;
}) {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    if (!isRepositoryLinked) {
      toast.error("Please link a GitHub repository first.");
      return;
    }

    try {
      setIsDeploying(true);
      await triggerDeploymentAction(projectId);
      toast.success("Deployment triggered successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to trigger deployment.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Button
      onClick={handleDeploy}
      disabled={isDeploying || !isRepositoryLinked}
      size="sm"
    >
      {isDeploying ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Rocket className="mr-2 h-4 w-4" />
      )}
      Deploy Now
    </Button>
  );
}
