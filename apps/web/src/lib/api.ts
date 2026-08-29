import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "AUTH_REQUIRED"
  | "GITHUB_FORBIDDEN"
  | "GITHUB_NOT_FOUND"
  | "GITHUB_RATE_LIMITED"
  | "GITHUB_UNAVAILABLE"
  | "AI_NOT_CONFIGURED"
  | "AI_UNAVAILABLE"
  | "AI_RESPONSE_MALFORMED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown) {
  const appError = error instanceof AppError
    ? error
    : new AppError("INTERNAL_ERROR", "The request could not be completed.", 500, error);

  return NextResponse.json(
    { success: false, error: { code: appError.code, message: appError.message } },
    { status: appError.status },
  );
}

export function logFailure(service: string, operation: string, startedAt: number, error: unknown) {
  const appError = error instanceof AppError ? error : undefined;
  console.error(
    `[${service}] ${operation} failed status=${appError?.status ?? "unknown"} category=${appError?.code ?? "unexpected"} duration_ms=${Date.now() - startedAt}`,
  );
}
