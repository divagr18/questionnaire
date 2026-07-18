import { z } from "zod";

export const packInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).default(""),
  accent: z.enum(["plum", "cobalt", "coral", "forest", "sand"]).default("plum"),
  isPublished: z.boolean().default(false),
});

export const submissionInputSchema = z.object({
  submissionToken: z.string().min(8).max(100),
  name: z.string().trim().min(1).max(80),
  question: z.string().trim().min(3).max(500),
});

export const submissionEditSchema = z.object({
  name: z.string().trim().min(1).max(80),
  question: z.string().trim().min(3).max(500),
});

export const queueInputSchema = z.object({
  submissionIds: z.array(z.string().uuid()).max(300),
});

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
