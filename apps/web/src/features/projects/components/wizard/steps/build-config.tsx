"use client";

import { useForm } from "react-hook-form";
import { useWizard, type WizardState } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Settings2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { frameworkRegistry } from "../../../frameworks/registry";
import type { FrameworkDefinition } from "../../../frameworks/types";

export function BuildConfigStep() {
  const { state, updateState, setCurrentStep } = useWizard();

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      frameworkId: state.frameworkId || "nextjs", // Default to Next.js
      installCommand: state.installCommand,
      buildCommand: state.buildCommand,
      startCommand: state.startCommand,
      outputDirectory: state.outputDirectory,
      rootDirectory: state.rootDirectory,
    },
  });

  const selectedFrameworkId = watch("frameworkId");

  const handleFrameworkChange = (val: string | null) => {
    if (!val) return;
    setValue("frameworkId", val);
    const fw = frameworkRegistry.find((f: FrameworkDefinition) => f.id === val);
    if (fw) {
      setValue("installCommand", fw.defaultInstallCommand);
      setValue("buildCommand", fw.defaultBuildCommand);
      setValue("startCommand", fw.defaultStartCommand);
      setValue("outputDirectory", fw.defaultOutputDirectory);
    }
  };

  const onSubmit = (data: Partial<WizardState>) => {
    updateState(data);
    setCurrentStep(4);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Framework & Build</h2>
        <p className="text-muted-foreground mt-1">
          Configure how we should build and run your project.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label>Framework</Label>
          <Select
            onValueChange={handleFrameworkChange}
            value={selectedFrameworkId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a framework" />
            </SelectTrigger>
            <SelectContent>
              {frameworkRegistry.map((fw) => (
                <SelectItem key={fw.id} value={fw.id}>
                  {fw.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label>Root Directory</Label>
            <Input {...register("rootDirectory")} placeholder="/" />
          </div>
          <div className="space-y-2">
            <Label>Output Directory</Label>
            <Input
              {...register("outputDirectory")}
              placeholder=".next, dist, public"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Install Command</Label>
            <Input
              {...register("installCommand")}
              placeholder="npm install"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Build Command</Label>
            <Input
              {...register("buildCommand")}
              placeholder="npm run build"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Start Command</Label>
            <Input
              {...register("startCommand")}
              placeholder="npm start"
              className="font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(2)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button type="submit">
          Next Step <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
