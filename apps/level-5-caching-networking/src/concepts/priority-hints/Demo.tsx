import { useMemo, useState } from 'react';
import { Badge, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Req {
  name: string;
  size: number; // "work units"
  prio: number; // 0 = highest
  color: string;
}

// Bandwidth-shared scheduler: requests run in priority order over a fixed pipe.
// Higher priority gets the pipe first (simplified strict-priority model).
function schedule(reqs: Req[]): { start: number; end: number }[] {
  const order = reqs.map((r, i) => ({ ...r, i })).sort((a, b) => a.prio - b.prio || a.i - b.i);
  let t = 0;
  const out: { start: number; end: number }[] = new Array(reqs.length);
  for (const r of order) {
    out[r.i] = { start: t, end: t + r.size };
    t += r.size;
  }
  return out;
}

const BASE: Omit<Req, 'prio'>[] = [
  { name: 'app.css (render-blocking)', size: 12, color: '#9775fa' },
  { name: 'hero.jpg ← LCP element', size: 22, color: '#f59f00' },
  { name: 'app.js (defer)', size: 18, color: '#4dabf7' },
  { name: 'avatar-badges.png (above fold, minor)', size: 10, color: '#a9e34b' },
  { name: 'analytics.js + beacons', size: 9, color: '#ced4da' },
];

type Mode = 'defaults' | 'hinted';

const PRIORITIES: Record<Mode, number[]> = {
  // Browser-ish defaults: CSS highest; JS next; images LOW (incl. the LCP hero!).
  defaults: [0, 3, 1, 3, 2],
  // With fetchpriority: hero promoted to high; badges & analytics demoted.
  hinted: [0, 1, 2, 4, 5],
};

export function Demo() {
  const [mode, setMode] = useState<Mode>('defaults');
  const reqs = useMemo(() => BASE.map((b, i) => ({ ...b, prio: PRIORITIES[mode][i] })), [mode]);
  const slots = useMemo(() => schedule(reqs), [reqs]);
  const total = Math.max(...slots.map((s) => s.end));
  const lcpEnd = slots[1].end;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Same bytes, different order">
        A simplified single-pipe scheduler downloads strictly by priority. With <b>defaults</b>, the
        hero image (the LCP element!) is just another Low-priority image, finishing after app.js and
        the badge sprites. Add <b>fetchpriority hints</b> — hero <code>high</code>, badges/analytics{' '}
        <code>low</code> — and LCP completes far earlier without changing a single byte.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        fullWidth
        data={[
          { label: 'Browser defaults', value: 'defaults' },
          { label: 'With fetchpriority hints', value: 'hinted' },
        ]}
      />

      <DemoCard
        title="Download schedule"
        right={
          <Badge size="lg" color={lcpEnd <= total * 0.5 ? 'teal' : 'red'} variant="filled">
            LCP image done @ {lcpEnd} / {total} units
          </Badge>
        }
      >
        <Stack gap={6}>
          {reqs.map((r, i) => (
            <div key={r.name} className="flex items-center gap-2">
              <Text size="xs" w={260} style={{ flexShrink: 0 }} truncate>
                {r.name}
              </Text>
              <div className="relative h-5 flex-1 rounded bg-[var(--mantine-color-default-hover)]">
                <div
                  className="absolute top-0 flex h-full items-center justify-end rounded px-1 text-[10px] font-semibold text-black/70"
                  style={{
                    left: `${(slots[i].start / total) * 100}%`,
                    width: `${(r.size / total) * 100}%`,
                    background: r.color,
                  }}
                >
                  p{r.prio}
                </div>
              </div>
            </div>
          ))}
        </Stack>
        <Text size="xs" c="dimmed" mt="sm">
          {mode === 'defaults'
            ? 'Defaults: images are Low until layout proves them in-viewport — the LCP hero waits behind app.js.'
            : 'Hints: <img fetchpriority="high"> on the hero, "low" on badges, fetch(priority:"low") for analytics.'}
        </Text>
      </DemoCard>

      <DemoCard title="The markup difference">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Resource</Table.Th>
              <Table.Th>Hint</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {[
              ['hero.jpg (LCP)', '<img src="/hero.jpg" fetchpriority="high">'],
              ['avatar badges', '<img src="/badges.png" fetchpriority="low" loading="lazy">'],
              ['analytics', "fetch('/analytics', { priority: 'low' })"],
              ['app.css / app.js', '(leave auto — heuristics are right here)'],
            ].map(([a, b]) => (
              <Table.Tr key={a as string}>
                <Table.Td>{a}</Table.Td>
                <Table.Td>
                  <Text ff="monospace" size="xs">{b}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </DemoCard>
    </Stack>
  );
}
