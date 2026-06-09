# Critical Rendering Path (CRP)

## CRP là gì

Critical Rendering Path là **chuỗi bước trình duyệt phải thực hiện** để biến HTML/CSS/JS
nhận được thành pixel trên màn hình. Tối ưu CRP = rút ngắn thời gian tới **First Paint /
First Contentful Paint**.

```
Bytes ──▶ DOM ──┐
                 ├──▶ Render Tree ──▶ Layout (reflow) ──▶ Paint ──▶ Composite ──▶ Pixels
Bytes ──▶ CSSOM ─┘
                 ▲
              JavaScript có thể chặn/sửa cả DOM lẫn CSSOM
```

## Các bước chi tiết

1. **HTML → DOM**: parser đọc HTML, dựng cây DOM. Parser **tạm dừng** khi gặp `<script>`
   đồng bộ (không `defer`/`async`).
2. **CSS → CSSOM**: CSS là **render-blocking**. Trình duyệt không paint nội dung cho tới
   khi CSSOM sẵn sàng (để tránh "flash" nội dung chưa style — FOUC).
3. **DOM + CSSOM → Render Tree**: chỉ gồm node sẽ hiển thị (bỏ `display:none`, `<head>`…),
   kèm style đã tính.
4. **Layout (reflow)**: tính kích thước & vị trí từng node (geometry).
5. **Paint**: vẽ pixel cho từng layer (text, màu, ảnh, border…).
6. **Composite**: ghép các layer lại theo đúng thứ tự (GPU). (Sâu hơn ở Level 3.)

## Hai "kẻ chặn đường" chính

### CSS là render-blocking
Trình duyệt **không paint** cho đến khi tải & parse xong CSS cần thiết. CSS càng nặng/nhiều
file → first paint càng trễ. Giải pháp: inline critical CSS, tách CSS không quan trọng, dùng
`media` để hạ ưu tiên (`<link media="print">` → không render-blocking).

### JavaScript là parser-blocking
`<script>` đồng bộ trong `<head>` **chặn parser**: trình duyệt dừng dựng DOM để tải + chạy
script. Tệ hơn: script muốn đọc CSSOM phải đợi CSS xong → JS bị chặn bởi CSS, mà JS lại chặn
DOM. Đây là chuỗi phụ thuộc gây chậm điển hình.

| Thuộc tính script | Chặn parser? | Khi nào chạy | Giữ thứ tự? |
|---|---|---|---|
| (không có) | ✔ chặn | ngay khi tải xong, dừng parse | có |
| `async` | ✘ | tải xong là chạy ngay (bất kỳ lúc nào) | **không** |
| `defer` | ✘ | sau khi DOM dựng xong, trước `DOMContentLoaded` | có |
| `type="module"` | ✘ (mặc định defer) | sau parse | có |

## Các chỉ số cần biết

- **FP / FCP**: lần đầu có pixel / có nội dung. Phụ thuộc CRP.
- **DOMContentLoaded (DCL)**: DOM dựng xong (đợi script defer/sync).
- **Load**: mọi tài nguyên (ảnh, css, js) tải xong.
- **LCP**: phần tử nội dung lớn nhất hiển thị (Core Web Vital). Tối ưu CRP + preload ảnh LCP.

## Chiến lược tối ưu CRP (thực chiến)

1. **Giảm số byte render-blocking**: minify, nén (gzip/brotli), tree-shake CSS.
2. **Inline critical CSS** cho phần above-the-fold; lazy-load phần còn lại.
3. **Đưa script xuống cuối `<body>` hoặc dùng `defer`** để không chặn parser.
4. **`async`** cho script độc lập (analytics) không phụ thuộc DOM/thứ tự.
5. **Preload** tài nguyên quan trọng (font, ảnh LCP) — xem concept "Resource Hints".
6. **Giảm số round-trip** (HTTP/2-3, preconnect tới origin bên thứ ba).

## Checklist cho senior

- Vẽ được pipeline DOM/CSSOM → Render Tree → Layout → Paint → Composite.
- Giải thích vì sao CSS render-blocking và JS parser-blocking.
- Phân biệt async vs defer vs module chính xác.
- Biết chỉ số nào đo cái gì (FCP/DCL/Load/LCP).

## References

- [web.dev: Critical Rendering Path](https://web.dev/articles/critical-rendering-path)
- [MDN: Critical rendering path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [web.dev: script async/defer](https://web.dev/articles/efficiently-load-third-party-javascript)
- [web.dev: Largest Contentful Paint (LCP)](https://web.dev/articles/lcp)
