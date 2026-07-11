"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUi } from "@/components/Providers";
import type { Lang } from "@/lib/i18n";

interface KeyRecord {
  key: string;
  label: string;
  createdAt: string;
  quota: number;
  used: number;
  active: boolean;
}

const ADMIN_SESSION_KEY = "compressly-admin-password";
const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
const bustAsset = (url: string | null | undefined) =>
  url ? `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}` : null;
const cleanAssetUrl = (url: string | null) => url?.split("?")[0] ?? "";

export default function Admin() {
  const { theme, lang, toggleTheme, setLang, t } = useUi();
  const [adminPassword, setAdminPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [label, setLabel] = useState("");
  const [quotaInput, setQuotaInput] = useState(1000);

  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerLink, setBannerLink] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const [siteNameEn, setSiteNameEn] = useState("Compressly");
  const [siteNameVi, setSiteNameVi] = useState("");
  const [seoTitleEn, setSeoTitleEn] = useState("");
  const [seoTitleVi, setSeoTitleVi] = useState("");
  const [seoDescEn, setSeoDescEn] = useState("");
  const [seoDescVi, setSeoDescVi] = useState("");
  const [footerEn, setFooterEn] = useState("");
  const [footerVi, setFooterVi] = useState("");
  const [seoMsg, setSeoMsg] = useState<string | null>(null);
  const [seoSaving, setSeoSaving] = useState(false);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passBusy, setPassBusy] = useState(false);

  const adminHeaders = () => ({ Authorization: `Bearer ${adminPassword.trim()}` });

  const load = useCallback(async () => {
    if (!adminPassword) {
      setError(t("admin.login.password") + "?");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/keys", {
        headers: adminHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthed(false);
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        throw new Error(json.message || `Error ${res.status}`);
      }
      sessionStorage.setItem(ADMIN_SESSION_KEY, adminPassword.trim());
      setAuthed(true);
      setKeys(json.keys);

      const sres = await fetch("/api/admin/settings", {
        headers: adminHeaders(),
      });
      const s = await sres.json().catch(() => ({}));
      if (sres.ok) {
        setBannerUrl(s.bannerUrl ?? null);
        setBannerLink(s.bannerLink ?? "");
        setLogoUrl(s.logoUrl ?? null);
        setFaviconUrl(s.faviconUrl ?? null);
        setSiteNameEn(s.siteName?.en || "Compressly");
        setSiteNameVi(s.siteName?.vi || "");
        setSeoTitleEn(s.seoTitle?.en || "");
        setSeoTitleVi(s.seoTitle?.vi || "");
        setSeoDescEn(s.seoDescription?.en || "");
        setSeoDescVi(s.seoDescription?.vi || "");
        setFooterEn(s.footerContent?.en || "");
        setFooterVi(s.footerContent?.vi || "");
      }
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBusy(false);
    }
  }, [adminPassword, t]);

  useEffect(() => {
    if (authed) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (saved) {
      setAdminPassword(saved);
      setAuthed(true);
    }
  }, []);

  async function createKey() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: {
          ...adminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: label || "untitled", quota: quotaInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
      setLabel("");
      await load();
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function removeKey(k: string) {
    if (!confirm(`${t("admin.list.revoke")} ${k}?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/keys/${k}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function setQuota(k: string, newQuota: number) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/keys/${k}`, {
        method: "PATCH",
        headers: {
          ...adminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quota: newQuota }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(k: KeyRecord) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/keys/${k.key}`, {
        method: "PATCH",
        headers: {
          ...adminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !k.active }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function uploadBanner(file: File | null) {
    if (!file) return;
    setBannerUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/banner", { method: "POST", headers: adminHeaders(), body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("error.generic"));
      setBannerUrl(bustAsset(json.bannerUrl));
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBannerUploading(false);
      if (bannerRef.current) bannerRef.current.value = "";
    }
  }

  async function removeBanner() {
    setBannerUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/banner", { method: "DELETE", headers: adminHeaders() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("error.generic"));
      setBannerUrl(json.bannerUrl);
      setBannerLink("");
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBannerUploading(false);
    }
  }

  async function saveBannerLink() {
    setBannerUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          ...adminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bannerLink }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.message || t("error.generic"));
      setBannerLink(json.bannerLink ?? "");
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setBannerUploading(false);
    }
  }

  async function changePassword() {
    setPassMsg(null);
    if (newPass !== confirmPass) {
      setPassMsg(t("admin.pass.mismatch"));
      return;
    }
    if (newPass.length < 4) {
      setPassMsg(t("admin.pass.weak"));
      return;
    }
    setPassBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: {
          ...adminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ current: curPass, password: newPass }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPassMsg(json.error || t("error.generic"));
        return;
      }
      setPassMsg(t("admin.pass.ok"));
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      setAuthed(false);
    } catch (e: any) {
      setPassMsg(e.message || t("error.generic"));
    } finally {
      setPassBusy(false);
    }
  }

  async function uploadLogo(file: File | null) {
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/logo", { method: "POST", headers: adminHeaders(), body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("error.generic"));
      setLogoUrl(bustAsset(json.logoUrl));
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  }

  async function removeLogo() {
    setLogoUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/logo", { method: "DELETE", headers: adminHeaders() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("error.generic"));
      setLogoUrl(json.logoUrl);
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setLogoUploading(false);
    }
  }

  async function uploadFavicon(file: File | null) {
    if (!file) return;
    setFaviconUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/favicon", { method: "POST", headers: adminHeaders(), body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("error.generic"));
      setFaviconUrl(bustAsset(json.faviconUrl));
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setFaviconUploading(false);
      if (faviconRef.current) faviconRef.current.value = "";
    }
  }

  async function removeFavicon() {
    setFaviconUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/favicon", { method: "DELETE", headers: adminHeaders() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("error.generic"));
      setFaviconUrl(json.faviconUrl);
    } catch (e: any) {
      setError(e.message || t("error.generic"));
    } finally {
      setFaviconUploading(false);
    }
  }

  async function saveBrand() {
    setSeoSaving(true);
    setSeoMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          ...adminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bannerLink,
          siteName: { en: siteNameEn, vi: siteNameVi },
          seoTitle: { en: seoTitleEn, vi: seoTitleVi },
          seoDescription: { en: seoDescEn, vi: seoDescVi },
          footerContent: { en: footerEn, vi: footerVi },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.message || t("error.generic"));
      setSeoMsg(t("admin.brand.saved"));
    } catch (e: any) {
      setSeoMsg(e.message || t("error.generic"));
    } finally {
      setSeoSaving(false);
    }
  }

  if (!authed) {
    return (
      <main className="page">
        <header className="topbar">
          <div className="topbar-inner">
            <a className="brand" href="/"><span className="logo-dot" /> Compressly</a>
            <div className="topbar-actions">
              <button className="icon-btn" onClick={toggleTheme} aria-label={t("nav.theme")}>
                {theme === "dark" ? "🌙" : "☀️"}
              </button>
              <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                <option value="en">EN</option>
                <option value="vi">VI</option>
              </select>
            </div>
          </div>
        </header>
        <section className="admin-login">
          <h1>{t("admin.login.title")}</h1>
          <p>{t("admin.login.desc")}</p>
          <div className="field">
            <label>{t("admin.login.password")}</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder={t("admin.login.placeholder")}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <button className="btn primary" onClick={load} disabled={busy || !adminPassword}>
            {busy ? t("admin.login.checking") : t("admin.login.submit")}
          </button>
          {error && <div className="error">{error}</div>}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/"><span className="logo-dot" /> Compressly</a>
          <div className="topbar-actions">
            <a className="admin-link" href="/">► {t("admin.back")}</a>
            <button className="icon-btn" onClick={toggleTheme} aria-label={t("nav.theme")}>
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
              <option value="en">EN</option>
              <option value="vi">VI</option>
            </select>
          </div>
        </div>
      </header>

      <div className="admin-grid">
        <section className="card">
          <h3>{t("admin.create.title")}</h3>
          <div className="field">
            <label>{t("admin.create.label")}</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("admin.create.labelPh")} />
          </div>
          <div className="field">
            <label>{t("admin.create.quota")}</label>
            <input type="number" min={1} value={quotaInput} onChange={(e) => setQuotaInput(Number(e.target.value))} />
          </div>
          <button className="btn primary" onClick={createKey} disabled={busy}>
            {busy ? t("admin.create.creating") : t("admin.create.submit")}
          </button>
        </section>

        <section className="card">
          <div className="filelist-head">
            <h3>{t("admin.list.title")} ({keys.length})</h3>
            <button className="link-btn" onClick={load} disabled={busy}>{t("admin.list.refresh")}</button>
          </div>
          {keys.length === 0 ? (
            <p className="muted">{t("admin.list.empty")}</p>
          ) : (
            <table className="keytable">
              <thead>
                <tr>
                  <th>{t("admin.list.colKey")}</th>
                  <th>{t("admin.list.colNote")}</th>
                  <th>{t("admin.list.colUsage")}</th>
                  <th>{t("admin.list.colStatus")}</th>
                  <th>{t("admin.list.colCreated")}</th>
                  <th>{t("admin.list.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.key}>
                    <td className="mono">{k.key}</td>
                    <td>{k.label}</td>
                    <td>
                      {k.used} / {k.quota}
                      <div className="quota-row">
                        <input type="number" min={k.used} defaultValue={k.quota} onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== k.quota) setQuota(k.key, v); }} style={{ width: 90 }} />
                        <button className="link-btn" onClick={() => { const el = (document.activeElement as HTMLInputElement)?.value; setQuota(k.key, Number(el) || k.quota); }}>{t("admin.list.editQuota")}</button>
                      </div>
                    </td>
                    <td>
                      <span className={k.active ? "tag on" : "tag off"}>{k.active ? t("admin.list.active") : t("admin.list.locked")}</span>
                      <button className="link-btn" onClick={() => toggleActive(k)}>{k.active ? t("admin.list.lock") : t("admin.list.unlock")}</button>
                    </td>
                    <td className="muted">{fmtDate(k.createdAt)}</td>
                    <td>
                      <button className="link-btn danger" onClick={() => removeKey(k.key)}>{t("admin.list.revoke")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h3>{t("admin.banner.title")}</h3>
          <p className="muted">{t("admin.banner.desc")}</p>
          {bannerUrl && (
            <div className="banner-preview">
              <img src={bannerUrl} alt="banner" />
              <div className="banner-url">{t("admin.banner.url")}: {cleanAssetUrl(bannerUrl)}</div>
            </div>
          )}
          <div className="field">
            <label>{t("admin.banner.link")}</label>
            <input
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
              placeholder={t("admin.banner.linkPh")}
            />
          </div>
          <div className="field-row">
            <input ref={bannerRef} type="file" accept="image/*" hidden onChange={(e) => uploadBanner(e.target.files?.[0] ?? null)} />
            <button className="btn" onClick={() => bannerRef.current?.click()} disabled={bannerUploading}>
              {bannerUploading ? t("admin.banner.uploading") : t("admin.banner.upload")}
            </button>
            <button className="btn" onClick={saveBannerLink} disabled={bannerUploading}>
              {t("admin.banner.saveLink")}
            </button>
            {bannerUrl && (
              <button className="btn ghost" onClick={removeBanner} disabled={bannerUploading}>
                {t("admin.banner.remove")}
              </button>
            )}
          </div>
        </section>

        <section className="card">
          <h3>{t("admin.brand.title")}</h3>
          <p className="muted">{t("admin.brand.desc")}</p>

          <div className="field-row">
            <div className="brand-preview">
              {logoUrl ? <img src={logoUrl} alt="logo" /> : <span className="logo-dot" />}
              <span className="brand-preview-label">{t("admin.brand.logo")}</span>
            </div>
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => uploadLogo(e.target.files?.[0] ?? null)} />
            <button className="btn" onClick={() => logoRef.current?.click()} disabled={logoUploading}>
              {logoUploading ? t("admin.brand.uploading") : t("admin.brand.uploadLogo")}
            </button>
            {logoUrl && (
              <button className="btn ghost" onClick={removeLogo} disabled={logoUploading}>
                {t("admin.brand.removeLogo")}
              </button>
            )}
          </div>

          <div className="field-row">
            <div className="brand-preview">
              {faviconUrl ? <img src={faviconUrl} alt="favicon" /> : <span className="logo-dot" />}
              <span className="brand-preview-label">{t("admin.brand.favicon")}</span>
            </div>
            <input ref={faviconRef} type="file" accept="image/*,.ico" hidden onChange={(e) => uploadFavicon(e.target.files?.[0] ?? null)} />
            <button className="btn" onClick={() => faviconRef.current?.click()} disabled={faviconUploading}>
              {faviconUploading ? t("admin.brand.uploading") : t("admin.brand.uploadFavicon")}
            </button>
            {faviconUrl && (
              <button className="btn ghost" onClick={removeFavicon} disabled={faviconUploading}>
                {t("admin.brand.removeFavicon")}
              </button>
            )}
          </div>

          <div className="field">
            <label>{t("admin.brand.siteName")} — EN</label>
            <input value={siteNameEn} onChange={(e) => setSiteNameEn(e.target.value)} placeholder={t("admin.brand.siteNamePh")} />
          </div>
          <div className="field">
            <label>{t("admin.brand.siteName")} — VI</label>
            <input value={siteNameVi} onChange={(e) => setSiteNameVi(e.target.value)} placeholder={t("admin.brand.siteNamePh")} />
          </div>
          <div className="field">
            <label>{t("admin.brand.seoTitle")} — EN</label>
            <input value={seoTitleEn} onChange={(e) => setSeoTitleEn(e.target.value)} placeholder={t("admin.brand.seoTitlePh")} />
          </div>
          <div className="field">
            <label>{t("admin.brand.seoTitle")} — VI</label>
            <input value={seoTitleVi} onChange={(e) => setSeoTitleVi(e.target.value)} placeholder={t("admin.brand.seoTitlePh")} />
          </div>
          <div className="field">
            <label>{t("admin.brand.seoDesc")} — EN</label>
            <textarea value={seoDescEn} onChange={(e) => setSeoDescEn(e.target.value)} rows={2} placeholder={t("admin.brand.seoDescPh")} />
          </div>
          <div className="field">
            <label>{t("admin.brand.seoDesc")} — VI</label>
            <textarea value={seoDescVi} onChange={(e) => setSeoDescVi(e.target.value)} rows={2} placeholder={t("admin.brand.seoDescPh")} />
          </div>
          <div className="field">
            <label>{t("admin.brand.footer")} — EN</label>
            <textarea value={footerEn} onChange={(e) => setFooterEn(e.target.value)} rows={2} placeholder={t("admin.brand.footerPh")} />
          </div>
          <div className="field">
            <label>{t("admin.brand.footer")} — VI</label>
            <textarea value={footerVi} onChange={(e) => setFooterVi(e.target.value)} rows={2} placeholder={t("admin.brand.footerPh")} />
          </div>
          <button className="btn primary" onClick={saveBrand} disabled={seoSaving}>
            {seoSaving ? t("admin.brand.saving") : t("admin.brand.save")}
          </button>
          {seoMsg && <div className={seoMsg === t("admin.brand.saved") ? "success" : "error"}>{seoMsg}</div>}
        </section>

        <section className="card">
          <h3>{t("admin.pass.title")}</h3>
          <div className="field">
            <label>{t("admin.pass.current")}</label>
            <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} />
          </div>
          <div className="field">
            <label>{t("admin.pass.new")}</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          </div>
          <div className="field">
            <label>{t("admin.pass.confirm")}</label>
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
          </div>
          <button className="btn primary" onClick={changePassword} disabled={passBusy}>
            {passBusy ? t("admin.pass.updating") : t("admin.pass.submit")}
          </button>
          {passMsg && <div className={passMsg === t("admin.pass.ok") ? "success" : "error"}>{passMsg}</div>}
        </section>
      </div>

      {error && <div className="error sticky">{error}</div>}
    </main>
  );
}
