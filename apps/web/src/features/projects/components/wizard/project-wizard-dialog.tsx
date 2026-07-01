"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { WizardProvider, useWizard } from "./wizard-context";
import { AnimatePresence, motion } from "framer-motion";
import { ProjectInfoStep } from "./steps/project-info";
import { RepositoryStep } from "./steps/repository";
import { BuildConfigStep } from "./steps/build-config";
import { EnvVarsStep } from "./steps/env-vars";
import { ReviewStep } from "./steps/review";

interface ProjectWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 1, title: "Project Info" },
  { id: 2, title: "Repository" },
  { id: 3, title: "Framework & Build" },
  { id: 4, title: "Environment Variables" },
  { id: 5, title: "Review & Create" },
];

function WizardContent({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { currentStep } = useWizard();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ProjectInfoStep key="step1" />;
      case 2:
        return <RepositoryStep key="step2" />;
      case 3:
        return <BuildConfigStep key="step3" />;
      case 4:
        return <EnvVarsStep key="step4" />;
      case 5:
        return <ReviewStep key="step5" onOpenChange={onOpenChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Progress Sidebar */}
      <div className="w-64 border-r border-border bg-muted/30 p-6 hidden md:block">
        <h2 className="text-lg font-semibold mb-8">New Project</h2>
        <nav className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 text-sm ${
                currentStep === step.id
                  ? "font-medium text-foreground"
                  : currentStep > step.id
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  currentStep === step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep > step.id
                      ? "border-primary text-primary"
                      : "border-border"
                }`}
              >
                {step.id}
              </div>
              {step.title}
            </div>
          ))}
        </nav>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 relative">
        <div className="mx-auto max-w-2xl w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function ProjectWizardDialog({
  open,
  onOpenChange,
}: ProjectWizardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 
        Using a very large max-width and fixed height to make it a "full screen" style dialog.
        sm:max-w-[90vw] and h-[90vh] keeps it contained but massive. 
      */}
      <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0 gap-0 overflow-hidden outline-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Create Project Wizard</DialogTitle>
          <DialogDescription>
            Wizard to create a new project and configure its deployment.
          </DialogDescription>
        </DialogHeader>
        <WizardProvider>
          <WizardContent onOpenChange={onOpenChange} />
        </WizardProvider>
      </DialogContent>
    </Dialog>
  );
}
