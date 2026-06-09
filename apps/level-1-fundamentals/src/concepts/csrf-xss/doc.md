# CSRF vs XSS mitigation

Hai lỗ hổng kinh điển, hay bị nhầm lẫn. Hiểu rạch ròi "ai tin ai" là chìa khoá.

## XSS — Cross-Site Scripting

**Kẻ tấn công chèn được JS chạy trong trang của bạn**, dưới origin của bạn → đọc được
cookie/localStorage, DOM, gọi API thay người dùng. Gốc rễ: **dữ liệu không tin cậy bị xử lý
như mã/markup**.

### Ba loại XSS
- **Stored**: payload lưu ở server (comment, profile) rồi phát lại cho mọi người xem.
- **Reflected**: payload nằm trong URL/param và bị phản chiếu vào trang.
- **DOM-based**: lỗ hổng nằm hoàn toàn ở client, do JS lấy dữ liệu (location.hash…) và
  ghi thẳng vào DOM (`innerHTML`, `document.write`).

### Mitigation XSS (theo thứ tự ưu tiên)
1. **Mã hoá/đặt đúng ngữ cảnh khi xuất ra (output encoding)**. React **mặc định escape** mọi
   `{value}` → an toàn. Đừng phá vỡ điều này.
2. **Tránh `dangerouslySetInnerHTML` / `innerHTML`** với dữ liệu không tin cậy. Nếu buộc phải
   render HTML, **sanitize** bằng thư viện đã kiểm chứng (DOMPurify).
3. **CSP (Content-Security-Policy)**: chặn inline script & nguồn script lạ → giảm thiệt hại dù
   có lỗ hổng (Level 6).
4. **Trusted Types**: ép mọi sink nguy hiểm (`innerHTML`…) chỉ nhận giá trị đã qua policy (Level 6).
5. **`HttpOnly` cookie**: JS không đọc được cookie phiên → giảm hậu quả ăn cắp session.

```tsx
// ❌ Lỗ hổng XSS: render HTML từ người dùng
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// ✔ An toàn: React escape, hiển thị như text
<div>{userComment}</div>

// ✔ Nếu cần HTML: sanitize trước
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userHtml) }} />
```

## CSRF — Cross-Site Request Forgery

**Kẻ tấn công khiến trình duyệt nạn nhân gửi request *có credentials* tới site bạn**, lợi dụng
việc cookie được **tự động đính kèm** theo origin đích. Nạn nhân chỉ cần đang đăng nhập và truy
cập trang độc hại (form auto-submit, `<img>` tới endpoint GET có side-effect…). Khác XSS: kẻ tấn
công **không** chạy được JS trong trang bạn, chỉ "mượn" cookie phiên.

### Mitigation CSRF
1. **SameSite cookie** (phòng tuyến chính hiện nay):
   - `Strict`: cookie **không** gửi với bất kỳ request cross-site nào (kể cả click link sang).
   - `Lax` (mặc định của trình duyệt hiện đại): gửi với điều hướng **top-level GET** (click link),
     **không** gửi với POST cross-site / request ngầm (img, fetch).
   - `None`: gửi với mọi cross-site, **bắt buộc** kèm `Secure` (HTTPS).
2. **Anti-CSRF token**: server phát token gắn vào form/header (`X-CSRF-Token`); request giả
   không biết token → bị từ chối. Mẫu phổ biến: *double-submit cookie* hoặc *synchronizer token*.
3. **Kiểm tra `Origin`/`Referer`** ở server cho request thay đổi trạng thái.
4. **Không dùng GET cho thao tác có side-effect** (GET phải idempotent/an toàn).
5. **Custom header + CORS**: yêu cầu header tuỳ biến (vd `X-Requested-With`) → buộc preflight,
   request cross-site đơn giản không gắn được.

```
SameSite=Lax (mặc định):
  ✔ Người dùng click link tới bank.com (GET top-level)   -> cookie gửi
  ✘ evil.com auto-submit <form method=POST> tới bank.com -> cookie KHÔNG gửi
  ✘ evil.com <img src="bank.com/transfer?...">           -> cookie KHÔNG gửi
```

## XSS vs CSRF — phân biệt nhanh

| | XSS | CSRF |
|---|---|---|
| Bản chất | chạy mã lạ trong origin của bạn | mượn cookie để gửi request thay người dùng |
| Cần JS chạy trong trang bạn? | có | không |
| Phòng thủ chính | output encoding, sanitize, CSP, Trusted Types | SameSite, CSRF token, kiểm tra Origin |
| `HttpOnly` giúp? | giảm hậu quả (mất cookie) | không liên quan trực tiếp |
| **Lưu ý nặng đô** | **XSS phá vỡ mọi phòng thủ CSRF** (token đọc được bằng JS) | — |

> Hệ quả quan trọng: nếu site **đã dính XSS**, thì CSRF token vô dụng (script lấy được token).
> Vì vậy phòng XSS là nền tảng.

## Checklist cho senior

- Phân biệt được "ai tin ai": XSS = mã lạ trong origin bạn; CSRF = mượn credentials.
- Mặc định dựa vào React escaping; chỉ dùng `dangerouslySetInnerHTML` với dữ liệu đã sanitize.
- SameSite (Lax mặc định) + token cho thao tács side-effect.
- Hiểu vì sao XSS làm vô hiệu hoá phòng thủ CSRF.

## References

- [OWASP: XSS](https://owasp.org/www-community/attacks/xss/)
- [OWASP: CSRF & Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [React: dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [web.dev: SameSite cookies explained](https://web.dev/articles/samesite-cookies-explained)
- [DOMPurify](https://github.com/cure53/DOMPurify)
