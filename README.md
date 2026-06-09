# Senior Front-end Topics

Tài liệu & bài tập ôn luyện kiến thức **Front-end chuyên sâu** cho Senior. Mỗi *level* là một
**SPA workbook tương tác** riêng (Bun + React + TypeScript + Vite + Tailwind + Mantine), trong
đó mỗi *concept* gồm 3 phần:

- **Lý thuyết** — tài liệu markdown đủ sâu để hiểu rõ + references tới nguồn online.
- **Demo** — ví dụ **tương tác, quan sát được trong trình duyệt** (mở DevTools để thấy rõ).
- **Bài tập** — code cần hoàn thiện/sửa/cải tiến, kèm lời giải có thể mở ra đối chiếu.

## Cấu trúc repo (Bun workspaces monorepo)

```
senior-front-end-topics/
├── package.json                 # workspace root
├── apps/
│   └── level-1-fundamentals/    # ✅ SPA workbook Level 1 (đầy đủ 10 concepts)
│       └── src/
│           ├── workbook/        # "engine" dùng chung: layout, registry, doc renderer, UI
│           └── concepts/<slug>/ # mỗi concept: doc.md + Demo.tsx + Exercise.tsx + index.ts
└── packages/                    # (dành cho code dùng chung sau này)
```

Mỗi level sau sẽ là một workspace app mới (`apps/level-2-...`, …) theo đúng khuôn mẫu của
Level 1.

## Chạy thử

Yêu cầu: **Bun ≥ 1.3**.

```bash
bun install           # cài deps cho toàn workspace
bun run dev           # chạy Level 1 (Vite dev server)
# hoặc trực tiếp:
bun run --filter level-1-fundamentals dev
bun run --filter level-1-fundamentals build
```

## Lộ trình (10 levels — đang bổ sung dần)

| Level | Chủ đề | Trạng thái |
|---|---|---|
| 1 | Fundamentals (cơ bản nhưng không mơ hồ) | ✅ Hoàn thành |
| 2 | React Core & Rendering Mechanics | 🔜 |
| 3 | Browser Performance | 🔜 |
| 4 | Advanced Data & State management | 🔜 |
| 5 | Caching & Networking strategies | 🔜 |
| 6 | Security | 🔜 |
| 7–10 | (sẽ bổ sung sau) | 🔜 |

### Level 1 — Fundamentals (10 concepts)

1. **Hydration** — gắn event handlers/state lên HTML render sẵn từ server.
2. **Virtual DOM diffing complexity** — O(n³) → O(n) nhờ heuristic type + key.
3. **Event loop (macro vs microtasks)** — thứ tự thực thi async.
4. **Critical rendering path** — DOM/CSSOM → render tree → layout → paint.
5. **Code splitting strategies** — chia bundle theo route/component/vendor.
6. **Dynamic import chunking** — `import()`, cách bundler cắt & cache chunk.
7. **Preload vs Prefetch vs Preconnect** — resource hints đúng chỗ.
8. **CORS preflight** — khi nào trình duyệt tự gửi OPTIONS.
9. **CSRF vs XSS mitigation** — phân biệt & cách phòng thủ.
10. **Web workers vs Service workers** — off-main-thread vs proxy mạng/offline.

## Tech stack

Bun · React 19 · TypeScript · Vite · Tailwind CSS v4 · Mantine v8 · React Router.
