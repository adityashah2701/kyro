"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { parseEnvContent } from "../utils/env-import-parser";
import type { Environment } from "../schemas";

export interface BaseEnvVar {
  id: string;
  key: string;
  value: string;
  environment: Environment;
  isSecret: boolean;
}

interface EnvVarEditorProps {
  vars: BaseEnvVar[];
  onChange: (vars: BaseEnvVar[]) => void;
  defaultEnvironment?: Environment;
}

export function EnvVarEditor({
  vars,
  onChange,
  defaultEnvironment = "production",
}: EnvVarEditorProps) {
  const [bulkInput, setBulkInput] = useState("");

  const handleBulkAdd = () => {
    const { entries, issues } = parseEnvContent(bulkInput, defaultEnvironment);

    if (entries.length === 0) {
      toast.error("No valid environment variables found.");
      return;
    }

    const newVars = [...vars];
    let addedCount = 0;
    let dupCount = 0;
    let reservedCount = 0;

    for (const p of entries) {
      // Find if there's any blocking issues for this key
      const blockingIssue = issues.find(
        (i) =>
          i.key === p.key &&
          (i.code === "reserved_variable" || i.code === "invalid_name")
      );

      if (blockingIssue) {
        if (blockingIssue.code === "reserved_variable") reservedCount++;
        continue;
      }

      const existsIdx = newVars.findIndex((v) => v.key === p.key);
      if (existsIdx !== -1) {
        // Update existing
        newVars[existsIdx].value = p.value;
        dupCount++;
      } else {
        newVars.push({
          id: Math.random().toString(36).substring(7),
          key: p.key,
          value: p.value,
          environment: defaultEnvironment,
          isSecret: true, // Default to secret for safety
        });
        addedCount++;
      }
    }

    onChange(newVars);
    setBulkInput("");

    if (addedCount > 0) toast.success(`Added ${addedCount} variables.`);
    if (dupCount > 0) toast.info(`Updated ${dupCount} existing variables.`);
    if (reservedCount > 0)
      toast.warning(`Skipped ${reservedCount} reserved variables.`);
  };

  const handleUpdate = <K extends keyof BaseEnvVar>(
    id: string,
    field: K,
    value: BaseEnvVar[K]
  ) => {
    onChange(vars.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const handleRemove = (id: string) => {
    onChange(vars.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-3">
        <Textarea
          placeholder={
            "DATABASE_URL=postgres://...\nNEXTAUTH_SECRET=xyz\n# Comments are ignored"
          }
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          className="font-mono text-sm min-h-[120px] resize-none"
          spellCheck={false}
        />
        <Button
          onClick={handleBulkAdd}
          disabled={!bulkInput.trim()}
          variant="secondary"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Parse and Add Variables
        </Button>
      </div>

      {vars.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold tracking-tight border-b pb-2">
            Configured Variables
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {vars.map((v) => (
              <div key={v.id} className="flex items-center gap-2">
                <Input
                  value={v.key}
                  onChange={(e) => handleUpdate(v.id, "key", e.target.value)}
                  placeholder="Key"
                  className="font-mono text-xs w-1/3"
                />
                <Input
                  value={v.value}
                  type={v.isSecret ? "password" : "text"}
                  onChange={(e) => handleUpdate(v.id, "value", e.target.value)}
                  placeholder="Value"
                  className="font-mono text-xs flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleUpdate(v.id, "isSecret", !v.isSecret)}
                  title="Toggle Secret"
                >
                  <KeyRound
                    className={`h-4 w-4 ${v.isSecret ? "text-primary" : ""}`}
                  />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemove(v.id)}
                  title="Remove Variable"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {vars.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
          No environment variables configured.
        </div>
      )}
    </div>
  );
}
