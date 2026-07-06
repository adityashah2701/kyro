export type LogLevel = "error" | "warn" | "success" | "info" | "default";

export type ParsedLogLine = {
  /** Original 1-based line index in the raw stream (stable identity). */
  index: number;
  /** Timestamp text parsed from a leading "[HH:MM:SS]" prefix, if present. */
  timestamp: string | null;
  /** Message with the timestamp prefix stripped. */
  message: string;
  level: LogLevel;
  /** How many consecutive identical raw lines this represents (>= 1). */
  count: number;
};

const TIMESTAMP_RE = /^\[(\d{2}:\d{2}:\d{2})\]\s?(.*)$/;

/**
 * Classify a log line's severity from explicit signals only. When nothing
 * matches we return "default" — we never guess a level that isn't evident.
 */
function classify(message: string): LogLevel {
  const m = message.toLowerCase();
  if (
    /(^|\s)(error|failed|failure|fatal|✖|❌|✗)(\s|:|$)/.test(m) ||
    m.includes("err!")
  ) {
    return "error";
  }
  if (/(^|\s)(warn|warning|⚠)(\s|:|!|$)/.test(m)) return "warn";
  if (/(✅|✓|success|succeeded|done|completed)/.test(m)) return "success";
  return "default";
}

/**
 * Turn raw log lines into structured lines: extract timestamps, classify
 * levels, and (optionally) collapse runs of identical lines into a single
 * entry with a count.
 */
export function parseLogLines(
  raw: string[],
  { collapse }: { collapse: boolean }
): ParsedLogLine[] {
  const result: ParsedLogLine[] = [];
  let lastTimestamp: string | null = null;

  raw.forEach((line, i) => {
    let cleanLine = line.trimEnd(); // Strip trailing \r
    if (cleanLine.startsWith("\\n")) cleanLine = cleanLine.substring(2);
    if (cleanLine.startsWith("\n")) cleanLine = cleanLine.substring(1);

    const match = cleanLine.match(TIMESTAMP_RE);
    if (match) {
      lastTimestamp = match[1];
    }

    const timestamp = match ? match[1] : lastTimestamp;
    const message = match ? match[2] : cleanLine;

    const parsed: ParsedLogLine = {
      index: i + 1,
      timestamp,
      message,
      level: classify(message),
      count: 1,
    };

    if (collapse) {
      const prev = result[result.length - 1];
      // Collapse if it's the exact same message and the current line was implicitly timestamped
      if (prev && prev.message === parsed.message && !match) {
        prev.count += 1;
        return;
      }
    }
    result.push(parsed);
  });

  return result;
}

export const LEVEL_CLASSNAMES: Record<LogLevel, string> = {
  error: "text-red-400",
  warn: "text-amber-400",
  success: "text-emerald-400",
  info: "text-sky-400",
  default: "text-white/85",
};
