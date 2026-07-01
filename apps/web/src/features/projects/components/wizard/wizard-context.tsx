"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Repository } from "@/features/github/actions";

export interface EnvVar {
  id: string; // temp id for UI
  key: string;
  value: string;
  environment: string;
  isSecret: boolean;
}

export interface WizardState {
  // Step 1: Project Info
  name: string;
  slug: string;
  description: string;
  visibility: "public" | "private";

  // Step 2: Repository
  repository: Repository | null;
  branch: string;

  // Step 3: Build Config
  frameworkId: string;
  installCommand: string;
  buildCommand: string;
  startCommand: string;
  outputDirectory: string;
  rootDirectory: string;

  // Step 4: Env Vars
  envVars: EnvVar[];
}

export const defaultWizardState: WizardState = {
  name: "",
  slug: "",
  description: "",
  visibility: "private",
  repository: null,
  branch: "main",
  frameworkId: "",
  installCommand: "",
  buildCommand: "",
  startCommand: "",
  outputDirectory: "",
  rootDirectory: "/",
  envVars: [],
};

interface WizardContextType {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateState: (updates: Partial<WizardState>) => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(defaultWizardState);
  const [currentStep, setCurrentStep] = useState(1);

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <WizardContext.Provider
      value={{ state, setState, currentStep, setCurrentStep, updateState }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
