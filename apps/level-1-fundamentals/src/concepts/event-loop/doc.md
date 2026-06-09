# Event loop: macrotasks vs microtasks

## Mô hình tinh thần

JavaScript chạy **single-threaded**: một call stack, một luồng. Để xử lý bất đồng bộ mà
không block, runtime dùng **event loop** điều phối giữa **call stack** và hai loại hàng đợi:

```
        ┌─────────────┐
        │  Call Stack │  ← chạy code đồng bộ tới khi rỗng
        └─────────────┘
              │ (stack rỗng)
              ▼
   ┌────────────────────────┐
   │  Microtask queue        │  ← XẢ SẠCH toàn bộ trước khi qua bước sau
   │  (Promise.then,         │
   │   queueMicrotask,        │
   │   MutationObserver)      │
   └────────────────────────┘
              │
              ▼
   ┌────────────────────────┐   (thường) render / paint
   │  Macrotask queue        │  ← lấy ĐÚNG 1 task mỗi vòng
   │  (setTimeout, events,    │
   │   message, I/O)          │
   └────────────────────────┘
```

## Quy tắc vàng

1. Chạy hết code đồng bộ (call stack về rỗng).
2. **Xả sạch toàn bộ microtask queue** — kể cả microtask mới được thêm trong lúc xả.
3. (Trình duyệt có thể) render.
4. Lấy **một** macrotask, chạy nó → quay lại bước 2.

Hệ quả quan trọng nhất: **microtask luôn chạy trước macrotask kế tiếp**, và một microtask
có thể "chen" thêm microtask khác làm trễ cả render.

## Ví dụ kinh điển

```js
console.log('1: script start');           // sync

setTimeout(() => console.log('2: setTimeout'), 0); // macrotask

Promise.resolve().then(() => console.log('3: promise')); // microtask

queueMicrotask(() => console.log('4: queueMicrotask'));   // microtask

console.log('5: script end');             // sync

// Thứ tự in: 1 → 5 → 3 → 4 → 2
// sync trước (1,5), xả microtask (3,4), rồi mới tới macrotask (2)
```

## Vì sao đây là kiến thức "không được mơ hồ"

- **`await` = microtask**: phần code sau `await` được xếp vào microtask queue. Nhiều bug
  ordering đến từ việc nghĩ `await` đồng bộ.
- **Microtask starvation**: nếu một microtask liên tục `queueMicrotask` thêm cái mới, event
  loop **không bao giờ** tới được macrotask/render → UI treo dù không có vòng lặp vô hạn rõ ràng.
- **`setTimeout(fn, 0)` không phải "ngay lập tức"**: nó là macrotask, chạy sau toàn bộ
  microtask hiện có, và bị clamp tối thiểu (~4ms khi lồng sâu).
- **Render xen giữa các macrotask**: muốn để trình duyệt vẽ trước khi làm việc nặng tiếp,
  hãy nhường bằng macrotask (`setTimeout`/`MessageChannel`/`scheduler.postTask`), không phải microtask.

## `requestAnimationFrame` đứng ở đâu?

`rAF` callbacks chạy **ngay trước paint**, sau microtask của frame đó. Dùng cho công việc
liên quan tới vẽ/animation. Không phải micro cũng không phải macro queue thông thường.

## Microtask vs Macrotask — bảng tra nhanh

| Nguồn | Loại |
|---|---|
| `Promise.then/catch/finally`, `await` | microtask |
| `queueMicrotask` | microtask |
| `MutationObserver` | microtask |
| `setTimeout`, `setInterval` | macrotask |
| `MessageChannel`, `postMessage` | macrotask |
| DOM events, `setImmediate` (Node) | macrotask |
| `requestAnimationFrame` | trước paint (riêng) |

## Pattern thực chiến

- **Nhường luồng để không block UI**: chia việc nặng thành nhiều macrotask
  (`setTimeout`/`MessageChannel`), hoặc đẩy sang Web Worker (xem concept "Web/Service Workers").
- **Gom cập nhật sau microtask**: dùng microtask khi muốn chạy "sau code đồng bộ hiện tại
  nhưng trước khi nhường cho trình duyệt" (vd React batch updates).
- **Tránh starvation**: đừng đệ quy bằng microtask cho việc dài; dùng macrotask để cho phép render.

## Checklist cho senior

- Giải thích đúng thứ tự sync → microtask (xả sạch) → render → 1 macrotask.
- Biết `await` tạo microtask; biết hậu quả ordering.
- Biết starvation và cách nhường luồng bằng macrotask.
- Phân biệt `rAF` với micro/macro.

## References

- [Jake Archibald: Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
- [MDN: The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)
- [HTML spec: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [MDN: queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask)
