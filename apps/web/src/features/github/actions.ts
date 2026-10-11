/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@kyro/database";
import {
  account,
  githubAccount,
  projectRepository,
  project,
} from "@kyro/database/schema";
import { and, eq } from "@kyro/database";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getInstallationOctokit, hasGitHubConfig } from "./github-client";

/**
 * Proves the signed-in user owns a GitHub App installation. Installation ids are
 * sequential, so without this anyone could claim someone else's installation
 * and list their private repos.
 */
async function assertInstallationOwnedBy(
  userId: string,
  installationId: string,
  installationAccount: { id?: number; type?: string } | null,
) {
  const ghAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "github")),
  });

  // Personal installation: its account id is the user's GitHub id.
  if (
    installationAccount?.type === "User" &&
    ghAccount &&
    String(installationAccount.id) === ghAccount.accountId
  ) {
    return;
  }

  // Organisation installation: ask GitHub which installations the user can see.
  try {
    const { accessToken } = await auth.api.getAccessToken({
      body: { providerId: "github" },
      headers: await headers(),
    });
    const res = await fetch(
      "https://api.github.com/user/installations?per_page=100",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    if (res.ok) {
      const body = (await res.json()) as { installations?: { id: number }[] };
      if (body.installations?.some((i) => String(i.id) === installationId)) {
        return;
      }
    }
  } catch (e) {
    console.error("Failed to verify GitHub installation ownership", e);
  }

  throw new Error("You do not have access to this GitHub installation.");
}

export async function connectGitHub(installationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check if installation is already linked to someone else
  const existing = await db.query.githubAccount.findFirst({
    where: eq(githubAccount.installationId, installationId),
  });

  if (existing && existing.userId !== session.user.id) {
    throw new Error(
      "This GitHub App installation is already connected to another account."
    );
  }

  if (!existing) {
    // If not configed, we can't easily fetch username. We'll use mock or try octokit.
    let username = "GitHub User";
    let avatar = null;
    let githubUserId = null;

    if (hasGitHubConfig) {
      const octokit = await getInstallationOctokit(installationId);
      if (!octokit) throw new Error("GitHub App is not configured.");
      let installationAccount: any = null;
      try {
        const { data } = await octokit.rest.apps.getInstallation({
          installation_id: parseInt(installationId, 10),
        });
        installationAccount = data.account;
      } catch (e) {
        console.error("Failed to fetch installation details", e);
        throw new Error("Could not read this GitHub installation.");
      }
      await assertInstallationOwnedBy(
        session.user.id,
        installationId,
        installationAccount,
      );
      username = installationAccount?.login || username;
      avatar = installationAccount?.avatar_url || null;
      githubUserId = installationAccount?.id?.toString() || null;
    }

    await db.insert(githubAccount).values({
      userId: session.user.id,
      installationId,
      username,
      avatar,
      githubUserId,
    });
  }

  revalidatePath("/settings");
  revalidatePath("/projects");
  return { success: true };
}

export async function disconnectGitHub() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(githubAccount)
    .where(eq(githubAccount.userId, session.user.id));

  revalidatePath("/settings");
  revalidatePath("/projects");
  return { success: true };
}

export type Repository = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  default_branch: string;
  updated_at: string;
  clone_url: string;
};

export async function fetchRepositories(): Promise<{
  success: boolean;
  repositories?: Repository[];
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const account = await db.query.githubAccount.findFirst({
    where: eq(githubAccount.userId, session.user.id),
  });

  if (!account) {
    return { success: false, error: "GitHub not connected" };
  }

  if (!hasGitHubConfig) {
    // Return mock data
    return {
      success: true,
      repositories: [
        {
          id: 1,
          name: "kyro-platform",
          full_name: "adityashah2701/kyro-platform",
          owner: {
            login: "adityashah2701",
            avatar_url: "https://github.com/adityashah2701.png",
          },
          private: true,
          default_branch: "main",
          updated_at: new Date().toISOString(),
          clone_url: "https://github.com/adityashah2701/kyro-platform.git",
        },
        {
          id: 2,
          name: "portfolio",
          full_name: "adityashah2701/portfolio",
          owner: {
            login: "adityashah2701",
            avatar_url: "https://github.com/adityashah2701.png",
          },
          private: false,
          default_branch: "master",
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          clone_url: "https://github.com/adityashah2701/portfolio.git",
        },
      ],
    };
  }

  try {
    const octokit = await getInstallationOctokit(account.installationId);
    if (!octokit) {
      return { success: false, error: "Failed to initialize Octokit" };
    }

    // Use paginate to get all repos (or first 100 for simplicity)
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    return {
      success: true,

      repositories: data.repositories as any,
    };
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return {
      success: false,
      error: "Failed to fetch repositories from GitHub",
    };
  }
}

export async function linkRepositoryToProject(
  projectId: string,
  repo: Repository
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const projectData = await db.query.project.findFirst({
    where: eq(project.id, projectId),
  });

  if (!projectData || projectData.userId !== session.user.id) {
    throw new Error("Project not found or unauthorized");
  }

  // The browser sends the repo object, so never trust it: re-read it from GitHub
  // with this user's installation (clone_url, id and privacy all come from there).
  const ghAccount = await db.query.githubAccount.findFirst({
    where: eq(githubAccount.userId, session.user.id),
  });
  if (!ghAccount) throw new Error("GitHub not connected");

  if (hasGitHubConfig) {
    const octokit = await getInstallationOctokit(ghAccount.installationId);
    if (!octokit) throw new Error("Failed to initialize Octokit");
    try {
      const { data } = await octokit.rest.repos.get({
        owner: repo.owner.login,
        repo: repo.name,
      });
      repo = data as any;
    } catch {
      throw new Error("Repository not accessible from your GitHub installation");
    }
  }

  await db
    .insert(projectRepository)
    .values({
      projectId,
      repositoryId: repo.id.toString(),
      repositoryName: repo.name,
      owner: repo.owner.login,
      defaultBranch: repo.default_branch,
      selectedBranch: repo.default_branch,
      isPrivate: repo.private,
      cloneUrl: repo.clone_url,
    })
    .onConflictDoUpdate({
      target: [projectRepository.projectId],
      set: {
        repositoryId: repo.id.toString(),
        repositoryName: repo.name,
        owner: repo.owner.login,
        defaultBranch: repo.default_branch,
        selectedBranch: repo.default_branch,
        isPrivate: repo.private,
        cloneUrl: repo.clone_url,
      },
    });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function disconnectRepository(projectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const projectData = await db.query.project.findFirst({
    where: eq(project.id, projectId),
  });

  if (!projectData || projectData.userId !== session.user.id) {
    throw new Error("Project not found or unauthorized");
  }

  await db
    .delete(projectRepository)
    .where(eq(projectRepository.projectId, projectId));

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
