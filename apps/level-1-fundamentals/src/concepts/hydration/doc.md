# Hydration

## Định nghĩa ngắn gọn

**Hydration** là quá trình client-side JavaScript "gắn" (attach) event handlers và
khôi phục state của một cây React (hay framework khác) lên trên **HTML tĩnh đã được
render sẵn từ server** (SSR/SSG), để biến HTML "chết" thành UI tương tác mà
**không vẽ lại (re-create) DOM từ đầu**.

```
SSR/SSG:  Server  ──render──▶  HTML string  ──gửi──▶  Browser hiển thị ngay (FCP nhanh)
                                                          │ (chưa click được)
Hydration: Client tải JS ──▶ React dựng lại Virtual DOM ──▶ so khớp với DOM có sẵn
                                                          │
                                                          ▼
                                                  Gắn event listeners → tương tác được
```

## Tại sao cần hydration?

SSR cho ta **First Contentful Paint (FCP)** và **SEO** tốt vì người dùng thấy nội
dung ngay, không phải chờ JS chạy. Nhưng HTML từ server không có event listener, không
có state — nó "chết". Hydration là cây cầu nối giữa HTML tĩnh và app tương tác.

Điểm mấu chốt mà nhiều người mơ hồ: **giữa lúc HTML hiển thị và lúc hydration xong, UI
trông như đã sẵn sàng nhưng click/typing không ăn**. Khoảng này gọi là
**"uncanny valley"** của SSR. Nếu bundle JS lớn, khoảng trễ này dài → người dùng bấm mà
không phản hồi.

## React: `hydrateRoot` vs `createRoot`

| | `createRoot` (CSR) | `hydrateRoot` (SSR) |
|---|---|---|
| DOM ban đầu | rỗng (`<div id="root"></div>`) | đã có HTML từ server |
| Hành vi | tạo mới toàn bộ DOM | tái sử dụng DOM, chỉ gắn listeners |
| Yêu cầu | không | render đầu tiên của client **phải khớp** với HTML server |

```tsx
// Client entry cho app SSR
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root')!, <App />);
```

## Hydration mismatch — lỗi kinh điển

React giả định render đầu tiên ở client **giống hệt** HTML server. Nếu khác, bạn nhận
warning *"Hydration failed... server rendered HTML didn't match the client"* và React
sẽ phải sửa DOM (tốn kém), thậm chí vứt bỏ và render lại cả subtree.

Nguyên nhân phổ biến:

- **Giá trị không tất định**: `Date.now()`, `Math.random()`, `new Date().toLocaleString()`
  (khác timezone/locale giữa server và client).
- **Truy cập browser-only API khi render**: `window`, `localStorage`, `navigator`.
- **HTML không hợp lệ**: `<p><div/></p>` bị trình duyệt tự sửa cấu trúc.
- **Nội dung phụ thuộc `typeof window`** rẽ nhánh khác nhau hai phía.

Cách xử lý đúng:

```tsx
// Pattern: render giống server ở lần đầu, cập nhật sau khi mounted
function ClientOnlyTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    setTime(new Date().toLocaleTimeString()); // chỉ chạy ở client, SAU hydration
  }, []);
  return <span>{time ?? 'Đang tải…'}</span>; // lần đầu khớp server
}
```

Hoặc dùng `suppressHydrationWarning` cho các node thực sự không thể tránh khác biệt
(ví dụ timestamp), nhưng đây là "lối thoát hiểm", không phải giải pháp mặc định.

## Các biến thể hiện đại (đặt nền cho Level 2)

- **Partial / Selective hydration**: chỉ hydrate phần cần tương tác, theo độ ưu tiên
  (React 18 + Suspense). Sẽ học sâu ở Level 2.
- **Progressive hydration**: hydrate dần theo viewport/tương tác.
- **Islands architecture** (Astro, Fresh): phần lớn trang là HTML tĩnh, chỉ vài "đảo"
  được hydrate.
- **Resumability** (Qwik): tránh hydration hoàn toàn bằng cách "serialize" trạng thái và
  "resume" thay vì "replay".

## Checklist cho senior

- Hiểu hydration là **gắn listeners lên DOM có sẵn**, không phải vẽ lại.
- Biết FCP đến từ SSR còn **TTI (Time To Interactive)** mới đến sau hydration.
- Tránh mọi giá trị không tất định trong lần render đầu.
- Biết khi nào dùng `useEffect` để defer logic browser-only.

## References

- [React: `hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React: Common hydration mismatch causes](https://react.dev/link/hydration-mismatch)
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- [Patterns.dev: Progressive & Selective Hydration](https://www.patterns.dev/react/progressive-hydration/)
- [Qwik: Resumability vs Hydration](https://qwik.dev/docs/concepts/resumable/)
