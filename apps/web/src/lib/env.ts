export function isConfigured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export function getAiConfig() {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();
  return {
    provider,
    apiKey: process.env.GROQ_API_KEY?.trim() || "",
    model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
  };
}
