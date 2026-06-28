"use client";

import { useSession, signOut } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-neutral-400 mt-1">
              Welcome back, {session?.user?.name || "User"}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-neutral-800 text-white hover:bg-neutral-900"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Active Projects</CardTitle>
              <CardDescription className="text-neutral-400">
                Manage your deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-white">0</p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-950 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Deployments</CardTitle>
              <CardDescription className="text-neutral-400">
                View your deployment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-400">No recent deployments</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
