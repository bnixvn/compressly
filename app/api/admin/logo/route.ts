import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { patchSettings, removeLogo, saveLogo } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Admin: upload the site logo.
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
      return NextResponse.json({ error: "No logo file provided." }, { status: 400 });
    }
    const url = await saveLogo(file);
    const s = await patchSettings({ logoUrl: url });
    return NextResponse.json({ logoUrl: s.logoUrl });
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
  await removeLogo();
  const s = await patchSettings({ logoUrl: null });
  return NextResponse.json({ logoUrl: s.logoUrl });
}
