import { z } from "zod";

export const interviewAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
});

export const decisionActionSchema = z.object({
  action: z.enum(["completed", "ignored", "delayed", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});

export const researchQueuePatchSchema = z.object({
  action: z.enum(["approve", "reject", "save-memory"]).optional(),
  status: z.string().trim().max(50).optional(),
});

export const folderSelectionSchema = z.object({
  folderIds: z.array(z.string().trim().min(1).max(200)).max(20),
});

export const userProfilePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  role: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
});

export const knowledgeCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(4000).optional(),
  content: z.string().trim().max(20000).optional(),
  source: z.string().trim().max(200).optional(),
  url: z.string().trim().url().max(2000).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional(),
  subcategory: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export function parseJsonBody<T>(schema: z.ZodType<T>, body: unknown):
  | { success: true; data: T }
  | { success: false; error: string } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" };
  }
  return { success: true, data: parsed.data };
}
