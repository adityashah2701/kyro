"use client";

import { useWizard } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { RepositoryCommand } from "@/features/github/components/repository-command";

export function RepositoryStep() {
  const { state, updateState, setCurrentStep } = useWizard();

  const handleNext = () => {
    setCurrentStep(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Connect Repository
        </h2>
        <p className="text-muted-foreground mt-1">
          Select a Git repository to deploy. You can skip this and link one
          later.
        </p>
      </div>

      <RepositoryCommand
        onSelect={(repo) =>
          updateState({
            repository: repo,
            branch: repo.default_branch,
          })
        }
        selectedRepoId={state.repository?.id}
      />

      <div className="flex justify-between pt-4">
        <div className="flex-1" />
        <Button onClick={handleNext} disabled={!state.repository}>
          Next Step <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
