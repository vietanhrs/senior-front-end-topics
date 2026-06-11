import { useMemo, useState } from 'react';
import { Badge, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// A record edited concurrently by two replicas from a common base.
const BASE = { title: 'Draft', tags: ['a'], count: 1 };
const A = { title: 'Final', tags: ['a', 'b'], count: 2 }; // +b, count +1
const B = { title: 'Report', tags: ['a', 'c'], count: 3 }; // +c, count +2

interface Row {
  model: string;
  title: string;
  tags: string;
  count: string;
  loss: 'lossy' | 'conflict' | 'clean';
  note: string;
}

function buildRows(later: 'A' | 'B'): Row[] {
  const win = later === 'A' ? A : B;
  const union = [...new Set([...A.tags, ...B.tags])].join(',');
  const sum = BASE.count + (A.count - BASE.count) + (B.count - BASE.count); // apply both deltas
  return [
    {
      model: 'LWW (whole record)',
      title: win.title,
      tags: `[${win.tags.join(',')}]`,
      count: String(win.count),
      loss: 'lossy',
      note: `whole ${later} wins; all of ${later === 'A' ? 'B' : 'A'}'s concurrent edits discarded`,
    },
    {
      model: 'Field-level LWW',
      title: win.title,
      tags: `[${win.tags.join(',')}]`,
      count: String(win.count),
      loss: 'lossy',
      note: 'per-field newest wins; still loses the other field edits within each field',
    },
    {
      model: 'Three-way merge',
      title: '⚠ conflict',
      tags: `[${union}]`,
      count: '⚠ conflict',
      loss: 'conflict',
      note: 'title & count changed on both sides → flagged; tags merge cleanly (non-overlapping adds)',
    },
    {
      model: 'CRDT / domain merge',
      title: `{${A.title} | ${B.title}}`,
      tags: `[${union}]`,
      count: String(sum),
      loss: 'clean',
      note: 'tags = OR-Set union, count = PN-counter sum (4), title = MV-register keeps both',
    },
    {
      model: 'Manual (user-mediated)',
      title: 'ask user',
      tags: `[${union}]`,
      count: 'ask user',
      loss: 'clean',
      note: 'auto-merge what is safe (tags), prompt for genuinely conflicting fields',
    },
  ];
}

const LOSS_COLOR = { lossy: 'red', conflict: 'orange', clean: 'teal' } as const;

export function Demo() {
  const [later, setLater] = useState<'A' | 'B'>('B');
  const rows = useMemo(() => buildRows(later), [later]);

  const cell = (v: string) => (v.includes('⚠') || v.includes('ask') ? <Badge size="xs" color="orange" variant="light">{v}</Badge> : v);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Same concurrent edit, five reconciliation models">
        From base <code>{JSON.stringify(BASE)}</code>, replica <b>A</b> → <code>{JSON.stringify(A)}</code>{' '}
        and replica <b>B</b> → <code>{JSON.stringify(B)}</code> edit <i>concurrently</i>. Each model
        produces a different merged record. Flip which write is "later" to watch LWW's result change
        arbitrarily — that arbitrariness is the cost of its simplicity.
      </Callout>

      <div>
        <Text size="sm" fw={500} mb={4}>which replica synced later (affects LWW)</Text>
        <SegmentedControl
          value={later}
          onChange={(v) => setLater(v as 'A' | 'B')}
          data={[
            { label: 'A later', value: 'A' },
            { label: 'B later', value: 'B' },
          ]}
        />
      </div>

      <DemoCard title="Merged result by model">
        <Table withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>model</Table.Th>
              <Table.Th>title</Table.Th>
              <Table.Th>tags</Table.Th>
              <Table.Th>count</Table.Th>
              <Table.Th>outcome</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r) => (
              <Table.Tr key={r.model}>
                <Table.Td><Text size="sm" fw={600}>{r.model}</Text></Table.Td>
                <Table.Td>{cell(r.title)}</Table.Td>
                <Table.Td><Text size="sm" ff="monospace">{r.tags}</Text></Table.Td>
                <Table.Td>{cell(r.count)}</Table.Td>
                <Table.Td><Badge size="sm" variant="light" color={LOSS_COLOR[r.loss]}>{r.loss}</Badge></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </DemoCard>

      <Stack gap={2}>
        {rows.map((r) => (
          <Text key={r.model} size="xs" c="dimmed"><b>{r.model}:</b> {r.note}</Text>
        ))}
      </Stack>
    </Stack>
  );
}
