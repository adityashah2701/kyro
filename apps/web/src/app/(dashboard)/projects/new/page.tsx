"use client";

import { useRouter } from "next/navigation";
import {
  WizardProvider,
  useWizard,
} from "@/features/projects/components/wizard/wizard-context";
import { AnimatePresence, motion } from "framer-motion";
import { ProjectInfoStep } from "@/features/projects/components/wizard/steps/project-info";
import { RepositoryStep } from "@/features/projects/components/wizard/steps/repository";
import { BuildConfigStep } from "@/features/projects/components/wizard/steps/build-config";
import { EnvVarsStep } from "@/features/projects/components/wizard/steps/env-vars";
import { ReviewStep } from "@/features/projects/components/wizard/steps/review";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { id: 1, title: "Import Repository" },
  { id: 2, title: "Configure Project" },
  { id: 3, title: "Environment Variables" },
  { id: 4, title: "Build Settings" },
  { id: 5, title: "Review & Deploy" },
];

function WizardContent() {
  const { currentStep } = useWizard();
  const router = useRouter();

  const handleClose = () => {
    router.push("/projects");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RepositoryStep key="step1" />;
      case 2:
        return <ProjectInfoStep key="step2" />;
      case 3:
        return <EnvVarsStep key="step3" />;
      case 4:
        return <BuildConfigStep key="step4" />;
      case 5:
        return <ReviewStep key="step5" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Progress Sidebar */}
      <div className="w-72 border-r border-border bg-muted/30 p-8 hidden md:block">
        <h2 className="text-xl font-bold mb-10 tracking-tight">New Project</h2>
        <nav className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 text-sm transition-colors ${
                currentStep === step.id
                  ? "font-medium text-foreground"
                  : currentStep > step.id
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  currentStep === step.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : currentStep > step.id
                      ? "border-primary text-primary"
                      : "border-border"
                }`}
              >
                {step.id}
              </div>
              <span className="tracking-tight">{step.title}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="flex justify-end p-6 absolute top-0 right-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-24">
          <div className="mx-auto max-w-2xl w-full h-full flex flex-col">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
