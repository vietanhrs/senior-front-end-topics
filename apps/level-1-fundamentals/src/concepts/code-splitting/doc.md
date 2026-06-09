# Code splitting strategies

## Vấn đề

Một SPA gộp toàn bộ JS vào **một bundle khổng lồ** buộc người dùng tải + parse + execute mọi
thứ trước khi tương tác — kể cả code cho trang họ chưa bao giờ mở. Parse/compile JS là chi phí
**CPU** đáng kể trên thiết bị yếu, không chỉ là chi phí mạng.

**Code splitting** = chia bundle thành nhiều **chunk** nhỏ, chỉ tải khi cần. Mục tiêu: giảm
JS trên đường tới tương tác (TTI), tận dụng cache tốt hơn.

## Các chiến lược chia tách

### 1. Route-based splitting (phổ biến & hiệu quả nhất)
Mỗi route là một chunk. Vào `/dashboard` mới tải code dashboard.

```tsx
const Dashboard = lazy(() => import('./routes/Dashboard'));
const Settings = lazy(() => import('./routes/Settings'));

<Routes>
  <Route path="/dashboard" element={
    <Suspense fallback={<Spinner />}><Dashboard /></Suspense>
  } />
</Routes>
```

### 2. Component-based splitting
Tách component nặng/hiếm dùng: modal, editor (Monaco), biểu đồ (charting), map. Chỉ tải khi
người dùng mở.

### 3. Vendor / library splitting
Tách thư viện lớn ít đổi (React, Mantine…) ra chunk riêng để **cache lâu dài** — khi code app
đổi, người dùng không phải tải lại vendor.

### 4. Splitting theo tương tác / nhàn rỗi
Tải trước (prefetch) chunk khả năng dùng tới khi trình duyệt rảnh (`requestIdleCallback`),
hoặc khi hover vào link.

## React API

| API | Dùng cho |
|---|---|
| `React.lazy(() => import('...'))` | tạo component tải động |
| `<Suspense fallback={…}>` | UI chờ trong khi chunk tải |
| Error Boundary | bắt lỗi khi chunk **tải thất bại** (mạng rớt, deploy mới) |

> **Quan trọng:** `lazy` component **phải** nằm trong một `Suspense`. Và nên bọc Error
> Boundary — chunk có thể fail tải (đặc biệt sau khi deploy phiên bản mới làm đổi tên file
> hash → chunk cũ 404). Khi đó cần fallback "tải lại trang".

## Đánh đổi & cạm bẫy

- **Quá nhỏ → quá nhiều request**: chia vụn quá mức tạo waterfall nhiều round-trip, hại
  hơn lợi. Cân bằng kích thước chunk.
- **Loading waterfall**: chunk A tải xong mới biết cần chunk B → tải tuần tự. Khắc phục bằng
  **preload/prefetch** song song (xem concept "Dynamic import chunking" & "Resource Hints").
- **Layout shift**: fallback có kích thước khác nội dung thật → CLS. Giữ skeleton cùng kích thước.
- **Chunk-load error sau deploy**: cần chiến lược retry / reload.

## Đo lường

Dùng **Network tab** (xem các chunk `.js` tải theo nhu cầu), **Coverage tab** (% code không
dùng), và bundle analyzer (`rollup-plugin-visualizer` với Vite) để biết chia ở đâu.

## Checklist cho senior

- Mặc định: route-based splitting + tách component nặng.
- Luôn bọc `Suspense` + Error Boundary cho lazy component.
- Hiểu đánh đổi: số request vs kích thước chunk; tránh waterfall.
- Biết cách prefetch để khử độ trễ khi người dùng điều hướng.

## References

- [React: lazy](https://react.dev/reference/react/lazy)
- [React: Suspense](https://react.dev/reference/react/Suspense)
- [web.dev: Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
- [Vite: Build optimizations / chunking](https://vitejs.dev/guide/features.html#dynamic-import)
