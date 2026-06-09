# CORS preflight

## Bối cảnh: Same-Origin Policy

Trình duyệt mặc định chặn JS đọc **response** từ origin khác (khác scheme/host/port). **CORS**
(Cross-Origin Resource Sharing) là cơ chế để **server** chủ động cho phép origin khác đọc
response, thông qua các header `Access-Control-*`.

> Lưu ý: CORS bảo vệ ở tầng **đọc response bằng JS**. Request vẫn có thể được gửi đi (với
> "simple request"); cái bị chặn là việc JS đọc kết quả nếu server không cho phép.

## Simple request vs Preflighted request

Trình duyệt chia request cross-origin làm hai nhóm:

### "Simple request" — KHÔNG preflight
Gửi thẳng, kèm header `Origin`. Điều kiện (phải thoả **tất cả**):

- Method ∈ { `GET`, `HEAD`, `POST` }.
- Chỉ dùng các header "an toàn" do tác giả set: `Accept`, `Accept-Language`,
  `Content-Language`, `Content-Type`, `Range` (và vài header CORS-safelisted, có giới hạn giá trị).
- `Content-Type` ∈ { `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain` }.
- Không gắn `ReadableStream` upload; không có event listener trên `XMLHttpRequestUpload`.

### Preflighted request — CÓ preflight
Nếu **không** thoả điều kiện trên (vd `PUT`/`DELETE`, header `Authorization` tuỳ biến,
`Content-Type: application/json`, header `X-*`…), trình duyệt **tự động** gửi trước một request
`OPTIONS` để "hỏi phép".

```
JS gọi fetch(PUT, Content-Type: application/json, X-Token: ...)
        │
        ▼  (trình duyệt tự gửi, JS không thấy)
OPTIONS /api  ───────────────▶  Server
  Origin: https://app.example
  Access-Control-Request-Method: PUT
  Access-Control-Request-Headers: content-type, x-token
        ◀───────────────  Server trả lời preflight:
  Access-Control-Allow-Origin: https://app.example
  Access-Control-Allow-Methods: PUT, POST, GET
  Access-Control-Allow-Headers: content-type, x-token
  Access-Control-Max-Age: 600
        │  (nếu hợp lệ)
        ▼
PUT /api  ───────────────────▶  Request THẬT mới được gửi
```

`json` body chính là lý do phổ biến nhất khiến API REST luôn có preflight: `Content-Type:
application/json` không nằm trong danh sách safelist.

## Các header CORS quan trọng

| Header (response) | Ý nghĩa |
|---|---|
| `Access-Control-Allow-Origin` | Origin được phép (`*` hoặc origin cụ thể) |
| `Access-Control-Allow-Methods` | Method được phép (trả ở response preflight) |
| `Access-Control-Allow-Headers` | Header tuỳ biến được phép |
| `Access-Control-Allow-Credentials` | `true` nếu cho gửi cookie/credentials |
| `Access-Control-Max-Age` | Cache kết quả preflight (giây) → đỡ phải OPTIONS lại |
| `Access-Control-Expose-Headers` | Header response nào JS được phép đọc |

## Credentials (cookie) làm luật chặt hơn

Khi `fetch(url, { credentials: 'include' })`:

- `Access-Control-Allow-Origin` **không được** là `*` — phải là origin cụ thể.
- Phải có `Access-Control-Allow-Credentials: true`.
- `Access-Control-Allow-Headers`/`Methods` cũng không được dùng `*` (wildcard bị bỏ qua khi
  có credentials).

## Tối ưu

- **`Access-Control-Max-Age`**: cache preflight để không phải OPTIONS mỗi lần (trình duyệt có
  trần riêng, vd Chrome ~2 giờ).
- **Tránh header/`Content-Type` không cần thiết** để giữ request ở dạng "simple" khi có thể.
- **Gộp endpoint** để giảm số origin/preflight.

## Cạm bẫy

- Tưởng `OPTIONS` là do code mình gửi — không, **trình duyệt tự gửi**.
- Server quên xử lý `OPTIONS` → preflight fail → request thật không bao giờ chạy.
- Lỗi CORS hiện ở Console nhưng **request vẫn tới server** (server vẫn xử lý!) — quan trọng
  cho các thao tác side-effect: một POST "simple" vẫn chạy ở server dù JS không đọc được response.
- `mode: 'no-cors'` → response **opaque**, không đọc được body/status; không phải cách "vượt CORS".

## Checklist cho senior

- Đọc đúng điều kiện simple vs preflighted (đặc biệt `Content-Type: application/json`).
- Biết preflight là OPTIONS do trình duyệt tự gửi, và các header trả lời cần thiết.
- Hiểu ràng buộc khi `credentials: include` (không `*`).
- Biết `Access-Control-Max-Age` để giảm preflight.

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: Preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
- [Fetch Standard: CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [MDN: CORS-safelisted request header](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header)
