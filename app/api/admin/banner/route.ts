import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { patchSettings, removeBanner, saveBanner } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Admin: upload the advertisement banner image.
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
      return NextResponse.json({ error: "No banner file provided." }, { status: 400 });
    }
    const url = await saveBanner(file);
    const s = await patchSettings({ bannerUrl: url });
    return NextResponse.json({ bannerUrl: s.bannerUrl });
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
  await removeBanner();
  const s = await patchSettings({ bannerUrl: null, bannerLink: null });
  return NextResponse.json({ bannerUrl: s.bannerUrl, bannerLink: s.bannerLink });
}
