# Hướng dẫn cài đặt BNIX COMPRESS IMAGES lên VPS

> **Áp dụng:** Ubuntu 24.04 LTS · Debian 12 (Bookworm) · Debian 13 (Trixie)
> **Stack:** Next.js 15 (App Router) · React 19 · Sharp/libvips · Node.js v24

Ứng dụng là một **single-process Node.js** phục vụ cả giao diện web lẫn REST API.
Không cần database — dữ liệu API key và cấu hình lưu dưới dạng file JSON trong thư mục `data/`.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt Node.js v24](#2-cài-đặt-nodejs-v24)
3. [Clone & build dự án](#3-clone--build-dự-án)
4. [Cấu hình biến môi trường](#4-cấu-hình-biến-môi-trường)
5. [Chạy thử (dev mode)](#5-chạy-thử-dev-mode)
6. [Chạy production với PM2](#6-chạy-production-với-pm2)
7. [Nginx reverse proxy](#7-nginx-reverse-proxy)
8. [Cài đặt HTTPS (Let's Encrypt)](#8-cài-đặt-https-lets-encrypt)
9. [Sử dụng trang Admin](#9-sử-dụng-trang-admin)
10. [Tùy chỉnh giao diện & SEO](#10-tùy-chỉnh-giao-diện--seo)
11. [Cập nhật ứng dụng](#11-cập-nhật-ứng-dụng)
12. [Khắc phục sự cố](#12-khắc-phục-sự-cố)
13. [Lệnh nhanh (copy-paste)](#13-lệnh-nhanh-copy-paste)

---

## 1. Yêu cầu hệ thống

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị |
|------------|-------------------|-------------|
| OS | Ubuntu 24.04 / Debian 12 / Debian 13 (amd64) | — |
| CPU | 1 core | 2 cores trở lên |
| RAM | 1 GB | 2 GB (cần ~1 GB trống khi build) |
| Disk | 1 GB trống | 2 GB |
| Node.js | v24.x | v24 LTS |
| npm | 11.x | đi kèm Node 24 |

> **Lưu ý về `sharp`:** Đây là native module dựa trên libvips. Quá trình `npm install`
> sẽ tự biên dịch trên VPS. Cần cài sẵn `build-essential` và `libvips-dev`.

---

## 2. Cài đặt Node.js v24

### Ubuntu 24.04

```bash
# Cập nhật hệ thống & cài công cụ cơ bản
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl git build-essential ca-certificates libvips-dev

# Thêm repo NodeSource cho Node 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt -y install nodejs

# Kiểm tra
node -v   # v24.x.x
npm -v    # 11.x.x
```

### Debian 12 / Debian 13

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl git build-essential ca-certificates libvips-dev

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt -y install nodejs

node -v
npm -v
```

> **Thay thế:** Nếu muốn quản lý nhiều phiên bản Node, dùng [nvm](https://github.com/nvm-sh/nvm):
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
> source ~/.bashrc
> nvm install 24
> nvm use 24
> ```

---

## 3. Clone & build dự án

```bash
# Clone repo
cd /var/www
sudo git clone https://github.com/bnixvn/compressly.git compressly
sudo chown -R $USER:$USER compressly
cd compressly

# Cài dependencies
npm install

# Build production
npm run build
```

> **Lỗi thiếu libvips?** Chạy lại: `sudo apt -y install libvips-dev && npm rebuild sharp`

Sau khi build thành công, thư mục `.next/` sẽ chứa bản build production.

---

## 4. Cấu hình biến môi trường

```bash
cp .env.example .env
nano .env   # hoặc dùng editor bất kỳ
```

### Bắt buộc thay đổi

| Biến | Giá trị mẫu | Giải thích |
|------|-------------|------------|
| `ADMIN_PASSWORD` | `change-me-admin-secret` | **Phải đổi** thành mật khẩu mạnh. Dùng để đăng nhập trang `/admin` và gọi API admin. |

### Tùy chọn

| Biến | Mặc định | Giải thích |
|------|----------|------------|
| `API_KEYS` | *(trống)* | Danh sách key seed (phân cách bằng `,`). Nếu để trống, tạo key qua trang `/admin`. |
| `DEFAULT_QUOTA` | `1000` | Số request tối đa mỗi API key (0 = không giới hạn). |
| `WEB_MAX_FILES` | `20` | Số file tối đa mỗi lần upload trên giao diện web. |
| `WEB_MAX_FILE_SIZE` | `5242880` (5 MB) | Giới hạn kích thước mỗi file trên giao diện web (byte). |
| `MAX_FILE_SIZE` | `10485760` (10 MB) | Giới hạn kích thước mỗi file cho REST API v1 (byte). |
| `DEFAULT_QUALITY` | `80` | Chất lượng mặc định (1–100) khi client không truyền `quality`. |

> 🔒 File `.env` đã nằm trong `.gitignore` — không bị commit lên Git.

---

## 5. Chạy thử (dev mode)

```bash
npm run dev
```

Truy cập `http://<IP_VPS>:3000` để kiểm tra giao diện.
Truy cập `http://<IP_VPS>:3000/admin` để vào trang quản trị.

Dừng lại bằng `Ctrl+C` khi đã kiểm tra xong.

---

## 6. Chạy production với PM2

PM2 giữ ứng dụng chạy nền, tự khởi động lại khi crash, và tự chạy khi VPS reboot.

### Cài PM2

```bash
sudo npm install -g pm2
```

### Khởi chạy

```bash
cd /var/www/compressly

# Start ứng dụng
pm2 start npm --name "compressly" -- start

# Lưu cấu hình PM2 hiện tại
pm2 save

# Thiết lập tự khởi động khi VPS reboot
pm2 startup
# → Làm theo hướng dẫn in ra (copy-paste lệnh sudo mà PM2 gợi ý)
```

### Quản lý

| Lệnh | Mô tả |
|------|-------|
| `pm2 status` | Xem trạng thái tất cả process |
| `pm2 logs compressly` | Xem log realtime |
| `pm2 restart compressly` | Khởi động lại |
| `pm2 stop compressly` | Dừng |
| `pm2 delete compressly` | Xóa khỏi PM2 |
| `pm2 monit` | Dashboard monitor |

### Đổi port (nếu cần)

Mặc định Next.js chạy port `3000`. Đổi bằng biến `PORT`:

```bash
PORT=8080 pm2 start npm --name "compressly" -- start
```

---

## 7. Nginx reverse proxy

Nginx phía trước để: phục vụ trên port 80/443, nén gzip, tăng giới hạn upload, và dễ dàng gắn SSL.

### Cài Nginx

```bash
sudo apt -y install nginx
```

### Tạo virtual host

```bash
sudo nano /etc/nginx/sites-available/compressly
```

Nội dung:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Giới hạn upload — khớp với WEB_MAX_FILE_SIZE (tối đa 20MB cho batch)
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Hỗ trợ WebSocket (Next.js hot reload trong dev)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Truyền thông tin client gốc
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout cho upload file lớn
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

> ⚠️ Thay `your-domain.com` bằng domain thật của bạn.

### Kích hoạt

```bash
# Tạo symlink
sudo ln -s /etc/nginx/sites-available/compressly /etc/nginx/sites-enabled/

# Xóa default site (tùy chọn)
sudo rm -f /etc/nginx/sites-enabled/default

# Test cấu hình
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Giờ truy cập `http://your-domain.com` sẽ thấy ứng dụng.

---

## 8. Cài đặt HTTPS (Let's Encrypt)

### Cài Certbot

```bash
sudo apt -y install certbot python3-certbot-nginx
```

### Cấp chứng chỉ SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Làm theo hướng dẫn trên màn hình (nhập email, đồng ý điều khoản).

Certbot sẽ:
- Tự động cấu hình HTTPS trong Nginx
- Thiết lập redirect HTTP → HTTPS
- Tạo cron job tự gia hạn chứng chỉ

### Kiểm tra gia hạn tự động

```bash
sudo certbot renew --dry-run
```

Sau khi cài xong, truy cập `https://your-domain.com`.

---

## 9. Sử dụng trang Admin

Truy cập `https://your-domain.com/admin`.

### Đăng nhập

Nhập mật khẩu đã đặt trong `ADMIN_PASSWORD` (hoặc đã thay đổi qua trang admin).

### Quản lý API Key

- **Tạo key mới:** Nhập tên (label) và quota → nhấn tạo. Key dạng `sk_<24 ký tự hex>`.
- **Xem danh sách:** Hiển thị tất cả key, trạng thái, số lần đã dùng / quota.
- **Vô hiệu hóa / kích hoạt:** Bật/tắt key mà không xóa.
- **Xóa key:** Xóa vĩnh viễn khỏi hệ thống.

### Quản lý giao diện

- Upload logo, favicon, banner
- Đổi tên site, tiêu đề SEO, mô tả SEO, footer (hỗ trợ tiếng Việt & tiếng Anh)
- Đổi mật khẩu admin
- Chuyển đổi theme (sáng/tắt) và ngôn ngữ mặc định

---

## 10. Tùy chỉnh giao diện & SEO

Tất cả có thể thay đổi qua trang `/admin` mà không cần sửa code:

| Trường | File lưu | Mô tả |
|--------|----------|-------|
| Logo | `public/logo/logo.png` | Logo hiển thị trên header |
| Favicon | `public/favicon/favicon.png` | Icon trên tab trình duyệt |
| Banner | `public/banner/banner.png` | Banner quảng cáo trên trang chủ |
| Tên site | `data/settings.json` → `siteName` | Hiển thị ở header, title, metadata |
| SEO Title | `data/settings.json` → `seoTitle` | Thẻ `<title>` và Open Graph |
| SEO Description | `data/settings.json` → `seoDescription` | Meta description |
| Footer | `data/settings.json` → `footerContent` | Chân trang |
| Theme mặc định | `data/settings.json` → `defaultTheme` | `light` hoặc `dark` |
| Ngôn ngữ mặc định | `data/settings.json` → `defaultLang` | `en` hoặc `vi` |

---

## 11. Cập nhật ứng dụng

```bash
cd /var/www/compressly

# Lấy code mới
git pull origin main

# Cài dependencies mới (nếu có thay đổi package.json)
npm install

# Build lại
npm run build

# Khởi động lại
pm2 restart compressly
```

> **Backup trước khi cập nhật:**
> ```bash
> cp -r data/ /tmp/compressly-data-backup/
> cp .env /tmp/compressly-env-backup
> ```

---

## 12. Khắc phục sự cố

| Vấn đề | Nguyên nhân & Cách xử lý |
|--------|--------------------------|
| `EADDRINUSE :::3000` | Port 3000 đã bị chiếm. Tìm: `sudo lsof -i :3000` → kill process đó, hoặc đổi port qua biến `PORT`. |
| `sharp` lỗi khi cài | Thiếu thư viện hệ thống. Cài: `sudo apt -y install build-essential libvips-dev` rồi chạy lại `npm install`. |
| Trang `/admin` báo `ADMIN_NOT_CONFIGURED` | Chưa đặt `ADMIN_PASSWORD` trong `.env`. Thêm và restart: `pm2 restart compressly`. |
| Upload bị lỗi 413 (file too large) | Kiểm tra: (1) `WEB_MAX_FILE_SIZE` trong `.env`, (2) `client_max_body_size` trong Nginx. |
| Build fail do hết RAM | Thêm swap 2 GB: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Nginx lỗi 502 Bad Gateway | Ứng dụng chưa chạy. Kiểm tra: `pm2 status` → start nếu cần: `pm2 start compressly`. |
| Không truy cập được từ ngoài | Kiểm tra firewall: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp` |
| Certbot lỗi "DNS problem" | Domain chưa trỏ đúng IP VPS. Kiểm tra DNS A record trỏ tới IP của VPS. |

---

## 13. Lệnh nhanh (copy-paste)

Đoạn script đầy đủ từ đầu đến khi ứng dụng chạy:

```bash
# ── 1. Hệ thống ──────────────────────────────────────
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl git build-essential ca-certificates libvips-dev nginx

# ── 2. Node.js 24 ────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt -y install nodejs

# ── 3. Mã nguồn ──────────────────────────────────────
cd /var/www
sudo git clone https://github.com/bnixvn/compressly.git compressly
sudo chown -R $USER:$USER compressly
cd compressly
npm install
npm run build

# ── 4. Cấu hình ──────────────────────────────────────
cp .env.example .env
nano .env    # → đổi ADMIN_PASSWORD

# ── 5. PM2 ────────────────────────────────────────────
sudo npm install -g pm2
pm2 start npm --name "compressly" -- start
pm2 save
pm2 startup    # copy-paste lệnh sudo mà PM2 gợi ý

# ── 6. Nginx ──────────────────────────────────────────
sudo nano /etc/nginx/sites-available/compressly
# → paste nội dung virtual host ở mục 7

sudo ln -s /etc/nginx/sites-available/compressly /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── 7. SSL ────────────────────────────────────────────
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# ── 8. Firewall (tùy chọn) ───────────────────────────
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## REST API (tài liệu nhanh)

Sau khi deploy, API sẵn dùng tại `https://your-domain.com/api/v1/`:

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/v1` | GET | Thông tin dịch vụ |
| `/api/v1/images/compress` | POST | Nén ảnh (giữ định dạng gốc) |
| `/api/v1/images/convert/webp` | POST | Chuyển sang WebP |
| `/api/v1/images/optimize` | POST | Tối ưu (mode: `compress` \| `webp`) |

Header bắt buộc: `Authorization: Bearer <api_key>`

```bash
# Ví dụ: nén ảnh
curl -X POST https://your-domain.com/api/v1/images/compress \
  -H "Authorization: Bearer sk_your_key_here" \
  -F "file=@photo.jpg" -F "quality=75" -o photo-optimized.jpg

# Ví dụ: chuyển WebP
curl -X POST https://your-domain.com/api/v1/images/convert/webp \
  -H "Authorization: Bearer sk_your_key_here" \
  -F "file=@photo.png" -o photo.webp
```

---

*BNIX COMPRESS IMAGES — Next.js 15 + Sharp/libvips image compression SaaS.*
