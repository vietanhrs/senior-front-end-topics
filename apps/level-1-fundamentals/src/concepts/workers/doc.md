# Web Workers vs Service Workers

Cả hai chạy script trên **luồng riêng, tách khỏi main thread**, **không** truy cập DOM trực
tiếp, giao tiếp qua **message**. Nhưng mục đích hoàn toàn khác nhau.

## Web Worker — luồng tính toán

Mục tiêu: **đẩy công việc nặng CPU ra khỏi main thread** để UI không giật. Main thread lo
DOM/layout/paint/sự kiện; nếu bạn chạy vòng lặp nặng trên đó, mọi tương tác và animation
JS-driven sẽ **đứng hình**.

```ts
// main.ts
const worker = new Worker(new URL('./heavy.worker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ n: 5_000_000 });
worker.onmessage = (e) => console.log('kết quả:', e.data.result);

// heavy.worker.ts
self.onmessage = (e) => {
  const result = doHeavyWork(e.data.n); // chạy trên luồng riêng
  self.postMessage({ result });
};
```

Đặc điểm:
- Không có `window`, `document`, DOM. Có `fetch`, `WebSocket`, `IndexedDB`, timers, `OffscreenCanvas`.
- Giao tiếp qua `postMessage` — dữ liệu được **structured clone** (copy). Với buffer lớn, dùng
  **Transferable objects** để *chuyển quyền sở hữu* thay vì copy (zero-copy) — học sâu ở Level 6.
- Vòng đời gắn với trang: đóng tab/`worker.terminate()` là kết thúc.
- Biến thể: **Shared Worker** (chia sẻ giữa nhiều tab cùng origin), **Worklet** (audio/paint).

Dùng khi: parse/format dữ liệu lớn, mã hoá/giải nén, xử lý ảnh, tính toán, diff lớn…

## Service Worker — proxy mạng có thể chạy nền

Mục tiêu: **đứng giữa trang và mạng** như một proxy lập trình được — phục vụ **offline**, cache
chiến lược, **push notification**, **background sync**. Đây là nền tảng của PWA.

```ts
// đăng ký (thường sau load)
navigator.serviceWorker.register('/sw.js');

// sw.js: chặn request và quyết định trả từ cache hay mạng
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((hit) => hit ?? fetch(event.request)));
});
```

Đặc điểm:
- **Bắt buộc HTTPS** (trừ `localhost`).
- **Event-driven & có thể bị kill bất cứ lúc nào**: không giữ state trong biến toàn cục giữa
  các event — dùng Cache Storage / IndexedDB.
- Phạm vi theo **scope** (đường dẫn đăng ký), chặn `fetch` trong scope đó.
- Sống **độc lập với trang** — vẫn chạy cho push/sync khi không có tab nào mở.

### Vòng đời Service Worker (hay gặp bẫy)
```
install → (waiting) → activate → (chặn fetch)
```
- **install**: thường precache assets.
- **waiting**: SW mới **không** kích hoạt ngay nếu SW cũ còn điều khiển tab → cần
  `skipWaiting()` + `clients.claim()` để cập nhật ngay (cẩn thận: có thể gây mismatch phiên bản).
- Trang đang mở **vẫn do SW cũ điều khiển** cho tới khi tất cả tab đóng (hoặc claim).
- Các bẫy vòng đời (cache phiên bản cũ, update không ăn) sẽ học kỹ ở Level 6.

## So sánh nhanh

| | Web Worker | Service Worker |
|---|---|---|
| Mục đích | tính toán nặng off main thread | proxy mạng, offline, cache, push |
| Số lượng | nhiều, theo nhu cầu | một per scope, dùng chung mọi tab |
| Vòng đời | theo trang tạo ra nó | độc lập, install/activate, có thể bị kill |
| Chặn `fetch` của trang? | không | có (trong scope) |
| HTTPS bắt buộc? | không | có (trừ localhost) |
| DOM? | không | không |

## Checklist cho senior

- Web Worker để **không block UI**; giao tiếp structured clone, buffer lớn dùng Transferable.
- Service Worker là **proxy mạng**: offline/cache/push, event-driven, có thể bị kill.
- Biết vòng đời SW (install→waiting→activate) và vì sao update không ăn ngay.
- Cả hai **không** có DOM.

## References

- [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web.dev: Service Worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [Vite: Web Workers](https://vitejs.dev/guide/features.html#web-workers)
- [MDN: Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
