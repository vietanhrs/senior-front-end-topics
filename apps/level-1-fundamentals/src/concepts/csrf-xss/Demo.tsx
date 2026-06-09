import { useMemo, useState } from 'react';
import { Badge, Code, Group, SegmentedControl, Select, Stack, Text, Textarea } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const DEFAULT_PAYLOAD = `<img src=x onerror="document.body.innerHTML='💥 XSS executed: this is where the attacker script reads your cookies/DOM';document.body.style.cssText='background:#7f1d1d;color:#fff;padding:12px;font-family:sans-serif'">`;

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
  // sandbox="allow-scripts" (NO allow-same-origin): scripts can run but in an
  // isolated "opaque" origin — they can't read cookies/parent. Safe to DEMO.
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
    if (sameSite === 'None') return true; // sent on all cross-site (requires Secure)
    if (sameSite === 'Strict') return false; // not sent on any cross-site request
    // Lax: only sent on top-level GET navigations
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
          label="Cross-site request from evil.com to bank.com"
          value={scenario}
          onChange={(v) => setScenario(v ?? 'toplevel-get')}
          data={[
            { value: 'toplevel-get', label: 'Click a link (top-level GET)' },
            { value: 'form-post', label: 'Auto-submit <form method=POST>' },
            { value: 'subresource', label: '<img>/fetch background request' },
          ]}
        />
      </Group>
      <Badge size="lg" color={sent ? 'red' : 'teal'} variant="filled">
        {sent ? 'Session cookie IS sent → CSRF could succeed' : 'Cookie NOT sent → CSRF blocked'}
      </Badge>
      <Text size="xs" c="dimmed">
        Lax (default): only sent on top-level GET navigations. Cross-site POST/subresource
        requests carry no cookie → blocks most classic CSRF. None requires Secure (HTTPS).
      </Text>
    </Stack>
  );
}

export function Demo() {
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);

  return (
    <Stack gap="md">
      <Callout kind="warning" title="XSS — demo runs in an isolated iframe">
        The payload executes inside an <code>&lt;iframe sandbox="allow-scripts"&gt;</code>, so it
        CANNOT read the workbook's cookies/DOM. In a real page that injects this HTML directly via{' '}
        <code>dangerouslySetInnerHTML</code>, it would run under <b>your origin</b> and could read
        cookies/session.
      </Callout>

      <DemoCard title="Enter a payload (simulating user input)">
        <Textarea
          autosize
          minRows={2}
          value={payload}
          onChange={(e) => setPayload(e.currentTarget.value)}
        />
      </DemoCard>

      <Group grow align="stretch">
        <DemoCard title="① React {payload} — escaped by default" right={<Badge color="teal">Safe</Badge>}>
          <Text size="sm" c="dimmed" mb="xs">
            React displays it as text, not parsed as HTML:
          </Text>
          <Code block>{payload}</Code>
        </DemoCard>

        <DemoCard
          title="② dangerouslySetInnerHTML (not sanitized)"
          right={<Badge color="red">Vulnerable</Badge>}
        >
          <SandboxFrame title="vulnerable" html={payload} />
        </DemoCard>
      </Group>

      <DemoCard
        title="③ Sanitize before rendering"
        right={<Badge color="teal">Safe (filtered)</Badge>}
      >
        <Text size="sm" c="dimmed" mb="xs">
          After stripping <code>&lt;script&gt;</code> and <code>on*</code> attributes (this demo
          uses regex; in practice use DOMPurify):
        </Text>
        <SandboxFrame title="sanitized" html={naiveSanitize(payload) || '(empty after filtering)'} />
        <Code block mt="xs">
          {naiveSanitize(payload) || '(empty)'}
        </Code>
      </DemoCard>

      <DemoCard title="CSRF — SameSite cookies decide whether the cookie is sent">
        <CsrfSimulator />
      </DemoCard>
    </Stack>
  );
}
