import { NextRequest, NextResponse } from "next/server";
import { extractUpload, processImage } from "@/lib/image";
import { config } from "@/lib/config";
import { requireWebAccess, ApiError } from "@/lib/auth";
import { withApi } from "@/lib/api";

export const runtime = "nodejs";

/**
 * Public web UI endpoint. No API key required.
 * Enforces the SaaS UI limits: max 20 files per request, 5MB per file.
 */
export async function POST(req: NextRequest) {
  return withApi(req, async () => {
    requireWebAccess();

    const formData = await req.formData();
    const files = formData.getAll("file").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      throw new ApiError("MISSING_FILE", 400, "No 'file' field found in the multipart body.");
    }
    if (files.length > config.web.maxFiles) {
      throw new ApiError(
        "TOO_MANY_FILES",
        400,
        `You can upload at most ${config.web.maxFiles} files per request.`,
      );
    }

    const mode = String(formData.get("mode") ?? "compress");
    const quality = formData.get("quality") ?? undefined;

    const meta: any[] = [];
    const encoded: { mime: string; data: string }[] = [];
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    for (const file of files) {
      const single = new FormData();
      single.append("file", file);
      const { buffer } = await extractUpload(single, config.web.maxFileSize);

      const result = await processImage(
        buffer,
        mode === "webp" ? "webp" : "compress",
        quality,
      );

      totalOriginalSize += result.originalSize;
      totalOptimizedSize += result.optimizedSize;

      meta.push({
        filename: file.name || "image",
        outputExt: result.outputExt,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        savedBytes: result.savedBytes,
        savedPercent: result.savedPercent,
      });
      encoded.push({
        mime: result.outputMime,
        data: result.data.toString("base64"),
      });
    }

    const saved = Math.max(0, totalOriginalSize - totalOptimizedSize);
    const percent =
      totalOriginalSize > 0 ? Math.round((saved / totalOriginalSize) * 1000) / 10 : 0;

    return new NextResponse(
      JSON.stringify({
        count: files.length,
        totalOriginalSize,
        totalOptimizedSize,
        totalSavedBytes: saved,
        totalSavedPercent: percent,
        files: meta.map((m, i) => ({
          ...m,
          dataUrl: `data:${encoded[i].mime};base64,${encoded[i].data}`,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      },
    );
  });
}
