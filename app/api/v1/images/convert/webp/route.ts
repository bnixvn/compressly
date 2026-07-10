import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/auth";
import { extractUpload, processImage } from "@/lib/image";
import { config } from "@/lib/config";
import { imageResponse, withApi } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withApi(req, async () => {
    await requireApiKey(req.headers.get("authorization"));
    const formData = await req.formData();
    const { buffer, filename } = await extractUpload(formData, config.maxFileSize);
    const result = await processImage(buffer, "webp");
    const base = filename.replace(/\.[^.]+$/, "");
    return imageResponse(result, `${base}.${result.outputExt}`);
  });
}
