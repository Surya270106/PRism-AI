import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { _test, generateStructured } from "./provider";

describe("AI response handling", () => {
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.GROQ_API_KEY; });

  it("extracts JSON from markdown and explanatory text", () => {
    expect(_test.extractJson("Result:\n```json\n{\"ok\":true}\n```" )).toEqual({ ok: true });
  });

  it("rejects malformed model output", () => {
    expect(() => _test.extractJson("not json")).toThrow();
  });

  it("distinguishes missing provider configuration", async () => {
    await expect(generateStructured({ operation: "test", system: "test", prompt: "test", schemaName: "test", jsonSchema: {}, validator: z.object({}) })).rejects.toMatchObject({ code: "AI_NOT_CONFIGURED", status: 503 });
  });

  it("reports provider failures without fabricating output", async () => {
    process.env.GROQ_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));
    await expect(generateStructured({ operation: "test", system: "test", prompt: "test", schemaName: "test", jsonSchema: {}, validator: z.object({}) })).rejects.toMatchObject({ code: "AI_UNAVAILABLE", status: 429 });
  });
});
