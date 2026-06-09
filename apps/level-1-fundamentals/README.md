# Level 1 — Fundamentals

SPA workbook tương tác cho 10 concept nền tảng. Stack: Bun · React 19 · TypeScript · Vite ·
Tailwind v4 · Mantine v8 · React Router (hash router để deploy tĩnh dễ dàng).

## Chạy

```bash
bun install                  # (chạy ở repo root)
bun run --filter level-1-fundamentals dev      # dev server
bun run --filter level-1-fundamentals build    # type-check + production build
```

## Kiến trúc

```
src/
├── main.tsx               # MantineProvider + mount; gom toàn bộ import CSS
├── index.css              # thứ tự CSS layer: @layer mantine, tw-utils (Tailwind không reset Mantine)
├── App.tsx                # createHashRouter
├── workbook/              # "engine" tái sử dụng được cho các level sau
│   ├── types.ts           # ConceptModule, LevelMeta
│   ├── curriculum.ts      # roadmap đầy đủ (hiển thị ở sidebar)
│   ├── Layout.tsx         # AppShell + nav
│   ├── Overview.tsx       # trang tổng quan
│   ├── ConceptPage.tsx    # tabs Lý thuyết / Demo / Bài tập + điều hướng prev/next
│   ├── DocView.tsx        # render markdown (react-markdown + Mantine CodeHighlight)
│   └── ui.tsx             # DemoCard, Callout, LogConsole+useLogger, SolutionReveal
└── concepts/
    ├── index.ts           # LEVEL registry (ráp 10 concept)
    └── <slug>/
        ├── doc.md         # lý thuyết (import ?raw)
        ├── Demo.tsx       # demo tương tác
        ├── Exercise.tsx   # bài tập + lời giải
        └── index.ts       # export ConceptModule
```

## Thêm một concept mới

1. Tạo thư mục `src/concepts/<slug>/` với `doc.md`, `Demo.tsx`, `Exercise.tsx`, `index.ts`.
2. Trong `index.ts`, export một `ConceptModule` (xem `types.ts`).
3. Thêm vào mảng `concepts` trong `src/concepts/index.ts`.

Layout, routing, tabs, doc renderer tự động áp dụng — không cần đụng gì thêm.

## Lưu ý kỹ thuật đáng chú ý

- **Tailwind + Mantine cùng tồn tại**: khai báo `@layer mantine, tw-utils` và **bỏ Preflight**
  của Tailwind để không reset style Mantine (xem `index.css`).
- **Code splitting quan sát được**: `HeavyWidget`, `mathPack`, `heavy.worker` được Vite tách
  thành chunk riêng — thấy rõ trong Network tab và output build.
- **Web Worker**: dùng cú pháp `new Worker(new URL('./x.worker.ts', import.meta.url), { type:
  'module' })` mà Vite hỗ trợ sẵn.
