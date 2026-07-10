import { ApiError } from "./auth";
import { ACCEPTED_MIME, OptimizeMode, PIPELINE } from "./config";

export interface ProcessResult {
  /** Optimized image bytes. */
  data: Buffer;
  /** MIME type of the output. */
  outputMime: string;
  /** Output file extension (no dot), e.g. "webp". */
  outputExt: string;
  /** Original byte length. */
  originalSize: number;
  /** Optimized byte length. */
  optimizedSize: number;
  /** Bytes saved (original - optimized). */
  savedBytes: number;
  /** Saved percentage, rounded to 1 decimal. */
  savedPercent: number;
}

function clampQuality(q: unknown): number {
  const n = Number(q);
  if (!Number.isFinite(n) || n < 1 || n > 100) {
    throw new ApiError("INVALID_QUALITY", 400, "quality must be a number between 1 and 100.");
  }
  return Math.round(n);
}

/**
 * Core image pipeline built on Sharp.
 * - compress: keep the source format (jpeg stays jpeg, png stays png).
 * - webp: transcode to webp, preserving transparency for png sources.
 */
export async function processImage(
  input: Buffer,
  mode: OptimizeMode,
  qualityOverride?: unknown,
  stripMetadata = true,
): Promise<ProcessResult> {
  const originalSize = input.length;
  if (originalSize === 0) {
    throw new ApiError("EMPTY_FILE", 400, "The uploaded file is empty.");
  }

  const quality = qualityOverride !== undefined ? clampQuality(qualityOverride) : undefined;

  // Re-decode to validate that the bytes are actually a supported image.
  let image;
  try {
    const sharp = (await import("sharp")).default;
    image = sharp(input, { animated: false });
    const meta = await image.metadata();
    if (meta.format !== "jpeg" && meta.format !== "png") {
      throw new ApiError(
        "UNSUPPORTED_FORMAT",
        415,
        "Unsupported image. Only JPEG and PNG inputs are allowed.",
      );
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("INVALID_IMAGE", 400, "The file is not a valid or decodable image.");
  }

  if (stripMetadata) image = image.withMetadata({ orientation: undefined });

  let data: Buffer;
  let outputMime: string;
  let outputExt: string;

  if (mode === "webp") {
    const q = quality ?? PIPELINE.webp.quality;
    image = image.webp({
      quality: q,
      alphaQuality: PIPELINE.webp.alphaQuality,
      effort: 4,
    });
    outputMime = "image/webp";
    outputExt = "webp";
  } else {
    // compress — keep original format
    const meta = await image.metadata();
    if (meta.format === "png") {
      // Light lossy palette optimisation; keeps transparency when present.
      image = image.png({
        compressionLevel: PIPELINE.png.compressionLevel,
        palette: PIPELINE.png.palette,
        quality: quality ?? PIPELINE.png.quality,
      });
      outputMime = "image/png";
      outputExt = "png";
    } else {
      image = image.jpeg({
        quality: quality ?? PIPELINE.jpeg.quality,
        mozjpeg: PIPELINE.jpeg.mozjpeg,
        optimizeCoding: true,
      });
      outputMime = "image/jpeg";
      outputExt = "jpg";
    }
  }

  try {
    data = await image.toBuffer();
  } catch (err) {
    throw new ApiError("PROCESS_FAILED", 500, "Failed to process the image.", String(err));
  }

  const optimizedSize = data.length;
  const savedBytes = Math.max(0, originalSize - optimizedSize);
  const savedPercent =
    originalSize > 0 ? Math.round((savedBytes / originalSize) * 1000) / 10 : 0;

  return { data, outputMime, outputExt, originalSize, optimizedSize, savedBytes, savedPercent };
}

/** Validate that the declared MIME type is one we accept. */
export function assertAcceptedMime(mime: string | null): asserts mime is string {
  if (!mime || !(ACCEPTED_MIME as readonly string[]).includes(mime)) {
    throw new ApiError(
      "UNSUPPORTED_TYPE",
      415,
      "Unsupported MIME type. Send image/jpeg or image/png.",
    );
  }
}

/** Parse and validate an uploaded file from a Web FormData request. */
export async function extractUpload(
  formData: FormData,
  maxBytes: number,
): Promise<{ buffer: Buffer; mime: string; filename: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError("MISSING_FILE", 400, "No 'file' field found in the multipart body.");
  }

  assertAcceptedMime(file.type);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > maxBytes) {
    throw new ApiError(
      "FILE_TOO_LARGE",
      413,
      `File exceeds the maximum allowed size of ${maxBytes} bytes.`,
    );
  }

  return { buffer, mime: file.type, filename: file.name || "image" };
}
