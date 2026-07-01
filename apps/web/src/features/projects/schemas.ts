import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(64, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(64, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  description: z.string().max(255, "Description is too long").optional(),
  framework: z.string().min(1, "Framework is required"),
  buildCommand: z.string().optional(),
  installCommand: z.string().optional(),
  startCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
  rootDirectory: z.string().optional(),
  visibility: z.enum(["public", "private"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
