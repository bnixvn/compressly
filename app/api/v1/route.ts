import { NextRequest, NextResponse } from "next/server";
import { withApi, CORS_HEADERS } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withApi(req, async () => {
    return NextResponse.json(
      {
        service: "Compressly Image API",
        version: "v1",
        endpoints: [
          "POST /api/v1/images/compress",
          "POST /api/v1/images/convert/webp",
          "POST /api/v1/images/optimize",
        ],
        auth: "Authorization: Bearer <api_key>",
        headers: ["X-Original-Size", "X-Optimized-Size", "X-Saved-Bytes", "X-Saved-Percent"],
      },
      { headers: CORS_HEADERS },
    );
  });
}
