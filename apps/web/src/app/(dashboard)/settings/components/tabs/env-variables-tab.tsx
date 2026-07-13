import { Button } from "@/components/ui/button";
import { SettingsCard } from "../settings-card";
import { Lock, ArrowRight, Server, Globe, Laptop } from "lucide-react";
import Link from "next/link";

interface EnvVariablesTabProps {
  projectId: string;
}

export function EnvVariablesTab({ projectId }: EnvVariablesTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        layout="column"
        title="Environment Variables"
        description="Manage the variables and secrets used by your project's environments. They are securely encrypted and injected at build time and runtime."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col p-5 border border-border/60 rounded-xl bg-card shadow-sm gap-2 hover:border-primary/50 hover:shadow-md transition-all group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Globe className="size-12" />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Production</span>
            </div>
            <div className="text-3xl font-semibold mt-2">12</div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Variables
            </span>
          </div>
          <div className="flex flex-col p-5 border border-border/60 rounded-xl bg-card shadow-sm gap-2 hover:border-primary/50 hover:shadow-md transition-all group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Server className="size-12" />
            </div>
            <div className="flex items-center gap-2">
              <Server className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Preview</span>
            </div>
            <div className="text-3xl font-semibold mt-2">10</div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Variables
            </span>
          </div>
          <div className="flex flex-col p-5 border border-border/60 rounded-xl bg-card shadow-sm gap-2 hover:border-primary/50 hover:shadow-md transition-all group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Laptop className="size-12" />
            </div>
            <div className="flex items-center gap-2">
              <Laptop className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Development</span>
            </div>
            <div className="text-3xl font-semibold mt-2">14</div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Variables
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            nativeButton={false}
            render={
              <Link href={`/env?projectId=${projectId}`}>
                Manage Variables <ArrowRight className="size-4 ml-2" />
              </Link>
            }
          />
        </div>
      </SettingsCard>
    </div>
  );
}
