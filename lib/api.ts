import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./auth";
import { ProcessResult } from "./image";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

/** Wrap an API handler so every error becomes the standard JSON envelope. */
export async function withApi(
  req: NextRequest,
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { code: err.code, message: err.message, details: err.details ?? null },
        { status: err.status, headers: CORS_HEADERS },
      );
    }
    console.error("Unhandled API error:", err);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error.", details: null },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/** Build the binary response for an optimized image with the standard stats headers. */
export function imageResponse(result: ProcessResult, downloadName: string): NextResponse {
  const headers: Record<string, string> = {
    "Content-Type": result.outputMime,
    "Content-Disposition": `attachment; filename="${downloadName}"`,
    "X-Original-Size": String(result.originalSize),
    "X-Optimized-Size": String(result.optimizedSize),
    "X-Saved-Bytes": String(result.savedBytes),
    "X-Saved-Percent": String(result.savedPercent),
    "Cache-Control": "no-store",
    ...CORS_HEADERS,
  };
  return new NextResponse(new Uint8Array(result.data), { status: 200, headers });
}
