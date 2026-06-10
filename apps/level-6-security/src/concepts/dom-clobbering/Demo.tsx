import { useRef, useState } from 'react';
import { Badge, Button, Code, Group, Stack, Table, Text, Textarea } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const DEFAULT_PAYLOAD = `<a id="appConfig" href="https://evil.test/x"></a>
<form id="settings">
  <input name="isAdmin" value="true">
  <a id="endpoint" href="https://evil.test/api"></a>
</form>`;

interface Probe {
  expr: string;
  expected: string;
  read: (cw: Window & Record<string, unknown>) => string;
}

function describe(v: unknown): string {
  if (v == null) return String(v);
  if (typeof v === 'object' && v && 'tagName' in (v as object)) {
    const el = v as Element & { value?: string; href?: string };
    return `<${el.tagName.toLowerCase()}> element` + (el.href ? ` (href=${el.href})` : '') + (el.value ? ` (value=${el.value})` : '');
  }
  return `${typeof v}: ${String(v)}`;
}

const PROBES: Probe[] = [
  { expr: 'window.appConfig', expected: 'undefined (then load safe defaults)', read: (cw) => describe(cw.appConfig) },
  { expr: 'window.appConfig ?? {api:"/safe"}', expected: '{api:"/safe"}', read: (cw) => describe(cw.appConfig ?? { api: '/safe' }) },
  { expr: 'document.settings', expected: 'undefined', read: (cw) => describe((cw.document as unknown as Record<string, unknown>).settings) },
  { expr: 'document.settings.isAdmin', expected: 'undefined', read: (cw) => {
      const s = (cw.document as unknown as Record<string, unknown>).settings as Record<string, unknown> | undefined;
      return describe(s?.isAdmin);
    } },
  { expr: 'String(window.endpoint)', expected: '"undefined"', read: (cw) => {
      const f = (cw.document as unknown as Record<string, unknown>).settings as Record<string, unknown> | undefined;
      return describe(f?.endpoint ? String(f.endpoint) : undefined);
    } },
];

export function Demo() {
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [rows, setRows] = useState<{ expr: string; expected: string; actual: string; clobbered: boolean }[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  function run() {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // sandbox="allow-same-origin" WITHOUT allow-scripts: the doc is same-origin
    // (so we can read its named props) but injected <script>/on* never execute.
    iframe.srcdoc = `<!doctype html><html><body>${payload}</body></html>`;
    iframe.onload = () => {
      const cw = iframe.contentWindow as (Window & Record<string, unknown>) | null;
      if (!cw) return;
      setRows(
        PROBES.map((p) => {
          const actual = p.read(cw);
          return { expr: p.expr, expected: p.expected, actual, clobbered: !actual.startsWith('undefined') && actual !== `${'string'}: undefined` && !actual.includes('"/safe"') };
        }),
      );
    };
  }

  return (
    <Stack gap="md">
      <Callout kind="warning" title="Script-less injection — runs safely in a sandboxed frame">
        The payload is injected into an <code>&lt;iframe sandbox="allow-same-origin"&gt;</code>{' '}
        (scripts disabled, so nothing executes), then we read named-access properties from its
        window/document — exactly what victim code would see. Note: no <code>&lt;script&gt;</code> is
        needed for any of this.
      </Callout>

      <DemoCard
        title="Attacker HTML (only id/name, no script)"
        right={
          <Button size="xs" onClick={run}>
            Inject & probe
          </Button>
        }
      >
        <Textarea autosize minRows={4} value={payload} onChange={(e) => setPayload(e.currentTarget.value)} styles={{ input: { fontFamily: 'monospace', fontSize: 12.5 } }} />
        <iframe ref={iframeRef} title="clobber-sandbox" sandbox="allow-same-origin" style={{ display: 'none' }} />
      </DemoCard>

      {rows.length > 0 && (
        <DemoCard title="What victim code actually reads">
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Lookup</Table.Th>
                <Table.Th>Expected</Table.Th>
                <Table.Th>Actual (clobbered)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.expr}>
                  <Table.Td>
                    <Code>{r.expr}</Code>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">{r.expected}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} wrap="nowrap">
                      {r.clobbered && <Badge size="xs" color="red" variant="filled">clobbered</Badge>}
                      <Text size="xs">{r.actual}</Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Text size="xs" c="dimmed" mt="sm">
            The falsy-check and <code>??</code> fallback both break: the lookups are truthy DOM nodes,
            not <code>undefined</code> — so "load safe defaults" never runs and nested reads return
            attacker-placed elements.
          </Text>
        </DemoCard>
      )}
    </Stack>
  );
}
