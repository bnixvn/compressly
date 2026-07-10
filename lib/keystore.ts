import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * File-backed API key store. Used by the admin page to issue keys and by the
 * public /v1 API to enforce a per-key successful-request quota.
 *
 * Records are kept in data/apikeys.json:
 *   { keys: { [key]: { label, createdAt, quota, used, active } } }
 *
 * Note: this is a simple single-process store suitable for an MVP / single
 * instance. For multi-instance deployments use a real database.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "apikeys.json");

/** Seed keys from the API_KEYS env var the first time the store is created. */
function seedFromEnv(): Record<string, ApiKeyRecord> {
  const seeded: Record<string, ApiKeyRecord> = {};
  const envKeys = (process.env.API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const quota = Number(process.env.DEFAULT_QUOTA ?? 1000);
  for (const key of envKeys) {
    seeded[key] = {
      label: "seeded-from-env",
      createdAt: new Date().toISOString(),
      quota: Number.isFinite(quota) && quota > 0 ? quota : 1000,
      used: 0,
      active: true,
    };
  }
  return seeded;
}


export interface ApiKeyRecord {
  label: string;
  createdAt: string;
  /** Max number of successful requests allowed. */
  quota: number;
  /** Successful requests already consumed. */
  used: number;
  active: boolean;
}

type StoreShape = { keys: Record<string, ApiKeyRecord> };

let cache: StoreShape | null = null;

async function readStore(): Promise<StoreShape> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    cache = JSON.parse(raw) as StoreShape;
    if (!cache.keys) cache.keys = {};
  } catch {
    // First run: seed from API_KEYS env, then persist.
    cache = { keys: seedFromEnv() };
    if (Object.keys(cache.keys).length) {
      await writeStore(cache);
    }
  }
  return cache;
}

async function writeStore(store: StoreShape): Promise<void> {
  cache = store;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function generateKey(): string {
  return "sk_" + crypto.randomBytes(12).toString("hex");
}

export async function createApiKey(label: string, quota: number): Promise<{ key: string; record: ApiKeyRecord }> {
  const store = await readStore();
  const key = generateKey();
  const record: ApiKeyRecord = {
    label: label || "untitled",
    createdAt: new Date().toISOString(),
    quota: Math.max(1, Math.floor(quota)),
    used: 0,
    active: true,
  };
  store.keys[key] = record;
  await writeStore(store);
  return { key, record };
}

export async function listApiKeys(): Promise<Array<{ key: string } & ApiKeyRecord>> {
  const store = await readStore();
  return Object.entries(store.keys).map(([key, record]) => ({ key, ...record }));
}

export async function getApiKey(key: string): Promise<ApiKeyRecord | null> {
  const store = await readStore();
  return store.keys[key] ?? null;
}

export async function deleteApiKey(key: string): Promise<boolean> {
  const store = await readStore();
  if (!(key in store.keys)) return false;
  delete store.keys[key];
  await writeStore(store);
  return true;
}

export async function setApiKeyQuota(key: string, quota: number): Promise<boolean> {
  const store = await readStore();
  const rec = store.keys[key];
  if (!rec) return false;
  rec.quota = Math.max(rec.used, Math.floor(quota));
  await writeStore(store);
  return true;
}

export async function setApiKeyActive(key: string, active: boolean): Promise<boolean> {
  const store = await readStore();
  const rec = store.keys[key];
  if (!rec) return false;
  rec.active = !!active;
  await writeStore(store);
  return true;
}

/**
 * Validate a key for the public API. Throws ApiError on failure.
 * On success, increments the successful-request counter (quota enforcement).
 */
export class ApiKeyError extends Error {
  status: number;
  code: string;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "ApiKeyError";
    this.code = code;
    this.status = status;
  }
}

export async function consumeApiKey(authHeader: string | null): Promise<ApiKeyRecord> {
  const token = parseBearer(authHeader);
  if (!token) {
    throw new ApiKeyError(
      "INVALID_API_KEY",
      401,
      "Missing or invalid API key. Send 'Authorization: Bearer <api_key>'.",
    );
  }
  const rec = await getApiKey(token);
  if (!rec || !rec.active) {
    throw new ApiKeyError("INVALID_API_KEY", 401, "API key is invalid or disabled.");
  }
  if (rec.used >= rec.quota) {
    throw new ApiKeyError(
      "QUOTA_EXCEEDED",
      429,
      `API key quota exhausted (${rec.used}/${rec.quota} successful requests).`,
    );
  }
  rec.used += 1;
  const store = await readStore();
  store.keys[token] = rec;
  await writeStore(store);
  return rec;
}

function parseBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1].trim() : null;
}
