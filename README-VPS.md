# Hướng dẫn cài đặt trên VPS (Ubuntu 24.04 / Debian 12 / Debian 13)

Ứng dụng **BNIX COMPRESS IMAGES** là một dự án Next.js (App Router) + React + Sharp.
Một process Node.js phục vụ cả UI lẫn API. Tài liệu này hướng dẫn deploy lên VPS
chạy Ubuntu 24.04 LTS, Debian 12 (Bookworm) hoặc Debian 13 (Trixie).

---

## 1. Yêu cầu hệ thống

| Thành phần | Phiên bản khuyên dùng |
|------------|----------------------|
| OS | Ubuntu 24.04 / Debian 12 / Debian 13 (64-bit) |
| Node.js | **v24** (LTS gần nhất) — bắt buộc do dùng tính năng mới của Next 15 |
| npm | 11+ (đi kèm Node 24) |
| Git | bất kỳ phiên bản mới |
| RAM | tối thiểu 1 GB (khuyên 2 GB trở lên để build) |
| Disk | 2 GB trống trở lên |
| (Tùy chọn) Nginx | làm reverse proxy + SSL |
| (Tùy chọn) PM2 | quản lý process nền |

> ⚠️ `sharp` là native module (libvips). Build trên VPS cần trình biên dịch C/C++
> (có sẵn qua `build-essential` trên Debian/Ubuntu) hoặc cài gói `libvips-dev`.

---

## 2. Cài đặt môi trường

### 2.1. Cập nhật hệ thống

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl git build-essential ca-certificates
```

### 2.2. Cài đặt Node.js v24 (NodeSource)

Chạy script thiết lập repo NodeSource cho Node 24:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt -y install nodejs
```

Kiểm tra:

```bash
node -v   # v24.x.x
npm -v    # 11.x.x
```

> Nếu thích quản lý nhiều phiên bản, có thể dùng `nvm` thay vì NodeSource.
> Nhưng với VPS production, NodeSource (cài system-wide) đơn giản hơn.

---

## 3. Lấy mã nguồn

```bash
cd /var/www
sudo git clone <REPO_URL> compressly
sudo chown -R $USER:$USER compressly
cd compressly
```

> Thay `<REPO_URL>` bằng URL git của bạn (ví dụ `https://github.com/you/compressly.git`).
> Nếu bạn vừa `git init` trên máy local, hãy push lên GitHub/GitLab rồi clone về VPS.

---

## 4. Cài đặt dependencies & build

```bash
npm install
npm run build
```

Quá trình build sẽ biên dịch Next.js. Nếu gặp lỗi thiếu `libvips`, cài thêm:

```bash
sudo apt -y install libvips-dev
```

---

## 5. Cấu hình biến môi trường

Copy file mẫu và chỉnh sửa:

```bash
cp .env.example .env
nano .env
```

Các biến quan trọng (xem `.env.example` để biết đầy đủ):

| Biến | Ý nghĩa | Ghi chú |
|------|---------|---------|
| `ADMIN_PASSWORD` | Mật khẩu trang `/admin` và API admin | **Bắt buộc đổi** thành giá trị mạnh, ngẫu nhiên |
| `API_KEYS` | Danh sách key seed (cách nhau dấu phẩy) | Để trống để tạo sau qua `/admin` |
| `DEFAULT_QUOTA` | Quota mỗi key (số request thành công) | Mặc định 1000 |
| `WEB_MAX_FILES` | Số file tối đa mỗi lần upload web | Mặc định 20 |
| `WEB_MAX_FILE_SIZE` | Giới hạn mỗi file web (byte) | Mặc định 5242880 (5 MB) |
| `MAX_FILE_SIZE` | Giới hạn mỗi file API v1 (byte) | Mặc định 10485760 (10 MB) |
| `DEFAULT_QUALITY` | Quality mặc định (1–100) | Mặc định 80 |

> 🔒 Tuyệt đối không commit file `.env` (đã nằm trong `.gitignore`).

---

## 6. Chạy ứng dụng (production)

### 6.1. Chạy thử thủ công

```bash
PORT=3000 npm run start
```

Truy cập `http://<IP_VPS>:3000` để kiểm tra. Nhấn `Ctrl+C` để dừng.

### 6.2. Chạy nền với PM2 (khuyên dùng)

Cài PM2 toàn cục:

```bash
sudo npm install -g pm2
```

Khởi chạy:

```bash
pm2 start "npm run start" --name compressly --update-env
pm2 save
pm2 startup   # làm theo hướng dẫn in ra để tự khởi động cùng hệ thống
```

Quản lý:

```bash
pm2 status
pm2 logs compressly
pm2 restart compressly
pm2 stop compressly
```

---

## 7. Cấu hình Nginx reverse proxy (tùy chọn nhưng khuyên dùng)

### 7.1. Cài Nginx

```bash
sudo apt -y install nginx
```

### 7.2. Tạo virtual host

Tạo file `/etc/nginx/sites-available/compressly`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M;   # cho phép upload file lớn
    }
}
```

Kích hoạt:

```bash
sudo ln -s /etc/nginx/sites-available/compressly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 8. Cài đặt SSL (HTTPS) với Let's Encrypt

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot tự động cấu hình HTTPS và lên lịch gia hạn. Kiểm tra:

```bash
sudo certbot renew --dry-run
```

Sau khi có HTTPS, truy cập `https://your-domain.com`.

---

## 9. Cập nhật ứng dụng

```bash
cd /var/www/compressly
git pull
npm install
npm run build
pm2 restart compressly
```

---

## 10. Khắc phục sự cố

| Triệu chứng | Nguyên nhân / Xử lý |
|-------------|---------------------|
| Lỗi `EADDRINUSE :::3000` | Port 3000 đã bị chiếm. Dùng `sudo lsof -i :3000` để tìm process và `kill`, hoặc đổi `PORT`. |
| `sharp` báo lỗi native module | Thiếu `libvips-dev` hoặc chưa build đúng. Cài `libvips-dev` rồi `npm rebuild sharp`. |
| Trang `/admin` báo `ADMIN_NOT_CONFIGURED` | Chưa đặt `ADMIN_PASSWORD` trong `.env`. |
| Upload bị reject (413) | Tăng `client_max_body_size` trong Nginx và `WEB_MAX_FILE_SIZE`/`MAX_FILE_SIZE`. |
| Build fail do RAM thấp | Thêm swap: `sudo fallocate -l 2G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`. |

---

## 11. Tóm tắt lệnh nhanh

```bash
# 1. Môi trường
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl git build-essential ca-certificates nginx libvips-dev
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt -y install nodejs

# 2. Mã nguồn
cd /var/www && sudo git clone <REPO_URL> compressly && cd compressly

# 3. Build
npm install && npm run build
cp .env.example .env && nano .env   # sửa ADMIN_PASSWORD

# 4. Chạy nền
sudo npm install -g pm2
pm2 start "npm run start" --name compressly
pm2 save && pm2 startup

# 5. Nginx + SSL
# (cấu hình như mục 7, 8)
```

---
*Tài liệu được viết cho BNIX COMPRESS IMAGES — Next.js 15 + Sharp image pipeline.*
