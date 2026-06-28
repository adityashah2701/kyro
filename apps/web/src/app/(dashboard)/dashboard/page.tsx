"use client";

import { useSession } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Loader2, Plus, ArrowUpRight, Box, Activity } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function DashboardPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user?.name?.split(" ")[0] || "User"}`}
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </PageHeader>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8 mt-6"
      >
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +1 from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Deployments
                </CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +12% from last week
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Projects Placeholder */}
        <motion.div variants={item} className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent Projects
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Box className="h-4 w-4" />
                      </div>
                      project-name-{i}
                    </CardTitle>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <CardDescription className="pt-2">
                    Deployed just now
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
