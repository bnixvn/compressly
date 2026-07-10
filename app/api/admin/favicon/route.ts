import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { patchSettings, removeFavicon, saveFavicon } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Admin: upload the site favicon.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get("authorization"));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No favicon file provided." }, { status: 400 });
    }
    const url = await saveFavicon(file);
    const s = await patchSettings({ faviconUrl: url });
    return NextResponse.json({ faviconUrl: s.faviconUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get("authorization"));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }
  await removeFavicon();
  const s = await patchSettings({ faviconUrl: null });
  return NextResponse.json({ faviconUrl: s.faviconUrl });
}
