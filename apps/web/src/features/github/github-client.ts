import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

const appId = process.env.GITHUB_APP_ID;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

export const hasGitHubConfig = Boolean(
  appId && privateKey && privateKey !== "your_base64_encoded_private_key"
);

/**
 * Creates an Octokit instance authenticated as a GitHub App Installation.
 * Returns null if the required environment variables are not set.
 */
export async function getInstallationOctokit(
  installationId: string
): Promise<Octokit | null> {
  if (!hasGitHubConfig) {
    console.warn("GitHub App credentials are missing. Using mock data.");
    return null;
  }

  // Parse the private key (handle base64 encoding or raw string)
  let decodedPrivateKey = privateKey as string;
  if (
    !decodedPrivateKey.includes("BEGIN RSA PRIVATE KEY") &&
    !decodedPrivateKey.includes("BEGIN PRIVATE KEY")
  ) {
    try {
      decodedPrivateKey = Buffer.from(decodedPrivateKey, "base64").toString(
        "utf-8"
      );
    } catch (e) {
      console.error("Failed to decode GitHub private key", e);
    }
  }

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey: decodedPrivateKey,
      installationId,
    },
  });

  return octokit;
}
