"use client";

import { useEffect, useState } from "react";
import { useWizard } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { fetchRepositories, type Repository } from "@/features/github/actions";
import { ArrowLeft, ArrowRight, GitBranch, Loader2 } from "lucide-react";

export function RepositoryStep() {
  const { state, updateState, setCurrentStep } = useWizard();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetchRepositories();
      if (res.success && res.repositories) {
        setRepos(res.repositories);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleNext = () => {
    setCurrentStep(3);
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

      <div className="min-h-[300px] border rounded-lg p-4 bg-card">
        {loading ? (
          <div className="flex h-full items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : repos.length > 0 ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {repos.map((repo) => {
              const isSelected = state.repository?.id === repo.id;
              return (
                <div
                  key={repo.id}
                  onClick={() =>
                    updateState({
                      repository: repo,
                      branch: repo.default_branch,
                    })
                  }
                  className={`flex cursor-pointer items-center justify-between rounded-md border p-3 hover:border-primary transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{repo.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {repo.private ? "Private" : "Public"} • default:{" "}
                        {repo.default_branch}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="font-medium">No repositories found</p>
            <p className="text-sm text-muted-foreground">
              Connect your GitHub account in settings.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleNext}>
          {state.repository ? "Next Step" : "Skip & Continue"}{" "}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
