import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listApiKeys, createApiKey } from "@/lib/keystore";
import { ApiError } from "@/lib/auth";
import { withApi } from "@/lib/api";

export const runtime = "nodejs";

/** GET /api/admin/keys — list all keys (requires admin bearer). */
export async function GET(req: NextRequest) {
  return withApi(req, async () => {
    requireAdmin(req.headers.get("authorization"));
    const keys = await listApiKeys();
    return NextResponse.json({ keys });
  });
}

/** POST /api/admin/keys — create a new key { label, quota }. */
export async function POST(req: NextRequest) {
  return withApi(req, async () => {
    requireAdmin(req.headers.get("authorization"));

    let body: { label?: string; quota?: number };
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const label = (body.label ?? "").toString().trim() || "untitled";
    const quota = Number(body.quota ?? process.env.DEFAULT_QUOTA ?? 1000);
    if (!Number.isFinite(quota) || quota <= 0) {
      throw new ApiError("INVALID_QUOTA", 400, "quota must be a positive number.");
    }

    const record = await createApiKey(label, Math.floor(quota));
    return NextResponse.json({ key: record.key, record }, { status: 201 });
  });
}
