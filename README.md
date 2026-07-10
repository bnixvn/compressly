# Compressly — Web nén ảnh & API cho WordPress

SaaS công khai để **nén ảnh JPEG/PNG** và **chuyển sang WebP**, kèm REST API có API key
dành cho WordPress plugin (hoặc bất kỳ client HTTP nào). Xử lý ảnh bằng **Sharp/libvips**,
viết bằng **TypeScript + Next.js** (một process phục vụ cả UI lẫn API).

## Tính năng

- Upload kéo-thả (JPEG/PNG), xem trước ảnh gốc & sau xử lý.
- Hiển thị dung lượng trước/sau, bytes tiết kiệm, phần trăm.
- Tải file kết quả về ngay; **không lưu trữ lâu dài**.
- API công khai: `compress`, `convert/webp`, `optimize` (cho plugin).
- Xác thực `Bearer <api_key>`, giới hạn kích thước, reject file giả mạo đuôi.

## Khởi chạy

```bash
npm install
cp .env.example .env      # chỉnh API_KEYS nếu cần
npm run dev              # http://localhost:3000
# production
npm run build && npm start
```

> `sharp` là native module; Next được cấu hình `serverExternalPackages` để không bundle nó.

### 🚀 Deploy lên VPS (Ubuntu / Debian)

**[📖 Hướng dẫn cài đặt chi tiết trên VPS →](README-VPS.md)**

Hướng dẫn từng bước: cài Node.js 24, clone source, build, chạy với PM2, cấu hình Nginx reverse proxy, cài SSL (Let's Encrypt), quản lý Admin panel, và khắc phục sự cố. Áp dụng cho Ubuntu 24.04, Debian 12, Debian 13.

## Cấu hình (.env)

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `API_KEYS` | `sk_demo_4f3c9a,sk_demo_8b2e1d` | Danh sách key hợp lệ (phân cách dấu phẩy). |
| `MAX_FILE_SIZE` | `10485760` | Giới hạn mỗi file (byte), mặc định 10MB. |
| `DEFAULT_QUALITY` | `80` | Quality mặc định cho JPEG/WebP. |
| `NEXT_PUBLIC_DEMO_API_KEY` | `sk_demo_4f3c9a` | Key demo được UI tự điền. |

## REST API

Tất cả endpoint là `POST` multipart: field `file` (JPEG/PNG), optional `quality` (1–100).
Header bắt buộc: `Authorization: Bearer <api_key>`.

| Endpoint | Mô tả |
|----------|-------|
| `POST /api/v1/images/compress` | Nén, giữ định dạng gốc. |
| `POST /api/v1/images/convert/webp` | Chuyển sang `.webp` (giữ alpha nếu PNG trong suốt). |
| `POST /api/v1/images/optimize` | `mode=compress|webp`, `quality?` — dành cho plugin. |
| `GET  /api/v1` | Trả về thông tin dịch vụ. |

### Response headers (cho client parse)

- `X-Original-Size`
- `X-Optimized-Size`
- `X-Saved-Bytes`
- `X-Saved-Percent`

### Lỗi chuẩn (JSON)

```json
{ "code": "INVALID_API_KEY", "message": "...", "details": null }
```

Các mã thường gặp: `INVALID_API_KEY` (401), `UNSUPPORTED_TYPE` (415),
`FILE_TOO_LARGE` (413), `MISSING_FILE` (400), `INVALID_QUALITY` (400).

### Ví dụ curl

```bash
curl -X POST http://localhost:3000/api/v1/images/convert/webp \
  -H "Authorization: Bearer sk_demo_4f3c9a" \
  -F "file=@photo.png" -o photo.webp

curl -X POST http://localhost:3000/api/v1/images/compress \
  -H "Authorization: Bearer sk_demo_4f3c9a" \
  -F "file=@photo.jpg" -F "quality=75" -o photo-optimized.jpg
```

## Mẫu WordPress plugin gửi ảnh qua API

```php
function compressly_optimize_attachment( $file_path ) {
    $api_key = 'sk_demo_4f3c9a'; // lưu trong settings của plugin
    $endpoint = 'http://localhost:3000/api/v1/images/optimize';

    $body = array(
        'mode'    => 'webp',
        'quality' => 80,
        'file'    => new CURLFile( $file_path, mime_content_type( $file_path ), basename( $file_path ) ),
    );

    $response = wp_remote_post( $endpoint, array(
        'headers'     => array( 'Authorization' => 'Bearer ' . $api_key ),
        'body'        => $body,
        'timeout'     => 60,
        'stream'      => true,
        'filename'    => $file_path . '.webp', // lưu kết quả trực tiếp
    ) );

    if ( is_wp_error( $response ) ) {
        error_log( 'Compressly error: ' . $response->get_error_message() );
        return false;
    }

    $original = wp_remote_retrieve_header( $response, 'X-Original-Size' );
    $optimized = wp_remote_retrieve_header( $response, 'X-Optimized-Size' );
    $saved = wp_remote_retrieve_header( $response, 'X-Saved-Percent' );
    error_log( "Compressly: $original -> $optimized ($saved% saved)" );
    return true;
}
```

## Kế hoạch test

- Upload hợp lệ: `jpg`, `jpeg`, `png`.
- Reject: GIF, SVG, PDF, file đổi đuôi giả (kiểm tra bằng giải mã thật).
- Nén giữ định dạng gốc; WebP đúng MIME `image/webp`.
- PNG trong suốt vẫn giữ alpha khi sang WebP.
- File vượt giới hạn → `413` rõ ràng.
- API key thiếu/sai → `401`.
- Output nhỏ hơn input với ảnh mẫu phổ biến.
- UI responsive desktop/mobile, không tràn layout.
