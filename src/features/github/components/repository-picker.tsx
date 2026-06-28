"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  GitBranch,
  Lock,
  Globe,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import {
  fetchRepositories,
  linkRepositoryToProject,
  Repository,
} from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RepositoryPicker({ projectId }: { projectId: string }) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadRepos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchRepositories();
      if (res.success && res.repositories) {
        setRepos(res.repositories);
      } else {
        setError(res.error || "Failed to load repositories");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const res = await fetchRepositories();
        if (!isMounted) return;
        if (res.success && res.repositories) {
          setRepos(res.repositories);
        } else {
          setError(res.error || "Failed to load repositories");
        }
      } catch (err) {
        if (isMounted) {
          setError("An unexpected error occurred");
          console.log(err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLink = async (repo: Repository) => {
    try {
      setIsLinking(repo.id.toString());
      const res = await linkRepositoryToProject(projectId, repo);
      if (res.success) {
        toast.success(`Linked to ${repo.name}`);
        router.refresh(); // Will reflect linked state in parent
      } else {
        toast.error("Failed to link repository");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.log(err);
    } finally {
      setIsLinking(null);
    }
  };

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (error === "GitHub not connected") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link a Repository</CardTitle>
          <CardDescription>
            Connect your GitHub account to link a repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/settings")}>
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Link a Repository</CardTitle>
          <CardDescription>
            Select a GitHub repository to deploy.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadRepos}
          disabled={isLoading}
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading && repos.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-32 items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No repositories found.
          </div>
        ) : (
          <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-2">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                    {repo.private ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">
                      {repo.full_name}
                    </span>
                    <span className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                      <GitBranch className="h-3 w-3" />
                      {repo.default_branch}
                      <span>•</span>
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLink(repo)}
                  disabled={isLinking === repo.id.toString()}
                >
                  {isLinking === repo.id.toString() ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Link"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
