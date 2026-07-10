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

Ứng dụng yêu cầu **Node.js v24** (bắt buộc — Next.js 15 và Sharp cần các tính năng mới).  
Có 2 cách cài: **NodeSource** (khuyên dùng cho VPS) hoặc **nvm** (nếu cần nhiều phiên bản).

### Cách A: NodeSource (khuyên dùng cho server)

> NodeSource cài Node.js system-wide, mọi user đều dùng được. Phù hợp cho VPS production.

**Bước 1 — Cập nhật hệ thống & cài thư viện cần thiết:**

```bash
sudo apt update && sudo apt -y upgrade
```

```bash
sudo apt -y install curl git build-essential ca-certificates libvips-dev
```

Giải thích từng gói:
- `curl` — tải script cài NodeSource
- `git` — clone mã nguồn từ GitHub
- `build-essential` — trình biên dịch C/C++ (gcc, g++, make) để build native module
- `ca-certificates` — chứng chỉ SSL để tải gói qua HTTPS
- `libvips-dev` — thư viện xử lý ảnh mà `sharp` phụ thuộc vào

**Bước 2 — Thêm repo NodeSource cho Node 24:**

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
```

Lệnh này tải script từ NodeSource, script sẽ tự động thêm kho package Node.js 24 vào hệ thống.  
`sudo -E bash -` chạy script với quyền root, giữ nguyên biến môi trường.

**Bước 3 — Cài đặt Node.js và npm:**

```bash
sudo apt -y install nodejs
```

Lệnh này cài cả `node` (runtime) lẫn `npm` (trình quản lý package).

**Bước 4 — Kiểm tra cài đặt thành công:**

```bash
node -v
```

Kết quả mong đợi: `v24.x.x` (ví dụ `v24.4.1`).

```bash
npm -v
```

Kết quả mong đợi: `11.x.x` (ví dụ `11.4.2`).

> ⚠️ Nếu `node -v` báo `command not found`, hãy thử đóng terminal mở lại, hoặc chạy `source ~/.bashrc`.

### Cách B: nvm (nếu cần quản lý nhiều phiên bản Node)

> nvm cài Node theo từng user, không ảnh hưởng hệ thống. Phù hợp nếu bạn dev nhiều project.

```bash
# Tải & cài nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Load nvm vào terminal hiện tại
source ~/.bashrc

# Cài Node.js 24
nvm install 24

# Đặt Node 24 là phiên bản mặc định
nvm use 24
nvm alias default 24

# Kiểm tra
node -v   # v24.x.x
npm -v    # 11.x.x
```

> **Lưu ý khi dùng nvm với PM2:** PM2 cần được cài trong cùng context nvm.  
> Chạy `nvm use 24` trước khi `npm install -g pm2`.

---

## 3. Tải mã nguồn & build

### 3.1. Tạo thư mục chứa dự án

```bash
sudo mkdir -p /var/www
cd /var/www
```

> `/var/www` là thư mục chuẩn trên Linux để chứa các website. Bạn có thể đổi sang đường dẫn khác nếu muốn.

### 3.2. Clone repo từ GitHub

```bash
sudo git clone https://github.com/bnixvn/compressly.git compressly
```

Lệnh này tải toàn bộ mã nguồn từ GitHub về thư mục `/var/www/compressly`.

> Nếu server không có kết nối internet, bạn có thể tải file `.zip` từ GitHub trên máy local rồi upload lên VPS qua `scp` hoặc SFTP.

### 3.3. Cấp quyền cho user hiện tại

```bash
sudo chown -R $USER:$USER compressly
```

Lệnh này chuyển quyền sở hữu thư mục từ `root` sang user đang đăng nhập, để bạn có thể chạy `npm install` mà không cần `sudo`.

### 3.4. Vào thư mục dự án

```bash
cd compressly
```

Kiểm tra đã đúng thư mục chưa:

```bash
ls -la
```

Bạn sẽ thấy các file: `package.json`, `README.md`, `app/`, `lib/`, `public/`, v.v.

### 3.5. Cài đặt dependencies

```bash
npm install
```

Lệnh này đọc `package.json` và tải tất cả thư viện cần thiết vào thư mục `node_modules/`.

Quá trình này mất **1–3 phút** tùy tốc độ mạng và CPU VPS.  
`sharp` sẽ tự biên dịch native code trong bước này — nếu thiếu `libvips-dev` sẽ báo lỗi.

> **Lỗi `sharp`?** Chạy lại:
> ```bash
> sudo apt -y install libvips-dev
> npm rebuild sharp
> ```

### 3.6. Build production

```bash
npm run build
```

Lệnh này biên dịch Next.js sang production build (tối ưu, nhỏ gọn).  
Quá trình mất **1–2 phút**. Kết quả tạo thư mục `.next/` chứa bản build sẵn chạy.

Khi thấy dòng `Route (app)` và `○ /` là build thành công.

### 3.7. Kiểm tra kết quả

Sau khi build, cấu trúc thư mục sẽ như sau:

```
compressly/
├── .next/           ← build production (tự tạo sau npm run build)
├── app/             ← mã nguồn giao diện & API
├── data/            ← dữ liệu runtime (apikeys.json, settings.json)
├── lib/             ← code backend
├── node_modules/    ← dependencies (tự tạo sau npm install)
├── public/          ← ảnh tĩnh (logo, favicon, banner)
├── .env.example     ← file mẫu biến môi trường
├── package.json     ← thông tin dự án
└── README-VPS.md    ← tài liệu này
```

✅ Tới đây bạn đã có mã nguồn sẵn sàng. Tiếp theo: **cấu hình biến môi trường**.

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

Trước khi deploy production, hãy chạy thử ở chế độ dev để kiểm tra mọi thứ hoạt động.

### Khởi động dev server

```bash
cd /var/www/compressly
npm run dev
```

Lệnh này khởi động Next.js ở chế độ development, hỗ trợ hot-reload (sửa code tự cập nhật).

Khi thấy dòng:
```
  ▲ Next.js 15.x.x
  - Local:   http://localhost:3000
```

là server đã chạy.

### Kiểm tra trong trình duyệt

Mở trình duyệt trên máy local, truy cập:

- **`http://<IP_VPS>:3000`** — Giao diện nén ảnh chính (kéo-thả file vào để test)
- **`http://<IP_VPS>:3000/admin`** — Trang quản trị (nhập `ADMIN_PASSWORD` đã đặt trong `.env`)

> ⚠️ Nếu không truy cập được, kiểm tra firewall VPS:
> ```bash
> sudo ufw allow 3000/tcp
> ```

### Dừng dev server

Quay lại terminal, nhấn **`Ctrl + C`** để dừng.

> **Lưu ý:** Dev mode chỉ dùng để thử nghiệm, **không dùng cho production** vì chậm hơn và tiêu hao tài nguyên hơn.  
> Tiếp theo: cấu hình PM2 để chạy production.

---

## 6. Chạy production với PM2

> **Tại sao cần PM2?** Nếu chạy `npm start` trực tiếp, khi bạn đóng terminal thì ứng dụng sẽ tắt.  
> PM2 chạy ứng dụng như một **service nền**, tự khởi động lại khi crash, và tự chạy khi VPS reboot.

### Bước 1 — Cài PM2

```bash
sudo npm install -g pm2
```

Lệnh này cài PM2 toàn cục (dùng được cho mọi project).

Kiểm tra:

```bash
pm2 --version
```

### Bước 2 — Start ứng dụng với PM2

```bash
cd /var/www/compressly
pm2 start npm --name "compressly" -- start
```

Giải thích:
- `pm2 start npm` — PM2 chạy lệnh `npm` làm process nền
- `--name "compressly"` — đặt tên cho process (dễ quản lý)
- `-- start` — truyền `start` làm tham số cho `npm` (tương đương `npm start`)

Khi thành công, bạn sẽ thấy bảng trạng thái:

```
┌─────┬─────────────┬──────┬───────
│ id  │ name        │ mode │ status
├─────┼─────────────┼──────┼───────
│ 0   │ compressly  │ fork │ online
└─────┴─────────────┴──────┴───────
```

`status: online` nghĩa là ứng dụng đang chạy trên port 3000.

### Bước 3 — Lưu cấu hình & tự khởi động khi reboot

```bash
pm2 save
```

Lưu danh sách process hiện tại để PM2 nhớ sau khi reboot.

```bash
pm2 startup
```

Lệnh này sẽ in ra một dòng kiểu:
```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

**Copy-paste dòng đó chạy lại** là xong. Từ giờ, mỗi khi VPS reboot, PM2 tự chạy ứng dụng.

### Bước 4 — Kiểm tra ứng dụng đang chạy

```bash
pm2 status
```

Hoặc mở trình duyệt: `http://<IP_VPS>:3000`

### Các lệnh PM2 thường dùng

| Lệnh | Mô tả |
|------|-------|
| `pm2 status` | Xem trạng thái tất cả process |
| `pm2 logs compressly` | Xem log realtime (Ctrl+C để thoát) |
| `pm2 logs compressly --lines 50` | Xem 50 dòng log gần nhất |
| `pm2 restart compressly` | Khởi động lại |
| `pm2 stop compressly` | Dừng process |
| `pm2 delete compressly` | Xóa khỏi PM2 hoàn toàn |
| `pm2 monit` | Dashboard monitor realtime (CPU, RAM, log) |
| `pm2 reload compressly` | Reload 0-downtime (dùng khi cập nhật code) |

### Đổi port (nếu cần)

Mặc định Next.js chạy port `3000`. Muốn đổi sang port khác (ví dụ `8080`):

```bash
pm2 delete compressly
PORT=8080 pm2 start npm --name "compressly" -- start
pm2 save
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
