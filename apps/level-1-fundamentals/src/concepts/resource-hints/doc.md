# Preload vs Prefetch vs Preconnect (Resource Hints)

Resource hints cho trình duyệt biết **trước** rằng ta sẽ cần thứ gì đó, để nó chuẩn bị sớm.
Dùng đúng → giảm độ trễ; dùng sai → lãng phí băng thông và **tranh giành** với tài nguyên
thực sự quan trọng.

## Bảng phân biệt cốt lõi

| Hint | Mục đích | Ưu tiên | Khi nào dùng |
|---|---|---|---|
| `preconnect` | Thiết lập sẵn **kết nối** (DNS + TCP + TLS) tới một origin | — | Bạn chắc chắn sẽ tải tài nguyên từ origin bên thứ ba (font, CDN, API) |
| `dns-prefetch` | Chỉ phân giải **DNS** trước (rẻ hơn preconnect) | — | Fallback cho trình duyệt cũ, hoặc nhiều origin chỉ cần DNS |
| `preload` | Tải sớm **một tài nguyên cụ thể** của trang **hiện tại**, ưu tiên cao | cao | Tài nguyên quan trọng bị phát hiện muộn (font, ảnh LCP, CSS/JS critical) |
| `prefetch` | Tải sẵn tài nguyên cho **điều hướng tương lai**, ưu tiên rất thấp | thấp nhất | Tài nguyên của trang/route người dùng *có thể* vào tiếp |
| `modulepreload` | Như preload nhưng cho **ES module** (parse + nạp vào module map) | cao | Module JS critical |

## `preconnect` — tiết kiệm round-trip kết nối

Kết nối tới origin mới tốn DNS lookup + bắt tay TCP + bắt tay TLS — có thể vài trăm ms. Nếu
biết chắc sẽ tải từ origin đó, mở kết nối trước:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="https://fonts.gstatic.com" /> <!-- fallback -->
```

> Chỉ preconnect **những origin chắc chắn dùng** (giới hạn ~vài cái). Mở kết nối thừa làm
> lãng phí và có thể bị trình duyệt đóng trước khi dùng.

## `preload` — "tôi cần cái này sớm, cho trang NÀY"

Trình duyệt phát hiện một số tài nguyên muộn (font khai báo trong CSS, ảnh trong JS). `preload`
nâng ưu tiên và bắt đầu tải ngay:

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />
```

- **Bắt buộc có `as`** (font, image, script, style, fetch…) để trình duyệt đặt đúng ưu tiên,
  áp đúng CSP và **tái sử dụng** kết nối/đối tượng đã tải.
- Font cần `crossorigin` (font luôn fetch ở chế độ CORS).
- Preload sai (tải mà không dùng trong vài giây) → cảnh báo console + lãng phí.

## `prefetch` — "có thể cần cho trang SAU"

Ưu tiên thấp nhất, dùng cho điều hướng tương lai (route kế, ảnh trang sản phẩm tiếp theo):

```html
<link rel="prefetch" href="/next-page.js" as="script" />
```

Trình duyệt chỉ tải khi nhàn rỗi và sẽ cất vào HTTP cache cho lần điều hướng sau. **Không**
dùng prefetch cho tài nguyên cần ngay ở trang hiện tại (dùng preload).

## So sánh nhanh "preload vs prefetch"

- **preload** = *trang này, ngay bây giờ, ưu tiên cao*.
- **prefetch** = *trang tương lai, lúc rảnh, ưu tiên thấp*.

Nhầm lẫn kinh điển: dùng `prefetch` cho font của trang hiện tại → font tải muộn, vẫn FOIT/FOUT;
hoặc `preload` cho tài nguyên của trang sau → tranh băng thông với tài nguyên trang hiện tại.

## `fetchpriority` & Priority Hints

Thuộc tính `fetchpriority="high|low|auto"` (trên `<img>`, `<link>`, `fetch()`) tinh chỉnh ưu
tiên trong cùng loại — ví dụ nâng ảnh LCP, hạ ảnh dưới màn hình. (Học sâu ở Level 5 — "Priority hints".)

## Checklist cho senior

- Phân biệt rạch ròi preconnect (kết nối) vs preload (tài nguyên trang này) vs prefetch (trang sau).
- `preload` luôn có `as`; font cần `crossorigin`.
- Chỉ preconnect vài origin chắc chắn dùng; tránh hint thừa gây tranh chấp.
- Biết hậu quả khi dùng sai (cảnh báo, lãng phí, FOUT).

## References

- [web.dev: Preload, prefetch and other link types](https://web.dev/articles/preload-responsive-warning)
- [MDN: rel=preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)
- [MDN: rel=preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect)
- [web.dev: Establish network connections early (preconnect)](https://web.dev/articles/preconnect-and-dns-prefetch)
- [web.dev: fetchpriority](https://web.dev/articles/fetch-priority)
