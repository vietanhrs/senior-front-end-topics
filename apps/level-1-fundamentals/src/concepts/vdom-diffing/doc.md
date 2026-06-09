# Virtual DOM diffing complexity

## Vấn đề gốc

So sánh hai cây (tree) bất kỳ để tìm số phép biến đổi tối thiểu là bài toán có độ
phức tạp **O(n³)** (n = số node). Với UI hàng nghìn node, điều này là bất khả thi mỗi
lần render. Vì vậy React (và các framework Virtual DOM khác) **không giải bài toán tổng
quát** — chúng dùng **heuristics** để hạ xuống **O(n)**.

## Hai giả định (heuristics) của React

React giảm độ phức tạp bằng hai giả định thực dụng:

1. **Hai element khác `type` → vứt bỏ cả subtree, dựng lại từ đầu.**
   `<div>` đổi thành `<span>`, hay `<Counter>` đổi thành `<Profile>` → React unmount toàn
   bộ cây con cũ (mất hết state) và mount cây mới. Nó **không** cố "di chuyển" node giữa
   các type khác nhau.

2. **Với danh sách con, dùng `key` để nhận diện element qua các lần render.**
   `key` nói cho React biết "element này vẫn là element kia, chỉ đổi vị trí/props" — nhờ đó
   React **di chuyển** DOM thay vì huỷ + tạo lại.

```
Diff tổng quát:  O(n³)   ❌ quá đắt
React heuristic: O(n)    ✔ nhờ 2 giả định trên
```

## Tại sao `key` quan trọng đến vậy

Khi render danh sách, React duyệt song song con cũ và con mới theo `key`:

- `key` trùng → **giữ** instance, chỉ cập nhật props (giữ nguyên DOM, state, focus, scroll).
- `key` mới → **tạo** instance mới.
- `key` biến mất → **huỷ** instance cũ.

### Dùng `index` làm key — cái bẫy kinh điển

```tsx
{items.map((item, i) => <Row key={i} item={item} />)} // ❌
```

Khi bạn **chèn/xoá/sắp xếp lại** danh sách, `index` của mỗi phần tử thay đổi. React tưởng
"phần tử ở vị trí 0 vẫn là phần tử cũ" trong khi item đã khác → **state/DOM bị gắn nhầm**:

- Giá trị `input` đang gõ nhảy sang dòng khác.
- Checkbox tick nhầm item.
- Animation/giật, focus mất.

Chỉ an toàn dùng `index` khi danh sách **tĩnh** (không reorder, không thêm/bớt ở giữa).

### Dùng key ổn định, duy nhất

```tsx
{items.map((item) => <Row key={item.id} item={item} />)} // ✔
```

`key` phải **ổn định** (không đổi giữa các render), **duy nhất giữa anh em** (không cần
duy nhất toàn cục). Đừng dùng `Math.random()` làm key — mỗi render ra key mới → React huỷ
+ tạo lại toàn bộ, giết sạch hiệu năng và state.

## Diffing hoạt động theo từng mức (level-by-level)

React diff theo **breadth-first theo từng cấp**, không cố tìm node giống nhau ở cấp khác.
Đó là lý do "nhấc" một node lên cấp cha khác sẽ làm nó bị remount. Cấu trúc cây ổn định
→ diff rẻ.

## Liên hệ độ phức tạp

| Thao tác | Không key đúng | Có key đúng |
|---|---|---|
| Chèn 1 item đầu list (n phần tử) | cập nhật ~n node | chèn 1 node |
| Reorder | sai state + nhiều mutation | move, giữ state |
| Đổi type root | rebuild subtree | rebuild subtree (không tránh được) |

## Checklist cho senior

- Nắm vì sao O(n³) → O(n): hai giả định type & key.
- `key` ổn định + duy nhất giữa siblings; **không** dùng index khi list động; **không** dùng random.
- Đổi `type` = mất state subtree (đôi khi cố ý dùng để reset state bằng cách đổi `key`).
- Reconciliation chi tiết (Fiber, double buffering) sẽ học ở Level 2.

## References

- [React: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React (legacy docs): Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
- [React: Rendering Lists & keys](https://react.dev/learn/rendering-lists)
- [Why you need keys (Dan Abramov)](https://twitter.com/dan_abramov/status/1415279090446204929)
