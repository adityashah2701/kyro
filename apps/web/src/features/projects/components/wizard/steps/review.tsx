"use client";

import { useState } from "react";
import { useWizard } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Loader2, CheckCircle2 } from "lucide-react";
import { createProject } from "../../../actions";
import { linkRepositoryToProject } from "@/features/github/actions";
import { addVariableAction } from "@/features/environment/actions";
import { toast } from "sonner";
import { frameworkRegistry } from "../../../frameworks/registry";
import type { FrameworkDefinition } from "../../../frameworks/types";

export function ReviewStep({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { state, setCurrentStep } = useWizard();
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState("");

  const handleDeploy = async () => {
    setIsDeploying(true);

    try {
      // 1. Create Project
      setProgress("Creating project...");
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const finalSlug = `${state.slug}-${randomSuffix}`;

      const fw = frameworkRegistry.find(
        (f: FrameworkDefinition) => f.id === state.frameworkId
      );

      const projectRes = await createProject({
        name: state.name,
        slug: finalSlug,
        description: state.description,
        framework: fw?.name || "Other",
        visibility: state.visibility,
        buildCommand: state.buildCommand,
        installCommand: state.installCommand,
        startCommand: state.startCommand,
        outputDirectory: state.outputDirectory,
        rootDirectory: state.rootDirectory,
      });

      if (projectRes.error || !projectRes.project) {
        throw new Error(projectRes.error || "Failed to create project");
      }

      const projectId = projectRes.project.id;

      // 2. Link Repository
      if (state.repository) {
        setProgress("Linking repository...");
        await linkRepositoryToProject(projectId, state.repository);
      }

      // 3. Add Environment Variables
      if (state.envVars.length > 0) {
        setProgress("Saving environment variables...");
        for (const envVar of state.envVars) {
          await addVariableAction(projectId, {
            key: envVar.key,
            value: envVar.value,
            environment: envVar.environment,
            isSecret: envVar.isSecret,
          });
        }
      }

      setProgress("Ready to deploy!");
      toast.success("Project created successfully!");

      // Close wizard
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred during deployment setup"
      );
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review & Create</h2>
        <p className="text-muted-foreground mt-1">
          Everything looks good. You are ready to deploy your new project.
        </p>
      </div>

      <div className="space-y-4 text-sm">
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b font-medium">
            Project
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Name</div>
            <div className="font-medium text-right">{state.name}</div>
            <div className="text-muted-foreground">Slug</div>
            <div className="font-medium text-right">{state.slug}</div>
            <div className="text-muted-foreground">Visibility</div>
            <div className="font-medium text-right capitalize">
              {state.visibility}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b font-medium">
            Source & Build
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Repository</div>
            <div className="font-medium text-right truncate">
              {state.repository ? state.repository.full_name : "None (Manual)"}
            </div>
            <div className="text-muted-foreground">Framework</div>
            <div className="font-medium text-right">
              {frameworkRegistry.find(
                (f: FrameworkDefinition) => f.id === state.frameworkId
              )?.name || "Unknown"}
            </div>
            <div className="text-muted-foreground">Build Command</div>
            <div className="font-mono text-xs text-right truncate">
              {state.buildCommand || "-"}
            </div>
            <div className="text-muted-foreground">Output Directory</div>
            <div className="font-mono text-xs text-right truncate">
              {state.outputDirectory || "-"}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b font-medium">
            Environment
          </div>
          <div className="p-4 flex justify-between">
            <div className="text-muted-foreground">Variables configured</div>
            <div className="font-medium">{state.envVars.length}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 items-center">
        {!isDeploying ? (
          <Button variant="outline" onClick={() => setCurrentStep(4)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground animate-pulse flex items-center">
            {progress}
          </div>
        )}

        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {isDeploying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : progress === "Ready to deploy!" ? (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          {isDeploying ? "Setting up..." : "Deploy"}
        </Button>
      </div>
    </div>
  );
}
