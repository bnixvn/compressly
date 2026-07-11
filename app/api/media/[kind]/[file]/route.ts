import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ALLOWED_KINDS = new Set(["banner", "logo", "favicon"]);
const MIME_BY_EXT: Record<string, string> = {
  gif: "image/gif",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml; charset=utf-8",
  webp: "image/webp",
};

function safeFileName(file: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(file)) return null;
  if (file.includes("..")) return null;
  return file;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; file: string }> },
) {
  const { kind, file } = await params;
  const filename = safeFileName(file);
  if (!ALLOWED_KINDS.has(kind) || !filename) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(filename).slice(1).toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const baseDir = path.resolve(PUBLIC_DIR, kind);
  const filePath = path.resolve(baseDir, filename);
  if (!filePath.startsWith(`${baseDir}${path.sep}`)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const body = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength,
    ) as ArrayBuffer;
    return new NextResponse(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Length": String(fileBuffer.byteLength),
        "Content-Type": contentType,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
