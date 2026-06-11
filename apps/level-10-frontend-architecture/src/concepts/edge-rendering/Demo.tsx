import { useState } from 'react';
import { Badge, Group, Progress, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Region {
  id: string;
  label: string;
  toOrigin: number; // RTT user↔origin (ms)
}

const REGIONS: Region[] = [
  { id: 'us-east', label: 'US East (near origin)', toOrigin: 15 },
  { id: 'eu-west', label: 'EU West', toOrigin: 95 },
  { id: 'sa-east', label: 'South America', toOrigin: 180 },
  { id: 'ap-se', label: 'Asia Pacific', toOrigin: 230 },
];

const EDGE_RTT = 12; // user ↔ nearest edge POP (always close)
const RENDER = 30; // server render time
const EDGE_KV = 5; // edge KV / cache read

interface Strategy {
  key: string;
  label: string;
  ttfb: (r: Region) => number;
  note: string;
  color: string;
}

const STRATEGIES: Strategy[] = [
  {
    key: 'origin',
    label: 'Origin SSR',
    ttfb: (r) => r.toOrigin + RENDER,
    note: 'render where the data lives; one far round-trip',
    color: 'gray',
  },
  {
    key: 'edge-static',
    label: 'Edge SSR (data at edge)',
    ttfb: () => EDGE_RTT + RENDER,
    note: 'compute + data both near the user — the win',
    color: 'teal',
  },
  {
    key: 'edge-kv',
    label: 'Edge SSR + edge KV/replica',
    ttfb: () => EDGE_RTT + EDGE_KV + RENDER,
    note: 'local data read at the POP',
    color: 'green',
  },
  {
    key: 'edge-origin',
    label: 'Edge SSR + origin fetch/request',
    ttfb: (r) => EDGE_RTT + r.toOrigin + RENDER,
    note: '⚠ data gravity: edge still hops to the far origin DB',
    color: 'red',
  },
];

export function Demo() {
  const [regionId, setRegionId] = useState('ap-se');
  const region = REGIONS.find((r) => r.id === regionId)!;

  const rows = STRATEGIES.map((s) => ({ ...s, value: s.ttfb(region) }));
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <Stack gap="md">
      <Callout kind="info" title="Where you render depends on where the data is">
        Pick the user's region and compare estimated TTFB. Rendering at the <b>edge</b> (near the
        user) is far faster than the distant <b>origin</b> — <i>unless</i> the edge function still has
        to fetch from the origin database every request, in which case <b>data gravity</b> can make it
        as slow as origin rendering. Co-locating data (edge KV / regional replica) restores the win.
      </Callout>

      <SegmentedControl
        fullWidth
        value={regionId}
        onChange={setRegionId}
        data={REGIONS.map((r) => ({ label: r.label, value: r.id }))}
      />

      <DemoCard title={`Estimated TTFB · user in ${region.label} · origin in US East`}>
        <Stack gap="sm">
          {rows.map((r) => (
            <div key={r.key}>
              <Group justify="space-between" mb={2}>
                <Text size="sm" fw={500}>{r.label}</Text>
                <Badge variant="light" color={r.color}>{r.value}ms</Badge>
              </Group>
              <Progress value={(r.value / max) * 100} color={r.color} />
              <Text size="xs" c="dimmed" mt={2}>{r.note}</Text>
            </div>
          ))}
        </Stack>
      </DemoCard>

      <Text size="sm" c="dimmed">
        For the far region, edge-with-data is ~{Math.round((rows[0].value / rows[1].value) * 10) / 10}× faster than origin —
        but "edge + origin fetch" is {rows[3].value >= rows[0].value ? 'no better than (even worse than)' : 'barely better than'}{' '}
        origin SSR, because the slow hop to the database didn't go away.
      </Text>
    </Stack>
  );
}
