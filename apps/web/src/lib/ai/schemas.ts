import { z } from "zod";

const stringList = z.array(z.string().min(1)).max(12);

export const repoAnalysisSchema = z.object({
  summary: z.string().min(1),
  bugs: stringList,
  security: stringList,
  performance: stringList,
  architecture: stringList,
  positives: stringList,
  recommendations: stringList,
}).strict();

export const prIssueSchema = z.object({
  severity: z.enum(["LOW", "MED", "HIGH", "CRITICAL"]),
  category: z.enum(["security", "performance", "maintainability", "bug", "architecture"]),
  title: z.string().min(1),
  description: z.string().min(1),
  suggestion: z.string().min(1),
  confidence: z.number().min(0).max(1),
}).strict();

export const prReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(prIssueSchema).max(20),
}).strict();

export type RepoAnalysisText = z.infer<typeof repoAnalysisSchema>;
export type PrReviewOutput = z.infer<typeof prReviewSchema>;

export const repoAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    bugs: { type: "array", items: { type: "string" } },
    security: { type: "array", items: { type: "string" } },
    performance: { type: "array", items: { type: "string" } },
    architecture: { type: "array", items: { type: "string" } },
    positives: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "bugs", "security", "performance", "architecture", "positives", "recommendations"],
} as const;

export const prReviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          severity: { type: "string", enum: ["LOW", "MED", "HIGH", "CRITICAL"] },
          category: { type: "string", enum: ["security", "performance", "maintainability", "bug", "architecture"] },
          title: { type: "string" },
          description: { type: "string" },
          suggestion: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["severity", "category", "title", "description", "suggestion", "confidence"],
      },
    },
  },
  required: ["summary", "issues"],
} as const;
