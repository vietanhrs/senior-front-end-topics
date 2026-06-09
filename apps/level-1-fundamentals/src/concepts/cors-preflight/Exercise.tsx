import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const buggy = `// Predicate này quyết định request có cần preflight không.
// Có 3 lỗi khiến nó phân loại SAI. Hãy tìm và sửa.
function isSimpleRequest({ method, contentType, headers }) {
  const simpleMethods = ['GET', 'POST'];            // (1)
  const safelistCT = ['application/json'];          // (2)
  const safeHeaders = ['accept', 'content-type'];

  if (!simpleMethods.includes(method)) return false;
  if (!safelistCT.includes(contentType)) return false;
  // (3) so sánh phân biệt hoa thường
  if (headers.some((h) => !safeHeaders.includes(h))) return false;
  return true;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: sửa predicate phân loại simple vs preflight"
        description="Hàm dưới có 3 lỗi làm phân loại sai (đặc biệt với application/json và HEAD). Hãy tìm và sửa."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Gợi ý">
        (1) Còn thiếu method nào trong nhóm simple? (2) <code>application/json</code> có thực
        sự safelisted không? (3) Tên header HTTP không phân biệt hoa/thường.
      </Callout>

      <SolutionReveal
        language="js"
        notes="Ba lỗi: thiếu HEAD; application/json KHÔNG safelisted (đảo ngược ý nghĩa danh sách); cần so sánh lowercase."
        code={`function isSimpleRequest({ method, contentType, headers }) {
  const simpleMethods = ['GET', 'HEAD', 'POST'];          // (1) thêm HEAD

  // (2) đây là các Content-Type ĐƯỢC safelist; json KHÔNG nằm trong đó
  const safelistCT = [
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ];
  const safeHeaders = ['accept', 'accept-language', 'content-language',
                       'content-type', 'range'];

  if (!simpleMethods.includes(method.toUpperCase())) return false;
  if (!safelistCT.includes(contentType)) return false;

  // (3) chuẩn hoá lowercase trước khi so sánh
  if (headers.some((h) => !safeHeaders.includes(h.toLowerCase()))) return false;

  return true;
}

// Hệ quả: fetch(PUT|DELETE), hay POST với Content-Type: application/json,
// hay có header Authorization -> đều CẦN preflight.`}
      />
    </Stack>
  );
}
