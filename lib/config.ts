// Centralised runtime configuration, sourced from environment variables.
// See .env.example for the full list of configurable values.

const env = process.env;

/** Comma-separated API keys allowed to call the public /v1 API. */
const API_KEYS = (env.API_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

/** Maximum accepted upload size for the public /v1 API, in bytes. Default 10 MB. */
const MAX_FILE_SIZE = Number(env.MAX_FILE_SIZE ?? 10 * 1024 * 1024);

/** Limits for the public SaaS web UI (no API key required). */
const WEB_MAX_FILES = Number(env.WEB_MAX_FILES ?? 20);
const WEB_MAX_FILE_SIZE = Number(env.WEB_MAX_FILE_SIZE ?? 5 * 1024 * 1024);

/** Default quality for lossy codecs (jpeg / webp) when not overridden. */
const DEFAULT_QUALITY = Number(env.DEFAULT_QUALITY ?? 80);

export const config = {
  apiKeys: API_KEYS,
  maxFileSize: Number.isFinite(MAX_FILE_SIZE) && MAX_FILE_SIZE > 0 ? MAX_FILE_SIZE : 10 * 1024 * 1024,
  web: {
    maxFiles: Number.isFinite(WEB_MAX_FILES) && WEB_MAX_FILES > 0 ? WEB_MAX_FILES : 20,
    maxFileSize:
      Number.isFinite(WEB_MAX_FILE_SIZE) && WEB_MAX_FILE_SIZE > 0 ? WEB_MAX_FILE_SIZE : 5 * 1024 * 1024,
  },
  defaultQuality:
    Number.isFinite(DEFAULT_QUALITY) && DEFAULT_QUALITY >= 1 && DEFAULT_QUALITY <= 100
      ? DEFAULT_QUALITY
      : 80,
};

/** MIME types we accept for processing. */
export const ACCEPTED_MIME = ["image/jpeg", "image/png"] as const;
export type AcceptedMime = (typeof ACCEPTED_MIME)[number];

/** Allowed output modes for the unified /optimize endpoint. */
export const OPTIMIZE_MODES = ["compress", "webp"] as const;
export type OptimizeMode = (typeof OPTIMIZE_MODES)[number];

/** Per-codec defaults used by the image pipeline. */
export const PIPELINE = {
  jpeg: { quality: config.defaultQuality, mozjpeg: true },
  webp: { quality: config.defaultQuality, alphaQuality: 90 },
  png: { compressionLevel: 9, palette: true, quality: config.defaultQuality },
} as const;
