import { nextjs } from "./definitions/next";
import { vite } from "./definitions/vite";
import { express } from "./definitions/express";
import { staticHtml } from "./definitions/static";
import { docker } from "./definitions/docker";
import type { FrameworkDefinition } from "./types";

export const frameworkRegistry: FrameworkDefinition[] = [
  nextjs,
  vite,
  express,
  staticHtml,
  docker,
];

export function getFrameworkById(id: string): FrameworkDefinition | undefined {
  return frameworkRegistry.find((f) => f.id === id);
}

export function detectFramework(
  files: string[]
): FrameworkDefinition | undefined {
  // Simple heuristic: return the first framework that matches any of its detectFiles
  for (const framework of frameworkRegistry) {
    if (framework.detectFiles.some((df) => files.includes(df))) {
      return framework;
    }
  }
  return undefined;
}
