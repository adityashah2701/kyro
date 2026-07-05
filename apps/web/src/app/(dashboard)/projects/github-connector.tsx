"use client";

import { useEffect, useRef } from "react";
import { connectGitHub } from "@/features/github/actions";
import { useRouter } from "next/navigation";

export function GitHubConnector({
  installationId,
}: {
  installationId: string;
}) {
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    connectGitHub(installationId)
      .then(() => {
        router.replace("/projects");
      })
      .catch((e) => {
        console.error("Failed to connect GitHub:", e);
        router.replace("/projects");
      });
  }, [installationId, router]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <h2 className="text-xl font-semibold">Connecting GitHub...</h2>
        <p className="text-muted-foreground">
          Please wait while we link your GitHub account.
        </p>
      </div>
    </div>
  );
}
