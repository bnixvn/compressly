import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteApiKey, setApiKeyQuota, setApiKeyActive } from "@/lib/keystore";
import { ApiError } from "@/lib/auth";
import { withApi } from "@/lib/api";

export const runtime = "nodejs";

/** DELETE /api/admin/keys/[key] — revoke a key. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  return withApi(req, async () => {
    requireAdmin(req.headers.get("authorization"));
    const { key } = await params;
    const ok = await deleteApiKey(key);
    if (!ok) {
      throw new ApiError("KEY_NOT_FOUND", 404, "API key not found.");
    }
    return NextResponse.json({ deleted: true });
  });
}

/** PATCH /api/admin/keys/[key] — update quota { quota } or toggle active. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  return withApi(req, async () => {
    requireAdmin(req.headers.get("authorization"));
    const { key } = await params;

    let body: { quota?: number; active?: boolean };
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (typeof body.quota === "number") {
      const quota = Number(body.quota);
      if (!Number.isFinite(quota) || quota <= 0) {
        throw new ApiError("INVALID_QUOTA", 400, "quota must be a positive number.");
      }
      const ok = await setApiKeyQuota(key, Math.floor(quota));
      if (!ok) throw new ApiError("KEY_NOT_FOUND", 404, "API key not found.");
    }

    if (typeof body.active === "boolean") {
      const ok = await setApiKeyActive(key, body.active);
      if (!ok) throw new ApiError("KEY_NOT_FOUND", 404, "API key not found.");
    }

    return NextResponse.json({ updated: true });
  });
}
