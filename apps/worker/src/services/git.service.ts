import { simpleGit, SimpleGit } from "simple-git";
import { logger } from "../logger";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import fs from "fs/promises";

const appId = process.env.GITHUB_APP_ID;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

export class GitService {
  /**
   * Generates a GitHub installation token if credentials are provided.
   */
  private static async getInstallationToken(
    installationId: string,
  ): Promise<string | null> {
    if (
      !appId ||
      !privateKey ||
      privateKey === "your_base64_encoded_private_key"
    ) {
      logger.warn(
        "GitHub App credentials missing. Continuing without authentication.",
      );
      return null;
    }

    let decodedPrivateKey = privateKey as string;
    if (
      !decodedPrivateKey.includes("BEGIN RSA PRIVATE KEY") &&
      !decodedPrivateKey.includes("BEGIN PRIVATE KEY")
    ) {
      try {
        decodedPrivateKey = Buffer.from(decodedPrivateKey, "base64").toString(
          "utf-8",
        );
      } catch (e) {
        logger.error({ err: e }, "Failed to decode GitHub private key");
      }
    }

    try {
      const auth = createAppAuth({
        appId,
        privateKey: decodedPrivateKey,
        installationId,
      });

      // @ts-ignore - The auth options can be complex, type casting handles it.
      const installationAuthentication = (await auth({
        type: "installation",
      })) as any;
      return installationAuthentication.token;
    } catch (e) {
      logger.error({ err: e }, "Failed to authenticate with GitHub app");
      return null;
    }
  }

  /**
   * Clones a repository and checks out a specific branch.
   */
  public static async cloneRepository(
    cloneUrl: string,
    branch: string,
    destinationPath: string,
    isPrivate: boolean,
    installationId?: string,
  ): Promise<{ commitSha: string; commitMessage: string }> {
    const git: SimpleGit = simpleGit();
    let finalCloneUrl = cloneUrl;

    if (isPrivate && installationId) {
      const token = await this.getInstallationToken(installationId);
      if (token) {
        // Embed token into clone URL (HTTPS)
        // From: https://github.com/owner/repo.git
        // To: https://x-access-token:<token>@github.com/owner/repo.git
        try {
          const urlObj = new URL(cloneUrl);
          urlObj.username = "x-access-token";
          urlObj.password = token;
          finalCloneUrl = urlObj.toString();
        } catch (e) {
          logger.error({ err: e, cloneUrl }, "Invalid clone URL");
        }
      } else {
        logger.warn(
          "Private repository but failed to obtain installation token. Clone may fail.",
        );
      }
    }

    logger.info({ destinationPath, branch }, "Cloning repository");

    // Ensure destination exists
    await fs.mkdir(destinationPath, { recursive: true });

    // Clone the repo (shallow clone for speed)
    await git.clone(finalCloneUrl, destinationPath, [
      "--branch",
      branch,
      "--depth",
      "1",
    ]);

    logger.info({ destinationPath }, "Repository cloned successfully");

    // Fetch the latest commit info
    const gitDest = simpleGit(destinationPath);
    const log = await gitDest.log({ maxCount: 1 });
    const latestCommit = log.latest;

    return {
      commitSha: latestCommit?.hash || "",
      commitMessage: latestCommit?.message || "",
    };
  }
}
