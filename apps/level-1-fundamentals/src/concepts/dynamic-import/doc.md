# Dynamic import & chunking

## `import()` — câu lệnh, không phải khai báo

`import ... from '...'` (tĩnh) được phân giải lúc **build**: bundler theo đồ thị phụ thuộc
và gộp vào chunk. `import('...')` (động) là một **biểu thức trả về Promise**, phân giải lúc
**runtime**:

```ts
const mod = await import('./pack.js'); // Promise<Module namespace>
mod.doSomething();
```

Vì là biểu thức, bạn có thể gọi nó có điều kiện, trong event handler, theo biến — điều mà
import tĩnh không làm được.

## Bundler tạo chunk như thế nào

Khi bundler (Vite/Rollup/webpack) thấy `import('X')`, nó cắt X (và phần phụ thuộc *chỉ* X cần)
thành một **chunk riêng**, kèm cơ chế tải runtime. Vài điểm cốt lõi:

- **Module được cache theo specifier**: gọi `import('./pack')` nhiều lần chỉ **tải mạng một
  lần**; các lần sau trả về cùng module đã nằm trong bộ nhớ (Promise resolve ngay).
- **Phụ thuộc chung được tách (shared chunk)**: nếu hai chunk động cùng dùng `lodash`, bundler
  thường tách `lodash` ra chunk chung để không lặp lại.
- **Tên/đường dẫn chunk có hash nội dung** để cache-busting (`pack.a1b2c3.js`).

## Chỉ dẫn cho bundler (magic comments)

Trình bundler hỗ trợ "magic comments" để điều khiển chunk:

```ts
// webpack
import(/* webpackChunkName: "editor" */ /* webpackPrefetch: true */ './Editor');
```

Vite dùng cú pháp riêng và `rollupOptions.output.manualChunks` / `build.rollupOptions` để
gom chunk; cũng có `import.meta.glob` để import động hàng loạt:

```ts
// Vite: gom nhiều file thành map các loader động
const pages = import.meta.glob('./pages/*.tsx'); // { './pages/a.tsx': () => import(...) }
```

## Phân biệt với "Code splitting"

- **Code splitting** là *chiến lược* (chia ở route/component/vendor) — concept trước.
- **Dynamic import chunking** là *cơ chế* tạo nên việc đó: cú pháp `import()`, cách bundler
  cắt & cache chunk, cách kiểm soát tên/preload.

## Cạm bẫy thực chiến

- **Không thể tree-shake import động theo biến hoàn toàn**: `import(\`./locale/\${name}.js\`)`
  buộc bundler đóng gói *mọi* file khớp pattern thành chunk lẻ. Cẩn thận với glob động quá rộng.
- **Waterfall**: `await import(A)` rồi bên trong mới `await import(B)` → tuần tự. Nếu biết
  trước, hãy `Promise.all([import(A), import(B)])` hoặc prefetch song song.
- **Xử lý lỗi tải**: chunk có thể 404 sau deploy (file đổi hash). Bọc `try/catch` quanh
  `await import()` (hoặc Error Boundary với `React.lazy`) và cho phép reload.
- **Race khi gọi nhiều lần**: gọi `import()` đồng thời nhiều lần là an toàn (cùng Promise),
  nhưng nếu bạn tự cache loader, hãy cache **Promise**, đừng để hai lần fetch song song.

## Prefetch chủ động

Tải trước chunk khi rảnh hoặc khi người dùng có ý định (hover), để click là sẵn sàng:

```ts
// chỉ kích hoạt việc tải, không cần dùng kết quả
const prefetch = () => { void import('./Editor'); };
button.addEventListener('mouseenter', prefetch);
// hoặc khi nhàn rỗi:
requestIdleCallback(() => void import('./Editor'));
```

## Checklist cho senior

- Hiểu `import()` là biểu thức trả Promise, phân giải runtime.
- Biết module được cache theo specifier (gọi nhiều lần, tải một lần).
- Biết cách tránh waterfall (`Promise.all`) và cách prefetch.
- Cẩn trọng với glob động làm phình số chunk.

## References

- [MDN: Dynamic import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [Vite: Glob Import](https://vitejs.dev/guide/features.html#glob-import)
- [webpack: import() & magic comments](https://webpack.js.org/api/module-methods/#magic-comments)
- [web.dev: Preload critical chunks / prefetch](https://web.dev/articles/route-prefetching-in-nextjs)
