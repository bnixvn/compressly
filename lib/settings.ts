import { promises as fs } from "fs";
import path from "path";

// Persisted site settings (advertisement banner + UI preferences).
// Stored in data/settings.json. Safe for single-instance MVP use.

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "settings.json");

const PUBLIC_DIR = path.join(process.cwd(), "public");
const BANNER_DIR = path.join(PUBLIC_DIR, "banner");
const LOGO_DIR = path.join(PUBLIC_DIR, "logo");
const FAVICON_DIR = path.join(PUBLIC_DIR, "favicon");

export interface SiteSettings {
  /** Public URL of the uploaded banner, or null when none. */
  bannerUrl: string | null;
  /** UI defaults (the web UI may override per-session in the browser). */
  defaultTheme: "light" | "dark";
  defaultLang: "en" | "vi";
  /** Runtime admin password override. When set, this beats ADMIN_PASSWORD env. */
  adminPassword?: string;
  /** Public URL of the uploaded site logo, or null to use the default mark. */
  logoUrl: string | null;
  /** Public URL of the uploaded favicon, or null to use the default favicon. */
  faviconUrl: string | null;
  /** Display name shown in the UI, document title, and metadata, per language. */
  siteName: { en: string; vi: string };
  /** SEO document title per language (overrides the generated title when set). */
  seoTitle: { en: string; vi: string };
  /** SEO meta description per language. */
  seoDescription: { en: string; vi: string };
  /** Footer HTML/text shown on public pages, per language. */
  footerContent: { en: string; vi: string };
}

export type LocalizedText = { en: string; vi: string };

const DEFAULTS: SiteSettings = {
  bannerUrl: null,
  defaultTheme: "dark",
  defaultLang: "en",
  logoUrl: null,
  faviconUrl: null,
  siteName: { en: "Compressly", vi: "" },
  seoTitle: { en: "", vi: "" },
  seoDescription: { en: "", vi: "" },
  footerContent: { en: "", vi: "" },
};

let cache: SiteSettings | null = null;

// Coerce legacy string values (from earlier versions) into localized objects.
function migrateLocalized(value: unknown): LocalizedText {
  if (value && typeof value === "object" && ("en" in value || "vi" in value)) {
    const v = value as Partial<LocalizedText>;
    return { en: String(v.en ?? ""), vi: String(v.vi ?? "") };
  }
  if (typeof value === "string") return { en: value, vi: "" };
  return { en: "", vi: "" };
}

export async function readSettings(): Promise<SiteSettings> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    const merged: SiteSettings = { ...DEFAULTS, ...parsed };
    merged.siteName = migrateLocalized(parsed.siteName);
    merged.seoTitle = migrateLocalized(parsed.seoTitle);
    merged.seoDescription = migrateLocalized(parsed.seoDescription);
    merged.footerContent = migrateLocalized(parsed.footerContent);
    cache = merged;
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export async function writeSettings(settings: SiteSettings): Promise<SiteSettings> {
  cache = settings;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(settings, null, 2), "utf8");
  return cache;
}

const ACCEPTED_BANNER = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

/** Persist an uploaded banner and return its public URL. */
export async function saveBanner(file: File): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error("No banner file provided.");
  }
  if (!(ACCEPTED_BANNER as readonly string[]).includes(file.type)) {
    throw new Error("Unsupported banner format. Use JPEG/PNG/WebP/GIF/SVG.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  await fs.mkdir(BANNER_DIR, { recursive: true });
  const filename = `banner.${ext}`;
  await fs.writeFile(path.join(BANNER_DIR, filename), buf);
  return `/banner/${filename}`;
}

export async function removeBanner(): Promise<void> {
  try {
    const files = await fs.readdir(BANNER_DIR);
    await Promise.all(files.map((f) => fs.unlink(path.join(BANNER_DIR, f))));
  } catch {
    // ignore missing dir
  }
}

const ACCEPTED_IMAGE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

/** Write an uploaded image into a public dir and return its URL. */
async function saveImage(file: File, dir: string, name: string): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error("No file provided.");
  }
  if (!(ACCEPTED_IMAGE as readonly string[]).includes(file.type)) {
    throw new Error("Unsupported image format. Use JPEG/PNG/WebP/GIF/SVG/ICO.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  await fs.mkdir(dir, { recursive: true });
  const filename = `${name}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buf);
  return `/${path.basename(dir)}/${filename}`;
}

/** Persist an uploaded logo and return its public URL. */
export async function saveLogo(file: File): Promise<string> {
  return saveImage(file, LOGO_DIR, "logo");
}

/** Persist an uploaded favicon and return its public URL. */
export async function saveFavicon(file: File): Promise<string> {
  return saveImage(file, FAVICON_DIR, "favicon");
}

async function clearDir(dir: string): Promise<void> {
  try {
    const files = await fs.readdir(dir);
    await Promise.all(files.map((f) => fs.unlink(path.join(dir, f))));
  } catch {
    // ignore missing dir
  }
}

export async function removeLogo(): Promise<void> {
  await clearDir(LOGO_DIR);
}

export async function removeFavicon(): Promise<void> {
  await clearDir(FAVICON_DIR);
}

/** Update only the non-null fields of the settings. */
export async function patchSettings(partial: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await readSettings();
  const next: SiteSettings = { ...current, ...partial };
  return writeSettings(next);
}
