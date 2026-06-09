import { useMemo, useState } from 'react';
import { Badge, Group, Slider, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '../../workbook/ui';

/** Read real CRP-related timings for THIS page from the Performance API. */
function useRealMetrics() {
  return useMemo(() => {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const fcp = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint');
    const round = (n?: number) => (n == null ? '—' : `${Math.max(0, Math.round(n))} ms`);
    return [
      { label: 'TTFB (responseStart)', value: round(nav?.responseStart) },
      { label: 'DOM Interactive', value: round(nav?.domInteractive) },
      { label: 'First Contentful Paint', value: round(fcp?.startTime) },
      { label: 'DOMContentLoaded', value: round(nav?.domContentLoadedEventEnd) },
      { label: 'Load event', value: round(nav?.loadEventEnd) },
    ];
  }, []);
}

interface Phase {
  label: string;
  ms: number;
  color: string;
}

function Timeline({ title, phases, fcp, total }: { title: string; phases: Phase[]; fcp: number; total: number }) {
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          {title}
        </Text>
        <Badge variant="light" color={fcp > total * 0.6 ? 'red' : 'teal'}>
          FCP ≈ {Math.round(fcp)} ms
        </Badge>
      </Group>
      <div className="relative h-7 w-full overflow-hidden rounded" style={{ background: 'var(--mantine-color-default-hover)' }}>
        <div className="flex h-full">
          {phases.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-[10px] text-white"
              style={{ width: `${(p.ms / total) * 100}%`, background: p.color, minWidth: p.ms ? 2 : 0 }}
              title={`${p.label}: ${p.ms}ms`}
            >
              {(p.ms / total) > 0.12 ? p.label : ''}
            </div>
          ))}
        </div>
        {/* FCP marker */}
        <div
          className="absolute top-0 h-full border-l-2 border-dashed"
          style={{ left: `${(fcp / total) * 100}%`, borderColor: '#fa5252' }}
        />
      </div>
    </Stack>
  );
}

export function Demo() {
  const real = useRealMetrics();
  const [H, setH] = useState(120); // html parse
  const [C, setC] = useState(200); // css download (render-blocking)
  const [J, setJ] = useState(180); // js download
  const [E, setE] = useState(90); // js execute

  // Simplified timing model focused on teaching, not byte-accurate simulation.
  const blockingFcp = Math.max(C, H + J + E); // parser blocked by sync script
  const deferFcp = Math.max(H, C); // script downloads in parallel, paint not blocked by exec
  const asyncFcp = Math.max(H, C);
  const total = Math.max(blockingFcp, deferFcp, asyncFcp) + E + 40;

  return (
    <Stack gap="md">
      <Callout kind="info" title="This page's real CRP metrics">
        Read directly from the <code>performance</code> API of the very workbook page you're
        viewing. Open DevTools → Performance to see the detailed waterfall.
      </Callout>

      <DemoCard title="Performance API — current page">
        <Table withRowBorders={false}>
          <Table.Tbody>
            {real.map((r) => (
              <Table.Tr key={r.label}>
                <Table.Td>
                  <Text size="sm">{r.label}</Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text size="sm" ff="monospace" fw={600}>
                    {r.value}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </DemoCard>

      <DemoCard
        title="Simulation: how script placement/type affects FCP"
        description="Drag the cost parameters (same set of resources), then compare 3 script-loading strategies. The red dashed line is First Contentful Paint. A synchronous script in <head> pushes FCP out because it blocks the parser."
      >
        <Stack gap="lg">
          <Group grow>
            <Stack gap={2}>
              <Text size="xs">HTML parse: {H}ms</Text>
              <Slider value={H} onChange={setH} min={40} max={400} />
            </Stack>
            <Stack gap={2}>
              <Text size="xs">CSS download: {C}ms</Text>
              <Slider value={C} onChange={setC} min={40} max={400} color="grape" />
            </Stack>
          </Group>
          <Group grow>
            <Stack gap={2}>
              <Text size="xs">JS download: {J}ms</Text>
              <Slider value={J} onChange={setJ} min={40} max={400} color="orange" />
            </Stack>
            <Stack gap={2}>
              <Text size="xs">JS execute: {E}ms</Text>
              <Slider value={E} onChange={setE} min={20} max={300} color="red" />
            </Stack>
          </Group>

          <Stack gap="md">
            <Timeline
              title="① sync <script> in <head> (blocks the parser)"
              total={total}
              fcp={blockingFcp}
              phases={[
                { label: 'HTML', ms: H * 0.2, color: '#4dabf7' },
                { label: 'JS download', ms: J, color: '#ffa94d' },
                { label: 'JS exec', ms: E, color: '#ff6b6b' },
                { label: 'HTML cont.', ms: H * 0.8, color: '#74c0fc' },
              ]}
            />
            <Timeline
              title="② <script defer> (does not block the parser)"
              total={total}
              fcp={deferFcp}
              phases={[
                { label: 'HTML', ms: H, color: '#4dabf7' },
                { label: 'defer exec', ms: E, color: '#ff6b6b' },
              ]}
            />
            <Timeline
              title="③ <script async> (doesn't block the parser, runs once fetched)"
              total={total}
              fcp={asyncFcp}
              phases={[
                { label: 'HTML', ms: H, color: '#4dabf7' },
                { label: 'async exec', ms: E, color: '#ff6b6b' },
              ]}
            />
          </Stack>
          <Text size="xs" c="dimmed">
            * A simplified model to build intuition (CSS is always render-blocking; a sync script
            blocks DOM construction). It is not byte-accurate.
          </Text>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
