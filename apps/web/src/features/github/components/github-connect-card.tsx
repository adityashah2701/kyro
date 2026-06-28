"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitBranch, Unplug, CheckCircle2 } from "lucide-react";
import { disconnectGitHub } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

type GitHubConnectCardProps = {
  isConnected: boolean;
  username?: string | null;
  avatar?: string | null;
  installationUrl: string;
};

export function GitHubConnectCard({
  isConnected,
  username,
  avatar,
  installationUrl,
}: GitHubConnectCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConnect = () => {
    // Redirect to GitHub App installation page
    window.location.href = installationUrl;
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await disconnectGitHub();
      toast.success("Disconnected from GitHub");
      router.refresh();
    } catch (error) {
      toast.error("Failed to disconnect from GitHub");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to import repositories and enable
          continuous deployment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {username || "Connected"}
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </p>
                <p className="text-sm text-muted-foreground">
                  Kyro App is installed
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              <Unplug className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              By connecting, you grant Kyro access to read your repositories for
              deployment purposes. We use a GitHub App for fine-grained, secure
              access.
            </p>
            <Button onClick={handleConnect}>
              <GitBranch className="mr-2 h-4 w-4" />
              Connect GitHub
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
