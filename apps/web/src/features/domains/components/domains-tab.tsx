"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { toast } from "sonner";
import {
  addDomainAction,
  removeDomainAction,
  verifyDomainAction,
  setPrimaryDomainAction,
} from "../actions";
import {
  Loader2,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { getDnsInstructions } from "../utils";

type DomainData = {
  id: string;
  hostname: string;
  isPrimary: boolean;
  verificationStatus: string;
  sslStatus: string;
};

export function DomainsTab({
  domains,
  projectId,
}: {
  domains: DomainData[];
  projectId: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;

    try {
      setIsAdding(true);
      const res = await addDomainAction({ projectId, hostname: newDomain });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Domain added successfully!");
        setNewDomain("");
      }
    } catch (err) {
      toast.error("Failed to add domain.");
      console.log(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    try {
      setProcessingId(domainId);
      const res = await verifyDomainAction(domainId, projectId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Domain verification processed.");
      }
    } catch (err) {
      toast.error("Failed to verify domain.");
      console.log(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async (domainId: string) => {
    if (!confirm("Are you sure you want to remove this domain?")) return;
    try {
      setProcessingId(domainId);
      const res = await removeDomainAction(domainId, projectId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Domain removed.");
      }
    } catch (err) {
      toast.error("Failed to remove domain.");
      console.log(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetPrimary = async (domainId: string) => {
    try {
      setProcessingId(domainId);
      const res = await setPrimaryDomainAction(domainId, projectId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Primary domain updated.");
      }
    } catch (err) {
      toast.error("Failed to set primary domain.");
      console.log(err);
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatusBadge = (status: string, label: string) => {
    switch (status) {
      case "verified":
      case "ready":
      case "configured":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success border border-success/20">
            <CheckCircle2 className="size-3" /> {label}
          </span>
        );
      case "failed":
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-medium text-destructive border border-destructive/20">
            <XCircle className="size-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-0.5 text-[11px] font-medium text-warning border border-warning/20">
            <Clock className="size-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col rounded-xl border border-border/40 bg-card/40 shadow-sm overflow-hidden transition-all hover:border-border/60 hover:bg-card/60">
        {/* Header / Add Form */}
        <div className="flex flex-col md:flex-row justify-between gap-6 p-6 border-b border-border/40 bg-muted/10">
          <div className="flex flex-col gap-1.5 md:max-w-[50%]">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Custom Domains
            </h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Add custom domains to serve your active deployments. You&apos;ll
              need to configure your DNS settings.
            </p>
          </div>
          <div className="w-full md:w-[400px]">
            <form onSubmit={handleAddDomain} className="flex gap-2">
              <Input
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                disabled={isAdding}
                className="flex-1 bg-background/50 h-10 shadow-sm"
              />
              <Button
                type="submit"
                disabled={isAdding || !newDomain}
                className="h-10"
              >
                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add
              </Button>
            </form>
          </div>
        </div>

        {/* Domain List */}
        <div className="flex flex-col">
          {domains.map((d, index) => {
            const isProcessing = processingId === d.id;
            const instructions = getDnsInstructions(d.hostname);
            return (
              <div
                key={d.id}
                className={`p-6 ${index !== domains.length - 1 ? "border-b border-border/40" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-background border shadow-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">
                          {d.hostname}
                        </span>
                        {d.isPrimary && (
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!d.isPrimary && d.verificationStatus === "verified" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(d.id)}
                        disabled={isProcessing}
                        className="h-8 text-xs"
                      >
                        Make Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(d.id)}
                      disabled={isProcessing}
                      aria-label="Remove domain"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Domain Status
                    </span>
                    <div>
                      {renderStatusBadge(d.verificationStatus, "Verified")}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                      SSL Certificate
                    </span>
                    <div>{renderStatusBadge(d.sslStatus, "Secured")}</div>
                  </div>
                </div>

                {d.verificationStatus !== "verified" && (
                  <div className="mt-6 rounded-lg border border-warning/20 bg-warning/5 overflow-hidden">
                    <div className="p-4 bg-warning/10 border-b border-warning/20">
                      <h4 className="text-sm font-semibold text-warning-foreground">
                        DNS Configuration ({instructions.type})
                      </h4>
                      <p className="text-[13px] text-warning-foreground/80 mt-1">
                        Please configure the following records in your DNS
                        provider:
                      </p>
                    </div>
                    <div className="p-4 space-y-3 bg-background/50">
                      {instructions.records.map((r, i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-2 rounded-md border bg-card p-3 font-mono text-sm sm:flex-row sm:items-center shadow-sm"
                        >
                          <span className="w-16 shrink-0 text-muted-foreground font-semibold">
                            {r.type}
                          </span>
                          <span className="w-24 shrink-0 text-foreground font-semibold">
                            {r.name}
                          </span>
                          <span className="flex-1 overflow-x-auto text-muted-foreground">
                            {r.value}
                          </span>
                          <CopyButton
                            value={r.value}
                            size="icon-xs"
                            label={`Copy ${r.type} record`}
                          />
                        </div>
                      ))}
                      <div className="pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleVerify(d.id)}
                          disabled={isProcessing}
                          className="w-full sm:w-auto h-9"
                        >
                          {isProcessing && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Verify Record
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {domains.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted/50 border">
                <Globe className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-foreground">
                  No domains added
                </p>
                <p className="text-sm text-muted-foreground">
                  Add a custom domain above to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
