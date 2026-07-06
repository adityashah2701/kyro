"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFixedVirtualizer } from "../hooks/use-fixed-virtualizer";
import {
  Terminal,
  TerminalHeader,
  TerminalBody,
} from "@/components/ui/terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Copy,
  Download,
  Clock,
  ArrowDownToLine,
  Loader2,
  RotateCw,
  ChevronsDownUp,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDeploymentLogs } from "../hooks/use-deployment-logs";
import {
  parseLogLines,
  LEVEL_CLASSNAMES,
  type ParsedLogLine,
} from "../lib/log-parser";

const ROW_HEIGHT = 20;

export function LogTerminal({
  deploymentId,
  live,
  deploymentNumber,
}: {
  deploymentId: string;
  live: boolean;
  deploymentNumber?: number;
}) {
  const { lines, status, retry } = useDeploymentLogs(deploymentId, { live });

  const [search, setSearch] = useState("");
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [collapse, setCollapse] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Guards the autoScroll toggle from being flipped by programmatic scrolls.
  const programmaticScroll = useRef(false);

  const parsed = useMemo(
    () => parseLogLines(lines, { collapse }),
    [lines, collapse]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parsed;
    return parsed.filter((l) => l.message.toLowerCase().includes(q));
  }, [parsed, search]);

  const getScrollElement = useCallback(() => scrollRef.current, []);

  const rowVirtualizer = useFixedVirtualizer({
    count: filtered.length,
    getScrollElement,
    itemHeight: ROW_HEIGHT,
    overscan: 24,
  });

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    programmaticScroll.current = true;
    el.scrollTop = el.scrollHeight;
    // Release the guard after the scroll settles.
    requestAnimationFrame(() => {
      programmaticScroll.current = false;
    });
  }, []);

  // Auto-scroll to the newest line as logs arrive (unless the user paused it).
  useEffect(() => {
    if (autoScroll) scrollToBottom();
  }, [filtered.length, autoScroll, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || programmaticScroll.current) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 40;
    setAutoScroll(atBottom);
  }, []);

  const rawText = useMemo(
    () =>
      parsed
        .map((l) => {
          const ts = showTimestamps && l.timestamp ? `[${l.timestamp}] ` : "";
          const suffix = l.count > 1 ? ` (×${l.count})` : "";
          return `${ts}${l.message}${suffix}`;
        })
        .join("\n"),
    [parsed, showTimestamps]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy logs");
    }
  }, [rawText]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([rawText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployment-${deploymentNumber ?? deploymentId}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rawText, deploymentNumber, deploymentId]);

  const isConnecting = status === "connecting";
  const isStreaming = live && status === "open";

  return (
    <Terminal className="h-[calc(100vh-16rem)] min-h-[420px]">
      <TerminalHeader>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs…"
            className="h-7 border-white/10 bg-white/5 pl-7 text-xs text-white/90 placeholder:text-white/40"
          />
        </div>

        <div className="flex items-center gap-1 text-[11px] text-white/50">
          {isStreaming ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          ) : null}
          <span className="tabular-nums">
            {filtered.length}
            {search ? ` / ${parsed.length}` : ""} lines
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <TerminalToggle
            active={showTimestamps}
            onClick={() => setShowTimestamps((v) => !v)}
            title="Toggle timestamps"
          >
            <Clock className="size-3.5" />
          </TerminalToggle>
          <TerminalToggle
            active={collapse}
            onClick={() => setCollapse((v) => !v)}
            title="Collapse repeated lines"
          >
            <ChevronsDownUp className="size-3.5" />
          </TerminalToggle>
          <TerminalToggle
            active={autoScroll}
            onClick={() => {
              setAutoScroll(true);
              scrollToBottom();
            }}
            title={autoScroll ? "Auto-scroll on" : "Jump to bottom"}
          >
            <ArrowDownToLine className="size-3.5" />
          </TerminalToggle>
          <TerminalToggle onClick={handleCopy} title="Copy logs">
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </TerminalToggle>
          <TerminalToggle onClick={handleDownload} title="Download logs">
            <Download className="size-3.5" />
          </TerminalToggle>
        </div>
      </TerminalHeader>

      <TerminalBody ref={scrollRef} onScroll={handleScroll}>
        {isConnecting && filtered.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 text-white/50">
            <Loader2 className="size-3.5 animate-spin" />
            Connecting to logs…
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-start gap-2 px-4 py-3 text-white/60">
            <span>Log stream disconnected.</span>
            <Button
              size="xs"
              variant="outline"
              onClick={retry}
              className="border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <RotateCw className="size-3" />
              Reconnect
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3 text-white/40">
            {search ? "No lines match your search." : "No logs available."}
          </div>
        ) : (
          <div
            className="relative w-full px-4 py-2"
            style={{ height: rowVirtualizer.totalSize }}
          >
            {rowVirtualizer.virtualItems.map((virtualRow) => {
              const line = filtered[virtualRow.index];
              return (
                <LogRow
                  key={virtualRow.key}
                  line={line}
                  search={search}
                  showTimestamps={showTimestamps}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              );
            })}
          </div>
        )}
      </TerminalBody>
    </Terminal>
  );
}

function TerminalToggle({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-white/10 text-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function LogRow({
  line,
  search,
  showTimestamps,
  style,
}: {
  line: ParsedLogLine;
  search: string;
  showTimestamps: boolean;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className="flex items-baseline gap-4 whitespace-pre font-mono text-xs"
    >
      {showTimestamps && (
        <span className="shrink-0 select-none text-white/30 tabular-nums">
          {line.timestamp ?? "        "}
        </span>
      )}
      <span
        className={cn("min-w-0 flex-1 truncate", LEVEL_CLASSNAMES[line.level])}
      >
        {highlight(line.message, search)}
      </span>
      {line.count > 1 && (
        <span className="shrink-0 select-none rounded bg-white/10 px-1 text-[10px] text-white/50">
          ×{line.count}
        </span>
      )}
    </div>
  );
}

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const target = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(target, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={key++} className="rounded-sm bg-amber-400/30 text-inherit">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return parts;
}
