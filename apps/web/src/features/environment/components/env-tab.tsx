"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Shield,
  Lock,
  Unlock,
  Search,
  X,
  Loader2,
  Upload,
  Download,
  ChevronDown,
} from "lucide-react";
import {
  addVariableAction,
  deleteVariableAction,
  revealVariableAction,
  updateVariableAction,
} from "../actions";
import { ENVIRONMENT_VALUES, type Environment } from "../schemas";
import type { EnvVariableRow } from "../services/env.service";
import { buildEnvExampleContent } from "../utils/env-import-parser";
import { EnvVarEditor, type BaseEnvVar } from "./env-var-editor";

// ── Constants ─────────────────────────────────────────────────────────────────

const ENV_LABELS: Record<Environment, string> = {
  development: "Development",
  preview: "Preview",
  production: "Production",
};

const ENV_COLORS: Record<Environment, string> = {
  development: "bg-info/10 text-info border-info/20",
  preview: "bg-warning/10 text-warning border-warning/20",
  production: "bg-success/10 text-success border-success/20",
};

const MASK = "••••••••";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  variables: EnvVariableRow[];
  projectId: string;
}

// Removed obsolete ImportStatus / ImportRow types and validateAndBuildRows helper.

// ── Component ─────────────────────────────────────────────────────────────────

export function EnvTab({ variables, projectId }: Props) {
  // Main list state
  const [search, setSearch] = useState("");
  const [filterEnv, setFilterEnv] = useState<Environment | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editSecret, setEditSecret] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Add variable form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addKey, setAddKey] = useState("");
  const [addValue, setAddValue] = useState("");
  const [addEnv, setAddEnv] = useState<Environment>("production");
  const [addSecret, setAddSecret] = useState(false);
  const [addingKey, setAddingKey] = useState(false);

  // Import dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importEnv, setImportEnv] = useState<Environment>("production");
  const [importRows, setImportRows] = useState<BaseEnvVar[]>([]);
  const [importing, setImporting] = useState(false);
  const keyInputRef = useRef<HTMLInputElement>(null);

  // ── Filtered list ───────────────────────────────────────────────────────────

  const filtered = variables.filter((v) => {
    const matchSearch =
      search.trim() === "" ||
      v.key.toLowerCase().includes(search.toLowerCase());
    const matchEnv = filterEnv === "all" || v.environment === filterEnv;
    return matchSearch && matchEnv;
  });

  // ── Parse env text → import rows ────────────────────────────────────────────

  // ── Detect paste of .env content in the key field ───────────────────────────

  function handleKeyPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (text.includes("\n") && text.includes("=")) {
      e.preventDefault();
      setImportEnv(addEnv);
      setImportOpen(true);
      setShowAddForm(false);
      toast.info(
        "Opened bulk import dialog. Please paste your variables there."
      );
    }
  }

  // ── Add single variable ─────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addKey || !addValue) return;
    setAddingKey(true);
    const result = await addVariableAction(projectId, {
      key: addKey,
      value: addValue,
      environment: addEnv,
      isSecret: addSecret,
    });
    setAddingKey(false);
    if (result.success) {
      toast.success(`"${addKey}" added.`);
      setAddKey("");
      setAddValue("");
      setAddSecret(false);
      setShowAddForm(false);
    } else {
      toast.error(result.error ?? "Failed to add variable.");
    }
  }

  // ── Reveal / copy / delete / edit ───────────────────────────────────────────

  async function handleReveal(id: string) {
    if (revealed[id]) {
      setRevealed((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
      return;
    }
    setRevealingId(id);
    const result = await revealVariableAction(id, projectId);
    setRevealingId(null);
    if (result.success && result.value !== undefined) {
      setRevealed((p) => ({ ...p, [id]: result.value! }));
    } else {
      toast.error("Failed to reveal value.");
    }
  }

  async function handleDelete(id: string, key: string) {
    setDeletingId(id);
    const result = await deleteVariableAction(id, projectId);
    setDeletingId(null);
    if (result.success) {
      toast.success(`"${key}" deleted.`);
    } else {
      toast.error(result.error ?? "Failed.");
    }
  }

  function handleCopy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    toast.success(`"${key}" copied.`);
  }

  function startEdit(v: EnvVariableRow) {
    setEditingId(v.id);
    setEditValue(revealed[v.id] ?? "");
    setEditSecret(v.isSecret);
  }

  async function handleSaveEdit(v: EnvVariableRow) {
    setSavingId(v.id);
    const result = await updateVariableAction(
      v.id,
      projectId,
      editValue,
      editSecret
    );
    setSavingId(null);
    if (result.success) {
      toast.success(`"${v.key}" updated.`);
      setEditingId(null);
      setRevealed((p) => {
        const n = { ...p };
        delete n[v.id];
        return n;
      });
    } else {
      toast.error(result.error ?? "Failed to update.");
    }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => deleteVariableAction(id, projectId)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
    toast.success(`${ids.length} variable(s) deleted.`);
  }

  // ── Import confirm ──────────────────────────────────────────────────────────

  async function handleImportAll() {
    if (!importRows.length) return;
    setImporting(true);
    let ok = 0;

    for (const row of importRows) {
      const result = await addVariableAction(projectId, {
        key: row.key,
        value: row.value,
        environment: row.environment,
        isSecret: row.isSecret,
      });
      if (result.success) {
        ok++;
      }
    }
    setImporting(false);
    toast.success(`${ok} variable(s) imported.`);
    setImportOpen(false);
    setImportRows([]);
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function download(name: string, content: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = name;
    a.click();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Import Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={importOpen}
        onOpenChange={(v) => {
          if (!importing) {
            setImportOpen(v);
            if (!v) {
              setImportRows([]);
            }
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex flex-col gap-0 p-0 overflow-hidden sm:max-w-3xl max-h-[92vh]"
        >
          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Import Environment Variables</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Paste your <code>.env</code> content below. We will
                automatically parse and deduplicate keys.
              </p>
            </DialogHeader>

            <EnvVarEditor
              vars={importRows}
              onChange={setImportRows}
              defaultEnvironment={importEnv}
            />
          </div>

          {/* Sticky footer */}
          <div className="border-t px-6 py-4 flex items-center justify-between gap-3 bg-popover shrink-0">
            <span className="text-xs text-muted-foreground">
              {importRows.length} variable(s) to import
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportOpen(false);
                  setImportRows([]);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleImportAll()}
                disabled={importing || importRows.length === 0}
              >
                {importing && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                )}
                Save Variables
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Environment Variables</h3>
          <p className="text-sm text-muted-foreground">
            Encrypted with AES-256-GCM and injected at build time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-4 w-4" /> Import .env
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              download(".env.example", buildEnvExampleContent(variables))
            }
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowAddForm(true);
              setTimeout(() => keyInputRef.current?.focus(), 50);
            }}
          >
            <Plus className="h-4 w-4" /> Add Variable
          </Button>
        </div>
      </div>

      {/* ── Add Variable Form ───────────────────────────────────────────── */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="border rounded-lg p-4 bg-card space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">New Variable</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowAddForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Key
              </label>
              <Input
                ref={keyInputRef}
                placeholder="DATABASE_URL"
                value={addKey}
                onChange={(e) => setAddKey(e.target.value.toUpperCase())}
                onPaste={handleKeyPaste}
                className="font-mono text-sm"
                required
              />
              <p className="text-[0.68rem] text-muted-foreground">
                Tip: paste a .env file here to bulk import
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Value
              </label>
              <Input
                type={addSecret ? "password" : "text"}
                placeholder="your-value"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                className="font-mono text-sm"
                required
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Environment
              </label>
              <div className="relative">
                <select
                  value={addEnv}
                  onChange={(e) => setAddEnv(e.target.value as Environment)}
                  className="appearance-none border rounded-md px-3 py-1.5 text-sm bg-background pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ENVIRONMENT_VALUES.map((env) => (
                    <option key={env} value={env}>
                      {ENV_LABELS[env]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Type
              </label>
              <div className="flex items-center gap-1 border rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setAddSecret(false)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${!addSecret ? "bg-muted font-medium" : "text-muted-foreground"}`}
                >
                  <Unlock className="h-3 w-3" /> Plain
                </button>
                <button
                  type="button"
                  onClick={() => setAddSecret(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${addSecret ? "bg-muted font-medium" : "text-muted-foreground"}`}
                >
                  <Lock className="h-3 w-3" /> Secret
                </button>
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              className="mt-auto"
              disabled={addingKey}
            >
              {addingKey && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              )}
              Add
            </Button>
          </div>
        </form>
      )}

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search variables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["all", ...ENVIRONMENT_VALUES] as const).map((env) => (
            <button
              key={env}
              onClick={() => setFilterEnv(env as Environment | "all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                filterEnv === env
                  ? env === "all"
                    ? "bg-muted border-border"
                    : ENV_COLORS[env as Environment]
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {env === "all" ? "All" : ENV_LABELS[env as Environment]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk Delete Bar ─────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* ── Variables Table ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-card text-center">
          <Shield className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">
            {variables.length === 0
              ? "No environment variables yet"
              : "No variables match your search"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {variables.length === 0
              ? "Add your first variable or import a .env file."
              : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={
                      selectedIds.size === filtered.length &&
                      filtered.length > 0
                    }
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked
                          ? new Set(filtered.map((v) => v.id))
                          : new Set()
                      )
                    }
                  />
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                  Key
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                  Value
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                  Environment
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const isRevealed = !!revealed[v.id];
                const displayVal = isRevealed
                  ? revealed[v.id]
                  : v.isSecret
                    ? MASK
                    : v.displayValue;
                const isEditing = editingId === v.id;

                return (
                  <tr
                    key={v.id}
                    className={`border-b last:border-b-0 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""} hover:bg-muted/30 ${selectedIds.has(v.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedIds.has(v.id)}
                        onChange={() =>
                          setSelectedIds((p) => {
                            const n = new Set(p);
                            if (n.has(v.id)) {
                              n.delete(v.id);
                            } else {
                              n.add(v.id);
                            }
                            return n;
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {v.isSecret && (
                          <Lock className="size-3 shrink-0 text-warning" />
                        )}
                        <span className="font-mono font-medium text-sm">
                          {v.key}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            type={editSecret ? "password" : "text"}
                            className="font-mono text-xs h-7"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setEditSecret((p) => !p)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {editSecret ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`font-mono text-xs truncate block max-w-[200px] ${!isRevealed && v.isSecret ? "tracking-widest text-muted-foreground" : ""}`}
                        >
                          {displayVal}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border font-medium ${ENV_COLORS[v.environment]}`}
                      >
                        {ENV_LABELS[v.environment]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSaveEdit(v)}
                              disabled={savingId === v.id}
                            >
                              {savingId === v.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            {v.isSecret && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title={isRevealed ? "Hide" : "Reveal"}
                                disabled={revealingId === v.id}
                                onClick={() => handleReveal(v.id)}
                              >
                                {revealingId === v.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isRevealed ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Copy"
                              onClick={() =>
                                handleCopy(displayVal ?? "", v.key)
                              }
                              disabled={v.isSecret && !isRevealed}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Edit"
                              onClick={() => startEdit(v)}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                              disabled={deletingId === v.id}
                              onClick={() => handleDelete(v.id, v.key)}
                            >
                              {deletingId === v.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {variables.length} variable{variables.length !== 1 ? "s" : ""} ·
        AES-256-GCM encrypted
      </p>
    </div>
  );
}
