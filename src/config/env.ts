import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.coerce.number(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
