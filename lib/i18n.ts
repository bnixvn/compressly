// Lightweight client-side i18n. English is the default; Vietnamese is provided.
export type Lang = "en" | "vi";

export const LANGS: Lang[] = ["en", "vi"];

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "Compressly",
  "app.tagline": "Image compression & WebP conversion",
  "nav.admin": "Admin",
  "nav.home": "Home",
  "nav.theme": "Theme",
  "nav.lang": "Language",

  "hero.subtitle":
    "Compress JPEG/PNG while keeping high quality, or convert to WebP.",

  "section.compress.title": "Compress images",
  "section.compress.desc": "Shrink JPEG/PNG files while keeping the original format.",
  "section.webp.title": "Convert to WebP",
  "section.webp.desc": "Transcode JPEG/PNG to the modern WebP format for smaller files.",

  "form.quality": "Quality",
  "form.choose": "Choose images",
  "form.drop": "Drag & drop images here",
  "form.orClick": "or click to select — JPEG / PNG, up to {max} files, each ≤ {size}",
  "form.selected": "{n} file(s) selected",
  "form.clear": "Clear all",
  "form.process": "Process {n} file(s)",
  "form.processing": "Processing…",

  "result.title": "Results",
  "result.summary.original": "Original",
  "result.summary.optimized": "Optimized",
  "result.summary.saved": "Saved",
  "result.summary.percent": "Reduction",
  "result.file": "{name} — {orig} → {size} (−{pct}%)",
  "result.downloadOne": "Download",
  "result.downloadAll": "Download all (.zip)",
  "result.empty": "No results yet.",

  "error.tooMany": "You can select at most {max} files.",
  "error.tooBig": "Each file must be at most {size}.",
  "error.type": "Only JPEG and PNG are supported.",
  "error.generic": "Something went wrong.",
  "error.noFiles": "Please select at least one image.",

  "ad.title": "Sponsored",

  "admin.login.title": "Compressly Admin",
  "admin.login.desc": "Issue and manage API keys. Each key has a successful-request quota.",
  "admin.login.password": "Admin password",
  "admin.login.placeholder": "Enter admin password",
  "admin.login.submit": "Sign in",
  "admin.login.checking": "Checking…",
  "admin.back": "Back to compressor",

  "admin.create.title": "Issue new key",
  "admin.create.label": "Name / note",
  "admin.create.labelPh": "e.g. client-site-a",
  "admin.create.quota": "Successful-request limit",
  "admin.create.submit": "Create API key",
  "admin.create.creating": "Creating…",

  "admin.list.title": "Issued keys",
  "admin.list.refresh": "Refresh",
  "admin.list.empty": "No keys issued yet.",
  "admin.list.colKey": "Key",
  "admin.list.colNote": "Note",
  "admin.list.colUsage": "Used / Quota",
  "admin.list.colStatus": "Status",
  "admin.list.colCreated": "Created",
  "admin.list.colActions": "Actions",
  "admin.list.active": "Active",
  "admin.list.locked": "Locked",
  "admin.list.lock": "Lock",
  "admin.list.unlock": "Unlock",
  "admin.list.revoke": "Revoke",
  "admin.list.editQuota": "Save quota",

  "admin.banner.title": "Advertisement banner",
  "admin.banner.desc": "Shown at the bottom of the compressor page.",
  "admin.banner.upload": "Upload image",
  "admin.banner.url": "Banner URL",
  "admin.banner.link": "Click-through link",
  "admin.banner.linkPh": "https://example.com/landing-page",
  "admin.banner.saveLink": "Save link",
  "admin.banner.remove": "Remove banner",
  "admin.banner.uploading": "Uploading…",

  "admin.brand.title": "Brand & SEO",
  "admin.brand.desc": "Logo, favicon, site name, SEO tags and footer text.",
  "admin.brand.logo": "Logo",
  "admin.brand.favicon": "Favicon",
  "admin.brand.uploadLogo": "Upload logo",
  "admin.brand.uploadFavicon": "Upload favicon",
  "admin.brand.removeLogo": "Remove logo",
  "admin.brand.removeFavicon": "Remove favicon",
  "admin.brand.uploading": "Uploading…",
  "admin.brand.siteName": "Site name",
  "admin.brand.siteNamePh": "Compressly",
  "admin.brand.seoTitle": "SEO title",
  "admin.brand.seoTitlePh": "Leave blank to use the site name",
  "admin.brand.seoDesc": "SEO description",
  "admin.brand.seoDescPh": "Short description for search engines and social sharing",
  "admin.brand.footer": "Footer content",
  "admin.brand.footerPh": "HTML allowed, e.g. © 2026 Your Company",
  "admin.brand.save": "Save changes",
  "admin.brand.saving": "Saving…",
  "admin.brand.saved": "Brand settings saved.",

  "admin.pass.title": "Change admin password",
  "admin.pass.current": "Current password",
  "admin.pass.new": "New password",
  "admin.pass.confirm": "Confirm new password",
  "admin.pass.submit": "Update password",
  "admin.pass.updating": "Updating…",
  "admin.pass.mismatch": "New passwords do not match.",
  "admin.pass.wrong": "Current password is incorrect.",
  "admin.pass.weak": "New password must be at least 4 characters.",
  "admin.pass.ok": "Password updated.",
};

const vi: Dict = {
  "app.name": "Compressly",
  "app.tagline": "Nén ảnh & chuyển đổi WebP",
  "nav.admin": "Quản trị",
  "nav.home": "Trang chủ",
  "nav.theme": "Giao diện",
  "nav.lang": "Ngôn ngữ",

  "hero.subtitle":
    "Nén JPEG/PNG giữ chất lượng cao, hoặc chuyển sang WebP.",

  "section.compress.title": "Nén ảnh",
  "section.compress.desc": "Giảm dung lượng JPEG/PNG nhưng giữ nguyên định dạng gốc.",
  "section.webp.title": "Chuyển sang WebP",
  "section.webp.desc": "Chuyển đổi JPEG/PNG sang định dạng WebP hiện đại để file nhỏ hơn.",

  "form.quality": "Chất lượng",
  "form.choose": "Chọn ảnh",
  "form.drop": "Kéo-thả ảnh vào đây",
  "form.orClick": "hoặc nhấp để chọn — JPEG / PNG, tối đa {max} file, mỗi file ≤ {size}",
  "form.selected": "Đã chọn {n} file",
  "form.clear": "Xóa hết",
  "form.process": "Xử lý {n} file",
  "form.processing": "Đang xử lý…",

  "result.title": "Kết quả",
  "result.summary.original": "Tổng gốc",
  "result.summary.optimized": "Tổng mới",
  "result.summary.saved": "Đã tiết kiệm",
  "result.summary.percent": "Giảm",
  "result.file": "{name} — {orig} → {size} (−{pct}%)",
  "result.downloadOne": "Tải về",
  "result.downloadAll": "Tải tất cả (.zip)",
  "result.empty": "Chưa có kết quả.",

  "error.tooMany": "Chỉ được chọn tối đa {max} file.",
  "error.tooBig": "Mỗi file tối đa {size}.",
  "error.type": "Chỉ hỗ trợ JPEG và PNG.",
  "error.generic": "Đã xảy ra lỗi.",
  "error.noFiles": "Vui lòng chọn ít nhất một ảnh.",

  "ad.title": "Quảng cáo",

  "admin.login.title": "Compressly Admin",
  "admin.login.desc": "Cấp và quản lý API key. Mỗi key có giới hạn số request thành công.",
  "admin.login.password": "Mật khẩu admin",
  "admin.login.placeholder": "Nhập mật khẩu admin",
  "admin.login.submit": "Đăng nhập",
  "admin.login.checking": "Đang kiểm tra…",
  "admin.back": "Về trang nén ảnh",

  "admin.create.title": "Cấp key mới",
  "admin.create.label": "Tên / ghi chú",
  "admin.create.labelPh": "ví dụ: site-client-a",
  "admin.create.quota": "Giới hạn request thành công",
  "admin.create.submit": "Tạo API key",
  "admin.create.creating": "Đang tạo…",

  "admin.list.title": "Danh sách key",
  "admin.list.refresh": "Làm mới",
  "admin.list.empty": "Chưa có key nào.",
  "admin.list.colKey": "Key",
  "admin.list.colNote": "Ghi chú",
  "admin.list.colUsage": "Đã dùng / Quota",
  "admin.list.colStatus": "Trạng thái",
  "admin.list.colCreated": "Ngày tạo",
  "admin.list.colActions": "Thao tác",
  "admin.list.active": "Hoạt động",
  "admin.list.locked": "Khoá",
  "admin.list.lock": "Khoá",
  "admin.list.unlock": "Mở",
  "admin.list.revoke": "Thu hồi",
  "admin.list.editQuota": "Lưu quota",

  "admin.banner.title": "Ảnh quảng cáo",
  "admin.banner.desc": "Hiển thị cuối trang nén ảnh.",
  "admin.banner.upload": "Tải ảnh lên",
  "admin.banner.url": "URL ảnh quảng cáo",
  "admin.banner.link": "Link khi bấm ảnh",
  "admin.banner.linkPh": "https://example.com/trang-dich",
  "admin.banner.saveLink": "Lưu link",
  "admin.banner.remove": "Xoá ảnh",
  "admin.banner.uploading": "Đang tải lên…",

  "admin.brand.title": "Thương hiệu & SEO",
  "admin.brand.desc": "Logo, favicon, tên site, thẻ SEO và nội dung chân trang.",
  "admin.brand.logo": "Logo",
  "admin.brand.favicon": "Favicon",
  "admin.brand.uploadLogo": "Tải logo lên",
  "admin.brand.uploadFavicon": "Tải favicon lên",
  "admin.brand.removeLogo": "Xoá logo",
  "admin.brand.removeFavicon": "Xoá favicon",
  "admin.brand.uploading": "Đang tải lên…",
  "admin.brand.siteName": "Tên site",
  "admin.brand.siteNamePh": "Compressly",
  "admin.brand.seoTitle": "Tiêu đề SEO",
  "admin.brand.seoTitlePh": "Để trống để dùng tên site",
  "admin.brand.seoDesc": "Mô tả SEO",
  "admin.brand.seoDescPh": "Mô tả ngắn cho công cụ tìm kiếm và mạng xã hội",
  "admin.brand.footer": "Nội dung chân trang",
  "admin.brand.footerPh": "Hỗ trợ HTML, ví dụ © 2026 Công ty của bạn",
  "admin.brand.save": "Lưu thay đổi",
  "admin.brand.saving": "Đang lưu…",
  "admin.brand.saved": "Đã lưu cài đặt thương hiệu.",

  "admin.pass.title": "Đổi mật khẩu admin",
  "admin.pass.current": "Mật khẩu hiện tại",
  "admin.pass.new": "Mật khẩu mới",
  "admin.pass.confirm": "Xác nhận mật khẩu mới",
  "admin.pass.submit": "Cập nhật",
  "admin.pass.updating": "Đang cập nhật…",
  "admin.pass.mismatch": "Mật khẩu mới không khớp.",
  "admin.pass.wrong": "Mật khẩu hiện tại không đúng.",
  "admin.pass.weak": "Mật khẩu mới phải ít nhất 4 ký tự.",
  "admin.pass.ok": "Đã cập nhật mật khẩu.",
};

const dicts: Record<Lang, Dict> = { en, vi };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let str = dicts[lang][key] ?? dicts.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
