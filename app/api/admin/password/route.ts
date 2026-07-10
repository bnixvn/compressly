import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { patchSettings, readSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Admin: change the admin password at runtime (persisted + applied immediately).
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get("authorization"));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }

  const body = await req.json().catch(() => ({}));
  const current = (body.current ?? "").toString();
  const next = (body.password ?? "").toString();

  // Re-verify current password explicitly (requireAdmin already validated the
  // bearer token, but the request body must also carry the current password).
  const stored = (await readSettings()).adminPassword || process.env.ADMIN_PASSWORD || "";
  if (current.replace(/^["']|["']$/g, "") !== stored.replace(/^["']|["']$/g, "")) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }
  if (next.length < 4) {
    return NextResponse.json({ error: "New password must be at least 4 characters." }, { status: 400 });
  }

  const s = await patchSettings({ adminPassword: next });
  // Apply immediately without restart.
  process.env.ADMIN_PASSWORD = next;
  return NextResponse.json({ ok: true, defaultLang: s.defaultLang, defaultTheme: s.defaultTheme });
}
