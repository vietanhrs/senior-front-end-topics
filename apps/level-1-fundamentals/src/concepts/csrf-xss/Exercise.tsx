import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const buggy = `// Component hiển thị bio (HTML do người dùng tự nhập) và avatar.
// Có lỗ hổng XSS. Hãy chỉ ra và sửa, giữ được định dạng cơ bản (in đậm, link).
function Profile({ user }) {
  return (
    <div>
      <h2>{user.name}</h2>
      {/* bio cho phép chút HTML */}
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
      <img src={user.avatarUrl} alt="avatar" />
    </div>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: bịt lỗ hổng XSS trong Profile"
        description="user.bio đến từ input người dùng và được render thẳng bằng dangerouslySetInnerHTML. Hãy sửa để vẫn cho phép một ít định dạng nhưng không thể chèn script."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Gợi ý">
        Nếu không cần HTML → để React escape (<code>{'{user.bio}'}</code>). Nếu cần định dạng →
        sanitize bằng DOMPurify với allowlist tag/attr. Đừng quên các sink khác (vd{' '}
        <code>avatarUrl</code> kiểu <code>javascript:</code>).
      </Callout>

      <SolutionReveal
        code={`import DOMPurify from 'dompurify';

function Profile({ user }) {
  // Chỉ cho phép một ít tag định dạng, không cho script/handler.
  const safeBio = DOMPurify.sanitize(user.bio, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });

  // Chặn URL scheme nguy hiểm (javascript:, data:) cho avatar.
  const safeAvatar = /^https?:\\/\\//.test(user.avatarUrl) ? user.avatarUrl : '/default.png';

  return (
    <div>
      <h2>{user.name}</h2>{/* React tự escape name */}
      <div dangerouslySetInnerHTML={{ __html: safeBio }} />
      <img src={safeAvatar} alt="avatar" />
    </div>
  );
}

// Phòng thủ theo lớp: thêm CSP + Trusted Types ở tầng app (Level 6),
// đặt cookie phiên HttpOnly để XSS không đọc được session.`}
      />
    </Stack>
  );
}
