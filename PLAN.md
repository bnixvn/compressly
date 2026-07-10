# Plan Web Nén Ảnh Và API Cho WordPress

## Summary
Xây dựng web app dạng SaaS công khai để upload ảnh `jpg`, `jpeg`, `png`, sau đó:
- Nén giảm dung lượng nhưng giữ chất lượng nhìn tốt.
- Convert ảnh sang `webp`.
- Cung cấp REST API có API key để sau này viết WordPress plugin gọi trực tiếp.

Ngôn ngữ/stack đề xuất: **TypeScript + Node.js**, dùng **Sharp/libvips** để xử lý ảnh. Đây là lựa chọn phù hợp vì xử lý ảnh mạnh, API dễ viết, hệ sinh thái web tốt, và WordPress plugin có thể gọi qua HTTP REST rất thuận tiện.

## Key Changes
- Frontend: **Next.js + React + TypeScript**.
  - Màn upload kéo-thả ảnh.
  - Hiển thị ảnh gốc, ảnh sau xử lý, dung lượng trước/sau, phần trăm tiết kiệm.
  - Cho tải file output về ngay; không lưu lâu dài.

- Backend API: **Fastify hoặc NestJS + TypeScript**.
  - `POST /v1/images/compress`
    - Input: multipart file `jpg/jpeg/png`.
    - Output: ảnh đã nén cùng định dạng gốc.
  - `POST /v1/images/convert/webp`
    - Input: multipart file `jpg/jpeg/png`.
    - Output: file `.webp`.
  - `POST /v1/images/optimize`
    - Input: `file`, `mode=compress|webp`, optional `quality`.
    - Dành cho WordPress plugin dùng về sau.
  - Auth bằng `Authorization: Bearer <api_key>` cho API public/plugin.
  - Giới hạn file MVP: ví dụ `10MB/file`, chỉ nhận MIME hợp lệ, reject file lỗi hoặc giả mạo đuôi.

- Xử lý ảnh:
  - Dùng `sharp`.
  - JPEG: nén với `mozjpeg`, quality mặc định `80`.
  - PNG: tối ưu lossless/lossy nhẹ bằng `compressionLevel`, palette nếu phù hợp.
  - WebP: quality mặc định `80`, giữ alpha nếu ảnh PNG có trong suốt.
  - Strip metadata mặc định để giảm dung lượng; có thể thêm tùy chọn giữ metadata sau.

- Storage policy:
  - File xử lý trong thư mục tạm hoặc memory stream.
  - Trả file về client/API ngay.
  - Xóa file tạm sau request/job, không lưu lâu dài trong MVP.

- Chuẩn bị cho WordPress plugin:
  - API contract ổn định theo `/v1`.
  - Response headers gồm:
    - `X-Original-Size`
    - `X-Optimized-Size`
    - `X-Saved-Bytes`
    - `X-Saved-Percent`
  - Error JSON chuẩn: `code`, `message`, `details`.
  - Tài liệu mẫu PHP `wp_remote_post()` để plugin gửi ảnh và nhận file tối ưu.

## Test Plan
- Upload hợp lệ: `jpg`, `jpeg`, `png`.
- Reject file không hợp lệ: GIF, SVG, PDF, file đổi đuôi giả.
- Kiểm tra nén ảnh giữ định dạng gốc.
- Kiểm tra convert WebP tạo đúng MIME `image/webp`.
- Kiểm tra ảnh PNG trong suốt vẫn giữ alpha khi convert WebP.
- Kiểm tra file lớn vượt giới hạn bị từ chối rõ ràng.
- Kiểm tra API key thiếu/sai bị trả `401`.
- Kiểm tra output nhỏ hơn input trong các ảnh mẫu phổ biến.
- Kiểm tra UI responsive desktop/mobile và không bị tràn layout.

## Assumptions
- Chọn hướng **server-side API**.
- Sản phẩm hướng **SaaS công khai**.
- File output **tải về rồi xóa**, không lưu lâu dài trong MVP.
- Stack mặc định: **TypeScript, Node.js, Next.js, Sharp, Fastify/NestJS**.
- WordPress plugin chưa cần viết ngay, nhưng API sẽ thiết kế sẵn để plugin tích hợp được.
