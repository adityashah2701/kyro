"use client";

import { useState } from "react";
import { useWizard } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  EnvVarEditor,
  type BaseEnvVar,
} from "@/features/environment/components/env-var-editor";

export function EnvVarsStep() {
  const { state, updateState, setCurrentStep } = useWizard();
  const [vars, setVars] = useState<BaseEnvVar[]>(
    (state.envVars as BaseEnvVar[]) || []
  );

  const handleNext = () => {
    updateState({ envVars: vars });
    setCurrentStep(4);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Environment Variables
        </h2>
        <p className="text-muted-foreground mt-1">
          Paste your <code className="text-xs">.env</code> contents below. We
          automatically parse keys and values.
        </p>
      </div>

      <EnvVarEditor
        vars={vars}
        onChange={setVars}
        defaultEnvironment="production"
      />

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => {
            updateState({ envVars: vars });
            setCurrentStep(2);
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleNext}>
          Next Step <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
