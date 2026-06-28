import { z } from "zod";

export const addDomainSchema = z.object({
  projectId: z.string().uuid(),
  hostname: z
    .string()
    .min(3)
    .max(253)
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
      "Invalid domain name"
    ),
});

export type AddDomainInput = z.infer<typeof addDomainSchema>;
