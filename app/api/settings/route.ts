import { NextRequest, NextResponse } from "next/server";
import { readSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Public: returns display settings only (no secrets).
export async function GET(req: NextRequest) {
  const s = await readSettings();
  const lang = req.nextUrl.searchParams.get("lang") === "vi" ? "vi" : "en";
  return NextResponse.json({
    bannerUrl: s.bannerUrl,
    logoUrl: s.logoUrl,
    siteName: s.siteName[lang] || s.siteName.en,
    seoTitle: s.seoTitle[lang],
    seoDescription: s.seoDescription[lang],
    footerContent: s.footerContent[lang],
  });
}
