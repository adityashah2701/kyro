import type { Environment } from "../schemas";

const VALID_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
export const STRICT_KEY_REGEX = /^[A-Z_][A-Z0-9_]*$/;
export const RESERVED_KEYS = new Set([
  "PATH",
  "HOME",
  "USER",
  "SHELL",
  "TERM",
  "LANG",
  "LC_ALL",
  "NODE_ENV",
  "PORT",
  "HOST",
]);

export type ImportIssueCode =
  "duplicate_key" | "invalid_name" | "malformed_entry" | "reserved_variable";

export interface ParsedEnvEntry {
  key: string;
  value: string;
  environment: Environment;
  isSecret: boolean;
  line: number;
}

export interface ParsedEnvIssue {
  code: ImportIssueCode;
  message: string;
  line: number;
  key?: string;
}

export interface ParsedEnvResult {
  entries: ParsedEnvEntry[];
  issues: ParsedEnvIssue[];
}

interface ParseState {
  index: number;
  line: number;
}

function isWhitespace(char: string | undefined): boolean {
  return char === " " || char === "\t" || char === "\r";
}

function skipWhitespace(text: string, state: ParseState): void {
  while (state.index < text.length && isWhitespace(text[state.index])) {
    state.index += 1;
  }
}

function skipToLineEnd(text: string, state: ParseState): void {
  while (state.index < text.length && text[state.index] !== "\n") {
    state.index += 1;
  }
}

function consumeNewline(text: string, state: ParseState): void {
  if (text[state.index] === "\r" && text[state.index + 1] === "\n") {
    state.index += 2;
    state.line += 1;
    return;
  }

  if (text[state.index] === "\n") {
    state.index += 1;
    state.line += 1;
  }
}

function skipBlankAndCommentLines(text: string, state: ParseState): void {
  while (state.index < text.length) {
    const start = state.index;
    skipWhitespace(text, state);

    if (state.index >= text.length) {
      return;
    }

    if (text[state.index] === "\n" || text[state.index] === "\r") {
      skipToLineEnd(text, state);
      consumeNewline(text, state);
      continue;
    }

    if (text[state.index] === "#") {
      skipToLineEnd(text, state);
      consumeNewline(text, state);
      continue;
    }

    state.index = start;
    return;
  }
}

function decodeEscape(char: string): string {
  switch (char) {
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case '"':
      return '"';
    case "'":
      return "'";
    case "\\":
      return "\\";
    default:
      return char;
  }
}

function parseQuotedValue(
  text: string,
  state: ParseState,
  quote: string
): { value: string; malformed: boolean } {
  let value = "";
  let escaped = false;

  while (state.index < text.length) {
    const char = text[state.index];

    if (escaped) {
      value += decodeEscape(char);
      escaped = false;
      state.index += 1;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      state.index += 1;
      continue;
    }

    if (char === quote) {
      state.index += 1;
      return { value, malformed: false };
    }

    if (char === "\r" && text[state.index + 1] === "\n") {
      value += "\n";
      state.index += 2;
      state.line += 1;
      continue;
    }

    if (char === "\n") {
      value += "\n";
      state.index += 1;
      state.line += 1;
      continue;
    }

    value += char;
    state.index += 1;
  }

  return { value, malformed: true };
}

function parseUnquotedValue(
  text: string,
  state: ParseState
): { value: string; malformed: boolean } {
  const start = state.index;
  let value = "";

  while (state.index < text.length) {
    const char = text[state.index];

    if (char === "\n" || char === "\r") {
      break;
    }

    if (char === "#") {
      const previous = text[state.index - 1];
      if (state.index === start || isWhitespace(previous)) {
        break;
      }
    }

    value += char;
    state.index += 1;
  }

  return { value: value.trimEnd(), malformed: false };
}

function parseValue(
  text: string,
  state: ParseState
): { value: string; malformed: boolean } {
  const quote = text[state.index];

  if (quote === '"' || quote === "'") {
    state.index += 1;
    const parsed = parseQuotedValue(text, state, quote);

    if (parsed.malformed) {
      return parsed;
    }

    skipWhitespace(text, state);
    if (text[state.index] === "#") {
      skipToLineEnd(text, state);
    }

    return parsed;
  }

  return parseUnquotedValue(text, state);
}

function isValidName(name: string): boolean {
  return VALID_NAME_REGEX.test(name);
}

function normalizeKey(key: string): string {
  return key.trim();
}

function buildIssue(
  code: ImportIssueCode,
  line: number,
  message: string,
  key?: string
): ParsedEnvIssue {
  return { code, line, message, key };
}

export function parseEnvContent(
  input: string,
  targetEnvironment: Environment
): ParsedEnvResult {
  const text = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const state: ParseState = { index: 0, line: 1 };
  const entries: ParsedEnvEntry[] = [];
  const issues: ParsedEnvIssue[] = [];
  const seen = new Map<string, number>();

  while (state.index < text.length) {
    skipBlankAndCommentLines(text, state);
    if (state.index >= text.length) {
      break;
    }

    const lineNumber = state.line;

    if (text.startsWith("export", state.index)) {
      const next = text[state.index + 6];
      if (isWhitespace(next)) {
        state.index += 6;
        skipWhitespace(text, state);
      }
    }

    const keyStart = state.index;
    while (state.index < text.length) {
      const char = text[state.index];
      if (
        char === "=" ||
        char === "\n" ||
        char === "\r" ||
        isWhitespace(char)
      ) {
        break;
      }
      state.index += 1;
    }

    const rawKey = normalizeKey(text.slice(keyStart, state.index));
    skipWhitespace(text, state);
    const canonicalKey = rawKey.toUpperCase();
    let value = "";

    if (!rawKey || text[state.index] !== "=") {
      issues.push(
        buildIssue(
          "malformed_entry",
          lineNumber,
          "Malformed entry: expected KEY=VALUE",
          rawKey || undefined
        )
      );
      skipToLineEnd(text, state);
      consumeNewline(text, state);
    } else {
      state.index += 1;
      skipWhitespace(text, state);

      const parsedValue = parseValue(text, state);
      value = parsedValue.value;

      skipToLineEnd(text, state);
      consumeNewline(text, state);

      if (parsedValue.malformed) {
        issues.push(
          buildIssue(
            "malformed_entry",
            lineNumber,
            `Malformed value for "${rawKey}"`,
            rawKey
          )
        );
      }
    }
    const keyExists = seen.has(canonicalKey);

    if (!isValidName(rawKey) || rawKey !== canonicalKey) {
      issues.push(
        buildIssue(
          "invalid_name",
          lineNumber,
          "Variable names must use uppercase letters, digits, and underscores, and cannot start with a digit",
          rawKey
        )
      );
    }

    if (RESERVED_KEYS.has(canonicalKey)) {
      issues.push(
        buildIssue(
          "reserved_variable",
          lineNumber,
          `"${canonicalKey}" is reserved and cannot be imported`,
          rawKey
        )
      );
    }

    if (keyExists) {
      issues.push(
        buildIssue(
          "duplicate_key",
          lineNumber,
          `Duplicate key "${canonicalKey}"`,
          rawKey
        )
      );
    }

    seen.set(canonicalKey, lineNumber);

    entries.push({
      key: canonicalKey,
      value,
      environment: targetEnvironment,
      isSecret: false,
      line: lineNumber,
    });
  }

  return { entries, issues };
}

export function isSupportedEnvFile(name: string): boolean {
  const allowed = [
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    ".env.preview",
    ".env.example",
    ".txt",
  ];

  return allowed.some((suffix) => name === suffix || name.endsWith(suffix));
}

export function makePreviewTitle(fileName?: string): string {
  if (!fileName) {
    return "Pasted .env content";
  }

  return fileName;
}

export function buildEnvFileContent(
  entries: Array<{
    key: string;
    value: string;
    isSecret: boolean;
    revealed?: boolean;
  }>
): string {
  return entries
    .map((entry) => {
      const value = entry.isSecret && !entry.revealed ? "" : entry.value;
      if (value === "") return `${entry.key}=`;
      if (
        /[\n\r]/.test(value) ||
        /^\s|\s$/.test(value) ||
        /[#"=]/.test(value)
      ) {
        return `${entry.key}=${JSON.stringify(value)}`;
      }
      return `${entry.key}=${value}`;
    })
    .join("\n");
}

export function buildEnvExampleContent(
  entries: Array<{ key: string }>
): string {
  return entries.map((entry) => `${entry.key}=`).join("\n");
}

export function buildSelectedEnvContent(
  entries: Array<{
    key: string;
    value: string;
    isSecret: boolean;
    revealed?: boolean;
  }>
): string {
  return buildEnvFileContent(entries);
}
