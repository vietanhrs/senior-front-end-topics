import { useMemo, useState } from 'react';
import { Badge, Code, Group, SegmentedControl, Select, Stack, Text, Textarea } from '@mantine/core';
import { Callout, DemoCard } from '../../workbook/ui';

const DEFAULT_PAYLOAD = `<img src=x onerror="document.body.innerHTML='💥 XSS đã chạy: đây là nơi script của kẻ tấn công đọc cookie/DOM của bạn';document.body.style.cssText='background:#7f1d1d;color:#fff;padding:12px;font-family:sans-serif'">`;

/**
 * Naive sanitizer for teaching ONLY — strips <script> and on* handlers via
 * regex. Real apps MUST use DOMPurify; regex-based HTML sanitizing is unsafe.
 */
function naiveSanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
}

function SandboxFrame({ html, title }: { html: string; title: string }) {
  // sandbox="allow-scripts" (KHÔNG allow-same-origin): script chạy được nhưng ở
  // origin "opaque" cô lập — không đọc được cookie/parent. Đủ để DEMO an toàn.
  return (
    <iframe
      title={title}
      sandbox="allow-scripts"
      srcDoc={html}
      className="h-28 w-full rounded border"
      style={{ background: '#fff' }}
    />
  );
}

function CsrfSimulator() {
  const [sameSite, setSameSite] = useState<'Strict' | 'Lax' | 'None'>('Lax');
  const [scenario, setScenario] = useState('toplevel-get');

  const sent = useMemo(() => {
    if (sameSite === 'None') return true; // gửi với mọi cross-site (cần Secure)
    if (sameSite === 'Strict') return false; // không gửi với bất kỳ cross-site nào
    // Lax: chỉ gửi với điều hướng top-level GET
    return scenario === 'toplevel-get';
  }, [sameSite, scenario]);

  return (
    <Stack gap="md">
      <Group grow>
        <div>
          <Text size="sm" fw={500} mb={4}>
            Cookie SameSite
          </Text>
          <SegmentedControl
            fullWidth
            value={sameSite}
            onChange={(v) => setSameSite(v as typeof sameSite)}
            data={['Strict', 'Lax', 'None']}
          />
        </div>
        <Select
          label="Request cross-site từ evil.com tới bank.com"
          value={scenario}
          onChange={(v) => setScenario(v ?? 'toplevel-get')}
          data={[
            { value: 'toplevel-get', label: 'Click link (top-level GET)' },
            { value: 'form-post', label: 'Auto-submit <form method=POST>' },
            { value: 'subresource', label: '<img>/fetch ngầm tới endpoint' },
          ]}
        />
      </Group>
      <Badge size="lg" color={sent ? 'red' : 'teal'} variant="filled">
        {sent ? 'Cookie phiên ĐƯỢC gửi → CSRF có thể thành công' : 'Cookie KHÔNG gửi → CSRF bị chặn'}
      </Badge>
      <Text size="xs" c="dimmed">
        Lax (mặc định): chỉ gửi với điều hướng top-level GET. POST/subresource cross-site không
        kèm cookie → chặn được phần lớn CSRF cổ điển. None bắt buộc Secure (HTTPS).
      </Text>
    </Stack>
  );
}

export function Demo() {
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);

  return (
    <Stack gap="md">
      <Callout kind="warning" title="XSS — demo chạy trong iframe cô lập">
        Payload thực thi bên trong <code>&lt;iframe sandbox="allow-scripts"&gt;</code> nên KHÔNG
        đọc được cookie/DOM của trang workbook. Trong một trang thật mà bạn nhúng thẳng HTML này
        bằng <code>dangerouslySetInnerHTML</code>, nó sẽ chạy dưới <b>origin của bạn</b> và đọc
        được cookie/session.
      </Callout>

      <DemoCard title="Nhập payload (giả lập input người dùng)">
        <Textarea
          autosize
          minRows={2}
          value={payload}
          onChange={(e) => setPayload(e.currentTarget.value)}
        />
      </DemoCard>

      <Group grow align="stretch">
        <DemoCard title="① React {payload} — escape mặc định" right={<Badge color="teal">An toàn</Badge>}>
          <Text size="sm" c="dimmed" mb="xs">
            React hiển thị như text, không parse thành HTML:
          </Text>
          <Code block>{payload}</Code>
        </DemoCard>

        <DemoCard
          title="② dangerouslySetInnerHTML (chưa sanitize)"
          right={<Badge color="red">Lỗ hổng</Badge>}
        >
          <SandboxFrame title="vulnerable" html={payload} />
        </DemoCard>
      </Group>

      <DemoCard
        title="③ Sanitize trước khi render"
        right={<Badge color="teal">An toàn (đã lọc)</Badge>}
      >
        <Text size="sm" c="dimmed" mb="xs">
          Sau khi loại <code>&lt;script&gt;</code> và thuộc tính <code>on*</code> (demo dùng
          regex; thực tế hãy dùng DOMPurify):
        </Text>
        <SandboxFrame title="sanitized" html={naiveSanitize(payload) || '(rỗng sau khi lọc)'} />
        <Code block mt="xs">
          {naiveSanitize(payload) || '(rỗng)'}
        </Code>
      </DemoCard>

      <DemoCard title="CSRF — SameSite cookie quyết định cookie có được gửi không">
        <CsrfSimulator />
      </DemoCard>
    </Stack>
  );
}
