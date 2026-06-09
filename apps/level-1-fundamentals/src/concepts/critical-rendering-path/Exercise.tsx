import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const before = `<!doctype html>
<html>
  <head>
    <!-- analytics chặn parser dù chẳng cần cho first paint -->
    <script src="/analytics.js"></script>

    <!-- toàn bộ CSS render-blocking, kể cả phần dưới màn hình -->
    <link rel="stylesheet" href="/all.css" />

    <!-- app bundle nặng, đồng bộ, đặt trên cùng -->
    <script src="/app.bundle.js"></script>
  </head>
  <body>
    <main>...</main>
  </body>
</html>`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: tối ưu Critical Rendering Path của <head>"
        description="<head> dưới đây làm FCP rất chậm. Hãy chỉ ra 3 vấn đề và viết lại để first paint nhanh nhất có thể mà không đổi hành vi."
      >
        <CodeHighlight code={before} language="html" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Gợi ý — tự trả lời trước khi mở lời giải">
        (1) analytics có cần chạy trước first paint không? (2) toàn bộ CSS có thực sự
        render-blocking cần thiết không? (3) app bundle đồng bộ trong <code>&lt;head&gt;</code>
        ảnh hưởng gì tới parser?
      </Callout>

      <SolutionReveal
        language="html"
        notes="Ý chính: tách critical CSS, dùng defer/async đúng chỗ, không để script độc lập chặn parser."
        code={`<!doctype html>
<html>
  <head>
    <!-- 1) Inline critical CSS cho above-the-fold -> paint sớm -->
    <style>/* critical css ngắn gọn */</style>

    <!-- 2) Phần CSS còn lại: nạp không chặn render
            (preload + onload đổi thành stylesheet) -->
    <link rel="preload" href="/rest.css" as="style"
          onload="this.rel='stylesheet'" />

    <!-- 3) App bundle: defer -> không chặn parser, vẫn giữ thứ tự,
            chạy trước DOMContentLoaded -->
    <script src="/app.bundle.js" defer></script>

    <!-- 4) Analytics độc lập, không cần thứ tự, không cần DOM:
            async -> tải/chạy bất kỳ lúc nào, không chặn -->
    <script src="/analytics.js" async></script>
  </head>
  <body>
    <main>...</main>
  </body>
</html>`}
      />
    </Stack>
  );
}
