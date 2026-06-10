import { useMemo, useState } from 'react';
import { Badge, Code, Group, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface ResourceRow {
  kind: 'css' | 'script';
  label: string;
  blocking: boolean;
  why: string;
}

/** Inspect the live document for stylesheets and scripts, classifying each. */
function inspectDocument(): ResourceRow[] {
  const rows: ResourceRow[] = [];

  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((l) => {
    const media = l.media || 'all';
    const blocking = media === 'all' || matchMedia(media).matches;
    rows.push({
      kind: 'css',
      label: l.href.split('/').pop() || l.href,
      blocking,
      why: blocking ? `stylesheet, media="${media}" matches → blocks paint` : `media="${media}" doesn't match → not blocking`,
    });
  });

  document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((s) => {
    const inHead = !!s.closest('head');
    const blocking = !s.defer && !s.async && s.type !== 'module' && inHead;
    const why = s.async
      ? 'async → not parser-blocking'
      : s.defer
        ? 'defer → not parser-blocking'
        : s.type === 'module'
          ? 'type=module → deferred by default'
          : inHead
            ? 'sync script in <head> → parser-blocking'
            : 'sync script, but not in <head>';
    rows.push({ kind: 'script', label: s.src.split('/').pop() || s.src, blocking, why });
  });

  return rows;
}

const TECHNIQUES = [
  { value: 'sync-css', label: 'CSS in <head>', blocking: true, fix: 'Inline critical CSS; load the rest via preload+onload or split by media.' },
  { value: 'print-css', label: 'CSS media="print"', blocking: false, fix: 'Already non-blocking — loaded at low priority.' },
  { value: 'sync-js', label: '<script> in <head>', blocking: true, fix: 'Add defer (keeps order) or async (independent), or move to end of <body>.' },
  { value: 'defer-js', label: '<script defer>', blocking: false, fix: 'Good for app bundles needing the DOM in order.' },
  { value: 'async-js', label: '<script async>', blocking: false, fix: 'Good for independent scripts (analytics).' },
  { value: 'import', label: 'CSS @import', blocking: true, fix: 'Avoid — serial CSS chain. Use <link> or a bundler instead.' },
];

export function Demo() {
  const rows = useMemo(inspectDocument, []);
  const [tech, setTech] = useState('sync-js');
  const t = TECHNIQUES.find((x) => x.value === tech)!;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Live inspection of this very page">
        Below are the actual stylesheets and scripts in this document, classified as render-blocking
        or not. Cross-check against DevTools → Network (priority column) and Lighthouse.
      </Callout>

      <DemoCard title="This page's CSS & scripts">
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Resource</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Blocking?</Table.Th>
              <Table.Th>Why</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r, i) => (
              <Table.Tr key={i}>
                <Table.Td>
                  <Code>{r.label}</Code>
                </Table.Td>
                <Table.Td>{r.kind}</Table.Td>
                <Table.Td>
                  <Badge color={r.blocking ? 'red' : 'teal'} variant="light">
                    {r.blocking ? 'blocking' : 'no'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {r.why}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
            {rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text size="sm" c="dimmed">
                    No external CSS/JS found (dev mode may inline everything).
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </DemoCard>

      <DemoCard
        title="Technique lookup"
        right={
          <Badge color={t.blocking ? 'red' : 'teal'} variant="filled">
            {t.blocking ? 'render-blocking' : 'not blocking'}
          </Badge>
        }
      >
        <SegmentedControl
          value={tech}
          onChange={setTech}
          fullWidth
          size="xs"
          data={TECHNIQUES.map((x) => ({ value: x.value, label: x.label }))}
        />
        <Group mt="md" align="flex-start">
          <Text size="sm">{t.fix}</Text>
        </Group>
      </DemoCard>
    </Stack>
  );
}
