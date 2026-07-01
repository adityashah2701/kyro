"use client";

import { useState } from "react";
import { useWizard, type EnvVar } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Plus, Trash2, KeyRound } from "lucide-react";

export function EnvVarsStep() {
  const { state, updateState, setCurrentStep } = useWizard();
  const [vars, setVars] = useState<EnvVar[]>(state.envVars);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newIsSecret, setNewIsSecret] = useState(true);

  const handleAdd = () => {
    if (!newKey.trim() || !newValue.trim()) return;

    const newVar: EnvVar = {
      id: Math.random().toString(36).substring(7),
      key: newKey.trim(),
      value: newValue.trim(),
      environment: "production",
      isSecret: newIsSecret,
    };

    setVars([...vars, newVar]);
    setNewKey("");
    setNewValue("");
    setNewIsSecret(true);
  };

  const handleRemove = (id: string) => {
    setVars(vars.filter((v) => v.id !== id));
  };

  const handleNext = () => {
    updateState({ envVars: vars });
    setCurrentStep(5);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Environment Variables
        </h2>
        <p className="text-muted-foreground mt-1">
          Add any secrets or environment variables needed for your build or
          runtime.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5 space-y-1">
            <Label className="text-xs">Key</Label>
            <Input
              placeholder="DATABASE_URL"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="col-span-4 space-y-1">
            <Label className="text-xs">Value</Label>
            <Input
              placeholder="postgres://..."
              type={newIsSecret ? "password" : "text"}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="col-span-2 flex flex-col items-center justify-center space-y-2 pb-2">
            <Label className="text-xs">Secret</Label>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={newIsSecret}
              onChange={(e) => setNewIsSecret(e.target.checked)}
            />
          </div>
          <div className="col-span-1 pb-1">
            <Button
              size="icon"
              variant="secondary"
              onClick={handleAdd}
              disabled={!newKey || !newValue}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {vars.length > 0 && (
          <div className="mt-6 space-y-2 max-h-[250px] overflow-y-auto pr-2">
            {vars.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-md border p-2 bg-muted/20"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="truncate">
                    <p className="font-mono text-sm font-medium truncate">
                      {v.key}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {v.isSecret ? "••••••••••••••••" : v.value}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(v.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {vars.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-md mt-4">
            No environment variables added.
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => {
            updateState({ envVars: vars });
            setCurrentStep(3);
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
