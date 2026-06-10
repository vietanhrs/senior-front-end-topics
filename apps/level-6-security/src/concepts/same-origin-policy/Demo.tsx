import { useMemo, useState } from 'react';
import { Badge, Code, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

function originOf(url: string): { ok: boolean; origin: string; parts?: { scheme: string; host: string; port: string } } {
  try {
    const u = new URL(url);
    const port = u.port || (u.protocol === 'https:' ? '443' : u.protocol === 'http:' ? '80' : '');
    return { ok: true, origin: u.origin, parts: { scheme: u.protocol.replace(':', ''), host: u.hostname, port } };
  } catch {
    return { ok: false, origin: '(invalid URL)' };
  }
}

interface Cap {
  label: string;
  sameOnly: boolean; // true = needs same origin; false = allowed cross-origin
  crossNote: string;
}

const CAPS: Cap[] = [
  { label: "Read the other frame's DOM", sameOnly: true, crossNote: 'blocked — use postMessage' },
  { label: 'Read a fetch() response body in JS', sameOnly: true, crossNote: 'blocked unless CORS allows it' },
  { label: "Read the other origin's localStorage/IndexedDB", sameOnly: true, crossNote: 'blocked — storage is per-origin' },
  { label: 'Send the request (cookies may attach)', sameOnly: false, crossNote: 'allowed — only the RESPONSE read is gated (→ CSRF)' },
  { label: 'Embed <img>/<script>/<style>', sameOnly: false, crossNote: 'allowed but opaque (no pixel/source read without CORS)' },
  { label: 'Submit a cross-origin <form>', sameOnly: false, crossNote: 'allowed (CSRF basis)' },
  { label: 'postMessage to the window', sameOnly: false, crossNote: 'allowed — receiver MUST validate event.origin' },
];

export function Demo() {
  const pageOrigin = typeof location !== 'undefined' ? location.origin : 'https://app.example';
  const [a, setA] = useState(pageOrigin);
  const [b, setB] = useState('https://api.example.com/data');

  const oa = useMemo(() => originOf(a), [a]);
  const ob = useMemo(() => originOf(b), [b]);
  const same = oa.ok && ob.ok && oa.origin === ob.origin;

  // Which tuple component differs (for the teaching note)
  const diff = oa.parts && ob.parts
    ? oa.parts.scheme !== ob.parts.scheme ? 'scheme' : oa.parts.host !== ob.parts.host ? 'host' : oa.parts.port !== ob.parts.port ? 'port' : null
    : null;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Compare two origins">
        Origin = (scheme, host, port) — all three must match. Edit either URL and watch the verdict
        and the capability matrix update. Remember: a different subdomain, port, or scheme is a
        different origin even though it may be the same <i>site</i>.
      </Callout>

      <DemoCard
        title="Two URLs"
        right={
          <Badge size="lg" color={same ? 'teal' : 'orange'} variant="filled">
            {oa.ok && ob.ok ? (same ? 'same origin' : `cross-origin (${diff} differs)`) : 'invalid URL'}
          </Badge>
        }
      >
        <Stack gap="sm">
          <TextInput label="Origin A (e.g. your page)" value={a} onChange={(e) => setA(e.currentTarget.value)} />
          <TextInput label="Origin B (the other resource/frame)" value={b} onChange={(e) => setB(e.currentTarget.value)} />
          <Group gap="xl">
            <Text size="sm">A origin: <Code>{oa.origin}</Code></Text>
            <Text size="sm">B origin: <Code>{ob.origin}</Code></Text>
          </Group>
        </Stack>
      </DemoCard>

      <DemoCard title="What can A do to/with B?">
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Capability</Table.Th>
              <Table.Th w={110}>Verdict</Table.Th>
              <Table.Th>Note</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {CAPS.map((c) => {
              const allowed = same || !c.sameOnly;
              return (
                <Table.Tr key={c.label}>
                  <Table.Td><Text size="sm">{c.label}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={allowed ? 'teal' : 'red'} variant={allowed ? 'light' : 'filled'}>
                      {allowed ? 'allowed' : 'blocked'}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">{same ? 'same origin → unrestricted' : c.crossNote}</Text></Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
        <Text size="xs" c="dimmed" mt="sm">
          The recurring senior point: cross-origin <b>requests still go out</b> (often with cookies) —
          SOP only stops JS from <b>reading the response/DOM/storage</b>. That asymmetry is exactly
          why CSRF works and why CORS is an opt-in to *read*, not to *send*.
        </Text>
      </DemoCard>
    </Stack>
  );
}
