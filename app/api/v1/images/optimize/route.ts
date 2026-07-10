import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/auth";
import { extractUpload, processImage } from "@/lib/image";
import { ApiError } from "@/lib/auth";
import { OPTIMIZE_MODES, config } from "@/lib/config";
import { imageResponse, withApi } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withApi(req, async () => {
    await requireApiKey(req.headers.get("authorization"));
    const formData = await req.formData();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("MISSING_FILE", 400, "No 'file' field found in the multipart body.");
    }
    const { buffer, mime, filename } = await extractUpload(formData, config.maxFileSize);

    const mode = String(formData.get("mode") ?? "compress");
    if (!(OPTIMIZE_MODES as readonly string[]).includes(mode)) {
      throw new ApiError(
        "INVALID_MODE",
        400,
        `mode must be one of: ${OPTIMIZE_MODES.join(", ")}.`,
      );
    }

    const quality = formData.get("quality") ?? undefined;
    const result = await processImage(buffer, mode as "compress" | "webp", quality);
    const base = filename.replace(/\.[^.]+$/, "");
    return imageResponse(result, `${base}-${mode}.${result.outputExt}`);
  });
}
