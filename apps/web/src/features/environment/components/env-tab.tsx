"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  parseEnvContent,
  isSupportedEnvFile,
  buildEnvExampleContent,
  STRICT_KEY_REGEX,
  RESERVED_KEYS,
} from "../utils/env-import-parser";

// ── Constants ─────────────────────────────────────────────────────────────────

const ENV_LABELS: Record<Environment, string> = {
  development: "Development",
  preview: "Preview",
  production: "Production",
};

const ENV_COLORS: Record<Environment, string> = {
  development: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  preview: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  production: "bg-green-500/10 text-green-400 border-green-500/20",
};

const MASK = "••••••••";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  variables: EnvVariableRow[];
  projectId: string;
}

type ImportStatus =
  "ready" | "duplicate" | "invalid" | "reserved" | "imported" | "failed";

interface ImportRow {
  id: string;
  key: string;
  value: string;
  environment: Environment;
  isSecret: boolean;
  showValue: boolean;
  selected: boolean;
  status: ImportStatus;
  hint?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateAndBuildRows(
  raw: { key: string; value: string; line: number }[],
  environment: Environment,
  existingVars: EnvVariableRow[]
): ImportRow[] {
  const existingKeys = new Set(
    existingVars.filter((v) => v.environment === environment).map((v) => v.key)
  );
  const seenInBatch = new Set<string>();

  return raw.map(({ key, value }) => {
    const id = crypto.randomUUID();
    let status: ImportStatus = "ready";
    let hint: string | undefined;

    if (!STRICT_KEY_REGEX.test(key)) {
      status = "invalid";
      hint = "Invalid key name";
    } else if (RESERVED_KEYS.has(key)) {
      status = "reserved";
      hint = "Reserved system key";
    } else if (existingKeys.has(key) || seenInBatch.has(key)) {
      status = "duplicate";
      hint = existingKeys.has(key) ? "Already exists" : "Duplicate in batch";
    }

    seenInBatch.add(key);

    return {
      id,
      key,
      value,
      environment,
      isSecret: false,
      showValue: true,
      selected: status === "ready",
      status,
      hint,
    };
  });
}

const STATUS_STYLE: Record<ImportStatus, string> = {
  ready: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  duplicate: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  invalid: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  reserved: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  imported: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

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
  const [importText, setImportText] = useState("");
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  function parseText(text: string, env: Environment): ImportRow[] {
    const result = parseEnvContent(text, env);
    return validateAndBuildRows(
      result.entries.map((e) => ({ key: e.key, value: e.value, line: e.line })),
      env,
      variables
    );
  }

  function handleImportTextChange(text: string) {
    setImportText(text);
    setImportRows(text.trim() ? parseText(text, importEnv) : []);
  }

  function handleImportEnvChange(env: Environment) {
    setImportEnv(env);
    setImportRows(importText.trim() ? parseText(importText, env) : []);
  }

  // ── File drop / upload ──────────────────────────────────────────────────────

  async function loadFile(file: File) {
    if (!isSupportedEnvFile(file.name)) {
      toast.error(
        "Unsupported file. Drop a .env, .env.local, .env.example, or .txt file."
      );
      return;
    }
    const text = await file.text();
    setImportText(text);
    setImportRows(parseText(text, importEnv));
    toast.success(`Loaded "${file.name}"`);
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) await loadFile(file);
    },
    [importEnv, variables]
  );

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await loadFile(file);
    e.target.value = "";
  }

  // ── Detect paste of .env content in the key field ───────────────────────────

  function handleKeyPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (text.includes("\n") && text.includes("=")) {
      e.preventDefault();
      // Open import dialog with pasted content
      setImportText(text);
      setImportEnv(addEnv);
      setImportRows(parseText(text, addEnv));
      setImportOpen(true);
      setShowAddForm(false);
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
    result.success
      ? toast.success(`"${key}" deleted.`)
      : toast.error(result.error ?? "Failed.");
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

  async function handleImportAll(skipInvalid: boolean) {
    const toImport = importRows.filter(
      (r) => r.selected && (!skipInvalid || r.status === "ready")
    );
    if (!toImport.length) return;
    setImporting(true);
    let ok = 0;
    const updated = [...importRows];
    for (const row of toImport) {
      const idx = updated.findIndex((r) => r.id === row.id);
      const result = await addVariableAction(projectId, {
        key: row.key,
        value: row.value,
        environment: row.environment,
        isSecret: row.isSecret,
      });
      if (result.success) {
        ok++;
        updated[idx] = { ...updated[idx], status: "imported", selected: false };
      } else {
        updated[idx] = {
          ...updated[idx],
          status: "failed",
          hint: result.error,
        };
      }
    }
    setImportRows(updated);
    setImporting(false);
    toast.success(`${ok} variable(s) imported.`);
    if (ok === toImport.length) {
      setTimeout(() => {
        setImportOpen(false);
        setImportText("");
        setImportRows([]);
      }, 800);
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function download(name: string, content: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = name;
    a.click();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const readyCount = importRows.filter((r) => r.status === "ready").length;
  const issueCount = importRows.filter(
    (r) => !["ready", "imported"].includes(r.status)
  ).length;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Import Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={importOpen}
        onOpenChange={(v) => {
          if (!importing) {
            setImportOpen(v);
            if (!v) {
              setImportText("");
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
          <div className="overflow-y-auto flex-1">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b flex items-start justify-between gap-4 sticky top-0 bg-popover z-10">
              <div>
                <DialogHeader>
                  <DialogTitle>Import Environment Variables</DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste your <code>.env</code> content below, or drag & drop a
                  file into the text area.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setImportOpen(false);
                  setImportText("");
                  setImportRows([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Controls */}
            <div className="px-6 py-4 flex flex-wrap items-center gap-3 border-b">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Target environment
                </label>
                <div className="relative">
                  <select
                    value={importEnv}
                    onChange={(e) =>
                      handleImportEnvChange(e.target.value as Environment)
                    }
                    className="appearance-none border rounded-md px-3 py-1 text-sm bg-background pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {ENVIRONMENT_VALUES.map((env) => (
                      <option key={env} value={env}>
                        {ENV_LABELS[env]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Upload file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".env,.env.local,.env.production,.env.development,.env.preview,.env.example,.txt,text/plain"
                onChange={handleFileInput}
              />
              {importRows.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {readyCount} ready · {issueCount} issues
                </span>
              )}
            </div>

            {/* Textarea with drag & drop */}
            <div className="px-6 py-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`rounded-lg border-2 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <Textarea
                  value={importText}
                  onChange={(e) => handleImportTextChange(e.target.value)}
                  placeholder={`DATABASE_URL=postgres://localhost:5432/db\nREDIS_URL=redis://localhost:6379\nAPI_KEY="secret-key"\n\n# Drag and drop a .env file here too`}
                  className="font-mono text-sm min-h-[160px] border-0 bg-transparent resize-none focus-visible:ring-0"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Preview table */}
            {importRows.length > 0 && (
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">
                    Preview ({importRows.length} variables)
                  </span>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <button
                      onClick={() =>
                        setImportRows((r) =>
                          r.map((row) => ({ ...row, selected: true }))
                        )
                      }
                    >
                      Select all
                    </button>
                    <button
                      onClick={() =>
                        setImportRows((r) =>
                          r.map((row) => ({ ...row, selected: false }))
                        )
                      }
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="w-10 px-3 py-2">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={importRows.every((r) => r.selected)}
                            onChange={(e) =>
                              setImportRows((r) =>
                                r.map((row) => ({
                                  ...row,
                                  selected: e.target.checked,
                                }))
                              )
                            }
                          />
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                          Key
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                          Value
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                          Status
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`border-b last:border-b-0 ${row.selected ? "" : "opacity-50"}`}
                        >
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={row.selected}
                              onChange={() =>
                                setImportRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, selected: !r.selected }
                                      : r
                                  )
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-xs font-medium">
                              {row.key}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 max-w-[180px]">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-xs truncate ${!row.showValue && row.isSecret ? "tracking-widest" : ""}`}
                              >
                                {row.showValue
                                  ? row.value || (
                                      <span className="text-muted-foreground italic">
                                        empty
                                      </span>
                                    )
                                  : MASK}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setImportRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id
                                        ? { ...r, showValue: !r.showValue }
                                        : r
                                    )
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                {row.showValue ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div>
                              <span
                                className={`text-[0.68rem] px-1.5 py-0.5 rounded border font-medium ${STATUS_STYLE[row.status]}`}
                              >
                                {row.status}
                              </span>
                              {row.hint && (
                                <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                                  {row.hint}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setImportRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? {
                                          ...r,
                                          isSecret: !r.isSecret,
                                          showValue: r.isSecret,
                                        }
                                      : r
                                  )
                                )
                              }
                              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ml-auto transition-colors ${row.isSecret ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" : "text-muted-foreground border-border"}`}
                            >
                              {row.isSecret ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              )}
                              {row.isSecret ? "Secret" : "Plain"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="border-t px-6 py-3 flex items-center justify-between gap-3 bg-popover shrink-0">
            <span className="text-xs text-muted-foreground">
              {importRows.filter((r) => r.selected).length} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportOpen(false);
                  setImportText("");
                  setImportRows([]);
                }}
              >
                Cancel
              </Button>
              {issueCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImportAll(true)}
                  disabled={importing || readyCount === 0}
                >
                  {importing && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  )}
                  Skip Invalid
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleImportAll(false)}
                disabled={
                  importing || importRows.filter((r) => r.selected).length === 0
                }
              >
                {importing && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                )}
                Import{" "}
                {importRows.filter((r) => r.selected).length > 0
                  ? `(${importRows.filter((r) => r.selected).length})`
                  : "All"}
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
                            n.has(v.id) ? n.delete(v.id) : n.add(v.id);
                            return n;
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {v.isSecret && (
                          <Lock className="h-3 w-3 text-yellow-500 flex-shrink-0" />
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
