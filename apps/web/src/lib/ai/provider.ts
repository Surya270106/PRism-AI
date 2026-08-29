import { AppError, logFailure } from "@/lib/api";
import { getAiConfig } from "@/lib/env";
import { z } from "zod";

type JsonSchema = Record<string, unknown>;

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new SyntaxError("No JSON object in model response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function generateStructured<T>(options: {
  operation: string;
  system: string;
  prompt: string;
  schemaName: string;
  jsonSchema: JsonSchema;
  validator: z.ZodType<T>;
}): Promise<T> {
  const startedAt = Date.now();
  const config = getAiConfig();
  if (config.provider !== "groq" || !config.apiKey) {
    throw new AppError("AI_NOT_CONFIGURED", "AI analysis is not configured.", 503);
  }

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(45_000),
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        max_completion_tokens: 2048,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: options.schemaName, strict: true, schema: options.jsonSchema },
        },
      }),
    });
  } catch (error) {
    logFailure("ai", options.operation, startedAt, error);
    throw new AppError("AI_UNAVAILABLE", "AI provider is temporarily unavailable.", 503, error);
  }

  if (!response.ok) {
    const category = response.status === 429 ? "rate_limited" : "provider_error";
    console.error(`[ai] ${options.operation} failed provider=groq model=${config.model} status=${response.status} category=${category} duration_ms=${Date.now() - startedAt}`);
    throw new AppError("AI_UNAVAILABLE", "AI provider is temporarily unavailable.", response.status === 429 ? 429 : 503);
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) throw new AppError("AI_RESPONSE_MALFORMED", "AI returned an empty response. Retry the analysis.", 502);

  try {
    const result = options.validator.safeParse(extractJson(raw));
    if (!result.success) throw result.error;
    console.info(`[ai] ${options.operation} succeeded provider=groq model=${config.model} duration_ms=${Date.now() - startedAt}`);
    return result.data;
  } catch (error) {
    logFailure("ai", options.operation, startedAt, error);
    throw new AppError("AI_RESPONSE_MALFORMED", "AI returned an invalid response. Retry the analysis.", 502, error);
  }
}

export const _test = { extractJson };
