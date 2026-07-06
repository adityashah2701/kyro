import { z } from "zod";
import { RESERVED_KEYS, STRICT_KEY_REGEX } from "../utils/env-import-parser";

export const ENVIRONMENT_VALUES = [
  "development",
  "preview",
  "production",
] as const;
export type Environment = (typeof ENVIRONMENT_VALUES)[number];

// POSIX env var key: uppercase letters, digits, and underscores, must not start
// with a digit. Single source of truth lives in the .env import parser.
const ENV_KEY_REGEX = STRICT_KEY_REGEX;

export const envVariableSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .max(256, "Key must be at most 256 characters")
    .regex(
      ENV_KEY_REGEX,
      "Key must be uppercase letters, digits, and underscores only, and cannot start with a digit"
    )
    .refine((k) => !RESERVED_KEYS.has(k), {
      message: "This key is reserved and cannot be used",
    }),
  value: z.string().max(32768, "Value must be at most 32KB"),
  environment: z.enum(ENVIRONMENT_VALUES),
  isSecret: z.boolean().default(false),
});

export type EnvVariableInput = z.infer<typeof envVariableSchema>;
