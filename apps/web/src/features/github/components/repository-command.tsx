/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Lock,
  Globe,
  GitBranch,
  RefreshCw,
  Loader2,
  FolderGit2,
  Clock,
  Check,
} from "lucide-react";
import Link from "next/link";
import { fetchRepositories, type Repository } from "../actions";

const RECENTS_KEY = "kyro:recent-repos";
const MAX_RECENTS = 4;

// Module-level cache so re-opening the picker doesn't refetch every time.
let repoCache: Repository[] | null = null;

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(fullName: string) {
  if (typeof window === "undefined") return;
  try {
    const next = [
      fullName,
      ...readRecents().filter((r) => r !== fullName),
    ].slice(0, MAX_RECENTS);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function RepositoryCommand({
  onSelect,
  selectedRepoId,
  linkingRepoId,
  emptyHint = "No repositories match your search.",
}: {
  onSelect: (repo: Repository) => void;
  /** Id of the currently-selected repo (shows a check). */
  selectedRepoId?: string | number | null;
  /** Id of a repo currently being linked (shows a spinner). */
  linkingRepoId?: string | number | null;
  emptyHint?: string;
}) {
  const [repos, setRepos] = useState<Repository[]>(repoCache ?? []);
  const [loading, setLoading] = useState(!repoCache);
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>([]);

  const load = useCallback(async (force = false) => {
    if (repoCache && !force) {
      setRepos(repoCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRepositories();
      if (res.success && res.repositories) {
        repoCache = res.repositories;
        setRepos(res.repositories);
      } else {
        setError(res.error || "Failed to load repositories");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRecents(readRecents());
    load();
  }, [load]);

  const handleSelect = useCallback(
    (repo: Repository) => {
      pushRecent(repo.full_name);
      setRecents(readRecents());
      onSelect(repo);
    },
    [onSelect]
  );

  // Group repos by owner for org-style sections.
  const groups = useMemo(() => {
    const map = new Map<string, Repository[]>();
    for (const repo of repos) {
      const owner = repo.owner.login;
      if (!map.has(owner)) map.set(owner, []);
      map.get(owner)!.push(repo);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [repos]);

  const recentRepos = useMemo(() => {
    if (!recents.length) return [];
    return recents
      .map((name) => repos.find((r) => r.full_name === name))
      .filter((r): r is Repository => Boolean(r));
  }, [recents, repos]);

  if (error === "GitHub not connected") {
    return (
      <EmptyState
        icon={FolderGit2}
        title="GitHub not connected"
        description="Connect your GitHub account to import a repository."
        action={
          <Button nativeButton={false} render={<Link href="/settings" />}>
            Connect GitHub
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card border shadow-sm">
      <Command
        className="bg-transparent"
        // Removed custom filter to rely on cmdk's excellent default fuzzy search (command-score)
      >
        <div className="flex items-center gap-2 border-b px-3 py-1 bg-muted/20">
          <div className="flex-1">
            <CommandInput
              placeholder="Search repositories..."
              autoFocus
              className="h-11 border-0 focus:ring-0 text-sm bg-transparent w-full outline-none"
            />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => load(true)}
            disabled={loading}
            title="Refresh repositories"
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </div>

        <CommandList className="max-h-[360px]">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-8 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 p-8 text-sm text-muted-foreground">
              {error}
              <Button variant="outline" size="sm" onClick={() => load(true)}>
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </div>
          ) : (
            <>
              <CommandEmpty>{emptyHint}</CommandEmpty>

              {recentRepos.length > 0 && (
                <CommandGroup heading="Recently used">
                  {recentRepos.map((repo) => (
                    <RepoItem
                      key={`recent-${repo.id}`}
                      keyPrefix="recent"
                      repo={repo}
                      onSelect={handleSelect}
                      selected={
                        selectedRepoId != null &&
                        String(selectedRepoId) === String(repo.id)
                      }
                      linking={
                        linkingRepoId != null &&
                        String(linkingRepoId) === String(repo.id)
                      }
                    />
                  ))}
                </CommandGroup>
              )}

              {groups.map(([owner, ownerRepos]) => (
                <CommandGroup key={owner} heading={owner}>
                  {ownerRepos.map((repo) => (
                    <RepoItem
                      key={repo.id}
                      keyPrefix="repo"
                      repo={repo}
                      onSelect={handleSelect}
                      selected={
                        selectedRepoId != null &&
                        String(selectedRepoId) === String(repo.id)
                      }
                      linking={
                        linkingRepoId != null &&
                        String(linkingRepoId) === String(repo.id)
                      }
                    />
                  ))}
                </CommandGroup>
              ))}
            </>
          )}
        </CommandList>
      </Command>
    </div>
  );
}

function RepoItem({
  repo,
  onSelect,
  selected,
  linking,
  keyPrefix,
}: {
  repo: Repository;
  onSelect: (repo: Repository) => void;
  selected: boolean;
  linking: boolean;
  keyPrefix: string;
}) {
  return (
    <CommandItem
      value={`${keyPrefix}:${repo.full_name}`}
      keywords={[repo.full_name, repo.name, repo.owner.login]}
      onSelect={() => onSelect(repo)}
      className="gap-3 py-2 [&>svg:last-child]:hidden"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        {keyPrefix === "recent" ? (
          <Clock className="size-4 text-muted-foreground" />
        ) : repo.private ? (
          <Lock className="size-4" />
        ) : (
          <Globe className="size-4" />
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{repo.name}</span>
        <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <GitBranch className="size-3" />
          {repo.default_branch}
          <span className="text-muted-foreground/50">·</span>
          {repo.owner.login}
        </span>
      </div>
      <div className="ml-auto flex items-center">
        {linking ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : selected ? (
          <Check className="size-4 text-success" />
        ) : null}
      </div>
    </CommandItem>
  );
}
