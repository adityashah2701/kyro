"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
            <CheckCircle2 className="h-3 w-3" /> {label}
          </span>
        );
      case "failed":
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="border rounded-lg bg-card p-6 max-w-2xl">
        <h3 className="text-lg font-medium mb-2">Custom Domains</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add custom domains to serve your active deployments. You&apos;ll need
          to configure your DNS settings.
        </p>

        <form onSubmit={handleAddDomain} className="flex gap-2 mb-8">
          <Input
            placeholder="example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            disabled={isAdding}
            className="flex-1"
          />
          <Button type="submit" disabled={isAdding || !newDomain}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add
          </Button>
        </form>

        <div className="space-y-4">
          {domains.map((d) => {
            const isProcessing = processingId === d.id;
            const instructions = getDnsInstructions(d.hostname);
            return (
              <div key={d.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-lg">{d.hostname}</span>
                    {d.isPrimary && (
                      <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-2">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!d.isPrimary && d.verificationStatus === "verified" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(d.id)}
                        disabled={isProcessing}
                      >
                        Make Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(d.id)}
                      disabled={isProcessing}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      Domain Status
                    </span>
                    {renderStatusBadge(d.verificationStatus, "Verified")}
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      SSL Certificate
                    </span>
                    {renderStatusBadge(d.sslStatus, "Secured")}
                  </div>
                </div>

                {d.verificationStatus !== "verified" && (
                  <div className="bg-muted p-4 rounded-md mt-4">
                    <h4 className="text-sm font-semibold mb-2">
                      DNS Configuration ({instructions.type})
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please configure the following records in your DNS
                      provider:
                    </p>
                    <div className="space-y-2 mb-4">
                      {instructions.records.map((r, i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row gap-2 bg-background p-2 rounded text-sm border font-mono"
                        >
                          <span className="w-16 text-muted-foreground">
                            {r.type}
                          </span>
                          <span className="w-24 text-muted-foreground">
                            {r.name}
                          </span>
                          <span className="flex-1 overflow-auto">
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleVerify(d.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Verify Record
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {domains.length === 0 && (
            <div className="text-center p-6 border border-dashed rounded text-muted-foreground text-sm">
              No custom domains added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
