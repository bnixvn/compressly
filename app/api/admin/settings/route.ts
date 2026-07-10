import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { patchSettings, readSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Admin: read / update site settings (banner URL, default theme/lang).
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get("authorization"));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }
  const s = await readSettings();
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get("authorization"));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 401 });
  }
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};
  if (body.bannerUrl !== undefined) patch.bannerUrl = body.bannerUrl;
  if (body.defaultTheme) patch.defaultTheme = body.defaultTheme;
  if (body.defaultLang) patch.defaultLang = body.defaultLang;
  if (body.logoUrl !== undefined) patch.logoUrl = body.logoUrl;
  if (body.faviconUrl !== undefined) patch.faviconUrl = body.faviconUrl;
  if (body.siteName && typeof body.siteName === "object")
    patch.siteName = { en: String(body.siteName.en ?? "").trim(), vi: String(body.siteName.vi ?? "").trim() };
  else if (typeof body.siteName === "string" && body.siteName.trim())
    patch.siteName = { en: body.siteName.trim(), vi: "" };
  if (body.seoTitle && typeof body.seoTitle === "object")
    patch.seoTitle = { en: String(body.seoTitle.en ?? ""), vi: String(body.seoTitle.vi ?? "") };
  if (body.seoDescription && typeof body.seoDescription === "object")
    patch.seoDescription = { en: String(body.seoDescription.en ?? ""), vi: String(body.seoDescription.vi ?? "") };
  if (body.footerContent && typeof body.footerContent === "object")
    patch.footerContent = { en: String(body.footerContent.en ?? ""), vi: String(body.footerContent.vi ?? "") };
  const s = await patchSettings(patch);
  return NextResponse.json(s);
}
