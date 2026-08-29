export type ApiPayload = { error?: string | { message?: string }; warning?: string };

export async function readApiResponse(response: Response): Promise<Record<string, unknown> & ApiPayload> {
  const data = await response.json().catch(() => ({})) as Record<string, unknown> & ApiPayload;
  if (!response.ok) {
    const message = typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return data;
}
