import { config } from "./config";
import { consumeApiKey, ApiKeyError } from "./keystore";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(code: string, status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Validate the bearer token for the public /v1 API and enforce the per-key
 * successful-request quota. Throws ApiError(401/429) on failure.
 */
export async function requireApiKey(authHeader: string | null): Promise<void> {
  try {
    await consumeApiKey(authHeader);
  } catch (err) {
    if (err instanceof ApiKeyError) {
      throw new ApiError(err.code, err.status, err.message);
    }
    throw err;
  }
}

/**
 * The public SaaS web UI does not require an API key. This helper exists so
 * the route is explicit about skipping auth for browser uploads.
 */
export function requireWebAccess(): void {
  // No auth for the public web UI.
}

/**
 * Protect admin endpoints with a shared secret from ADMIN_PASSWORD.
 * The client sends it as a Bearer token. A runtime change (settings.json)
 * takes precedence over the environment variable when present.
 */
export async function requireAdmin(authHeader: string | null): Promise<void> {
  let secret = (process.env.ADMIN_PASSWORD ?? "").replace(/^["']|["']$/g, "");
  try {
    const { readSettings } = await import("./settings");
    const s = await readSettings();
    if (s.adminPassword) secret = s.adminPassword;
  } catch {
    // ignore — fall back to env
  }
  if (!secret) {
    throw new ApiError(
      "ADMIN_NOT_CONFIGURED",
      500,
      "ADMIN_PASSWORD is not set on the server. Admin access disabled.",
    );
  }
  const token = parseBearer(authHeader);
  if (!token || token !== secret) {
    throw new ApiError("ADMIN_UNAUTHORIZED", 401, "Invalid admin password.");
  }
}

function parseBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1].trim() : null;
}
