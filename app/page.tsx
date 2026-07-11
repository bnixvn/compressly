"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUi } from "@/components/Providers";
import { downloadZip } from "@/lib/zip";
import type { Lang } from "@/lib/i18n";

type Mode = "compress" | "webp";

interface FileResult {
  filename: string;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: number;
  outputExt: string;
  dataUrl: string;
  downloadName: string;
}

const MAX_FILES = 20;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png"];

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export default function Home() {
  const { theme, lang, toggleTheme, setLang, t } = useUi();
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerLink, setBannerLink] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string>("Compressly");
  const [footerContent, setFooterContent] = useState<string>("");

  useEffect(() => {
    fetch(`/api/settings?lang=${lang}`)
      .then((r) => r.json())
      .then((d) => {
        setBannerUrl(d.bannerUrl ?? null);
        setBannerLink(d.bannerLink ?? null);
        setLogoUrl(d.logoUrl ?? null);
        setSiteName(d.siteName || "Compressly");
        setFooterContent(d.footerContent ?? "");
      })
      .catch(() => setBannerUrl(null));
  }, [lang]);

  return (
    <main className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/">
            {logoUrl ? (
              <img className="logo-img" src={logoUrl} alt={siteName} />
            ) : (
              <span className="logo-dot" />
            )}
            {!logoUrl && siteName}
          </a>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label={t("nav.theme")}>
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <select
              className="lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label={t("nav.lang")}
            >
              <option value="en">EN</option>
              <option value="vi">VI</option>
            </select>
          </div>
        </div>
      </header>

      <section className="hero">
        <h1>{siteName}</h1>
        <p className="hero-sub">{t("hero.subtitle")}</p>
      </section>

      <div className="sections">
        <ToolSection mode="compress" title={t("section.compress.title")} desc={t("section.compress.desc")} />
        <ToolSection mode="webp" title={t("section.webp.title")} desc={t("section.webp.desc")} />
      </div>

      {bannerUrl && (
        <section className="ad-slot">
          <div className="ad-label">{t("ad.title")}</div>
          <a href={bannerLink || bannerUrl} target="_blank" rel="noreferrer">
            <img src={bannerUrl} alt={t("ad.title")} />
          </a>
        </section>
      )}

      <footer className="footer">
        {footerContent ? (
          <span dangerouslySetInnerHTML={{ __html: footerContent }} />
        ) : (
          <span>{siteName}</span>
        )}
      </footer>
    </main>
  );
}

function ToolSection({ mode, title, desc }: { mode: Mode; title: string; desc: string }) {
  const { t } = useUi();
  const [drag, setDrag] = useState(false);
  const [quality, setQuality] = useState(80);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<FileResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      setError(null);
      const incoming = Array.from(list);
      const valid = incoming.filter((f) => ACCEPTED.includes(f.type));
      if (valid.length === 0) {
        setError(t("error.type"));
        return;
      }
      const oversized = valid.find((f) => f.size > MAX_BYTES);
      if (oversized) {
        setError(t("error.tooBig", { size: fmt(MAX_BYTES) }));
        return;
      }
      setFiles((prev) => {
        const next = [...prev, ...valid];
        if (next.length > MAX_FILES) {
          setError(t("error.tooMany", { max: MAX_FILES }));
          return next.slice(0, MAX_FILES);
        }
        return next;
      });
      setResults([]);
    },
    [t],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const run = async () => {
    if (files.length === 0) {
      setError(t("error.noFiles"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("mode", mode);
      fd.append("quality", String(quality));
      files.forEach((f) => fd.append("file", f));
      const res = await fetch("/api/web/process", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t("error.generic"));
      }
      const data = await res.json();
      setResults(
        data.files.map((f: any) => ({
          filename: f.filename,
          originalSize: f.originalSize,
          optimizedSize: f.optimizedSize,
          savedBytes: f.savedBytes,
          savedPercent: f.savedPercent,
          outputExt: f.outputExt,
          dataUrl: f.dataUrl,
          downloadName: f.filename.replace(/\.[^.]+$/, "") + "." + f.outputExt,
        })),
      );
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadAll = async () => {
    if (results.length === 0) return;
    const entries = results.map((r) => ({
      name: r.downloadName,
      data: dataUrlToBytes(r.dataUrl),
    }));
    await downloadZip(entries, mode === "webp" ? "compressly-webp.zip" : "compressly-compressed.zip");
  };

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalOptimized = results.reduce((s, r) => s + r.optimizedSize, 0);
  const totalSaved = totalOriginal - totalOptimized;
  const totalPct = totalOriginal > 0 ? (totalSaved / totalOriginal) * 100 : 0;

  return (
    <section className={`tool-card mode-${mode}`}>
      <div className="tool-head">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>

      <div
        className={`dropzone ${drag ? "drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <strong>{t("form.drop")}</strong>
        <span className="hint">
          {t("form.orClick", { max: MAX_FILES, size: fmt(MAX_BYTES) })}
        </span>
      </div>

      <div className="controls">
        <label className="quality">
          {t("form.quality")}: <b>{quality}</b>
          <input
            type="range"
            min={40}
            max={95}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="selected-row">
          <span>{t("form.selected", { n: files.length })}</span>
          <button className="btn ghost" onClick={clearAll}>
            {t("form.clear")}
          </button>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button className="btn primary" disabled={busy || files.length === 0} onClick={run}>
          {busy ? t("form.processing") : t("form.process", { n: files.length })}
        </button>
      </div>

      {results.length > 0 && (
        <div className="results">
          <div className="results-head">
            <h3>{t("result.title")}</h3>
            <button className="btn ghost" onClick={downloadAll}>
              ⤓ {t("result.downloadAll")}
            </button>
          </div>

          <div className="stats">
            <div>
              <span className="stat-label">{t("result.summary.original")}</span>
              <b>{fmt(totalOriginal)}</b>
            </div>
            <div>
              <span className="stat-label">{t("result.summary.optimized")}</span>
              <b>{fmt(totalOptimized)}</b>
            </div>
            <div>
              <span className="stat-label">{t("result.summary.saved")}</span>
              <b className="good">{fmt(totalSaved)}</b>
            </div>
            <div>
              <span className="stat-label">{t("result.summary.percent")}</span>
              <b className="good">−{totalPct.toFixed(1)}%</b>
            </div>
          </div>

          <ul className="result-list">
            {results.map((r, i) => (
              <li key={i} className="result-line">
                <span className="result-text">
                  {t("result.file", {
                    name: r.filename,
                    orig: fmt(r.originalSize),
                    size: fmt(r.optimizedSize),
                    pct: r.savedPercent.toFixed(1),
                  })}
                </span>
                <a className="download-link" href={r.dataUrl} download={r.downloadName}>
                  {t("result.downloadOne")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
