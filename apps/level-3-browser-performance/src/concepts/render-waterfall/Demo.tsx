import { useMemo, useState } from 'react';
import { Badge, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Res {
  id: string;
  label: string;
  dur: number;
  deps: string[];
  color: string;
}

// Naive: deep serial chains (late discovery of font + data).
const NAIVE: Res[] = [
  { id: 'html', label: 'HTML document', dur: 180, deps: [], color: '#4dabf7' },
  { id: 'css', label: 'app.css (after HTML parse)', dur: 220, deps: ['html'], color: '#9775fa' },
  { id: 'font', label: 'font.woff2 (discovered in CSS)', dur: 200, deps: ['css'], color: '#f783ac' },
  { id: 'js', label: 'app.js bundle', dur: 320, deps: ['html'], color: '#ffa94d' },
  { id: 'api', label: "fetch('/api') after hydrate", dur: 260, deps: ['js'], color: '#ff8787' },
  { id: 'paint', label: 'meaningful paint', dur: 80, deps: ['font', 'api'], color: '#69db7c' },
];

// Optimized: preconnect + preload start font & data early, in parallel.
const OPTIMIZED: Res[] = [
  { id: 'html', label: 'HTML document', dur: 180, deps: [], color: '#4dabf7' },
  { id: 'preconnect', label: 'preconnect api origin (parallel)', dur: 90, deps: [], color: '#ced4da' },
  { id: 'font', label: 'font.woff2 (preloaded)', dur: 200, deps: [], color: '#f783ac' },
  { id: 'api', label: "fetch('/api') (preload as=fetch / SSR)", dur: 260, deps: ['preconnect'], color: '#ff8787' },
  { id: 'css', label: 'app.css (parallel)', dur: 220, deps: ['html'], color: '#9775fa' },
  { id: 'js', label: 'app.js bundle (defer, parallel)', dur: 320, deps: ['html'], color: '#ffa94d' },
  { id: 'paint', label: 'meaningful paint', dur: 80, deps: ['css', 'font', 'api'], color: '#69db7c' },
];

function schedule(res: Res[]) {
  const end: Record<string, number> = {};
  const start: Record<string, number> = {};
  // resolve in dependency order (inputs are already topologically sorted enough; loop to fixpoint)
  for (let pass = 0; pass < res.length; pass++) {
    for (const r of res) {
      const s = r.deps.length ? Math.max(...r.deps.map((d) => end[d] ?? 0)) : 0;
      start[r.id] = s;
      end[r.id] = s + r.dur;
    }
  }
  const total = Math.max(...res.map((r) => end[r.id]));
  return { start, end, total };
}

export function Demo() {
  const [mode, setMode] = useState<'naive' | 'optimized'>('naive');
  const res = mode === 'naive' ? NAIVE : OPTIMIZED;
  const { start, end, total } = useMemo(() => schedule(res), [res]);
  const paintAt = end['paint'];

  return (
    <Stack gap="md">
      <Callout kind="info" title="Same resources, different chain">
        Both scenarios load the same HTML/CSS/JS/font/data and reach a meaningful paint. The naive
        version chains them serially (font discovered in CSS, data fetched after the JS bundle runs).
        The optimized version preconnects/preloads so the font and data start early, in parallel.
        Watch the total drop.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Naive (serial chain)', value: 'naive' },
          { label: 'Optimized (parallel)', value: 'optimized' },
        ]}
      />

      <DemoCard
        title="Request waterfall"
        right={
          <Group gap="xs">
            <Badge variant="light">total {total}ms</Badge>
            <Badge color="teal" variant="filled">
              paint @ {paintAt}ms
            </Badge>
          </Group>
        }
      >
        <Stack gap={6}>
          {res.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <Text size="xs" w={210} style={{ flexShrink: 0 }} truncate>
                {r.label}
              </Text>
              <div className="relative h-5 flex-1 rounded bg-[var(--mantine-color-default-hover)]">
                <div
                  className="absolute top-0 flex h-full items-center justify-end rounded px-1 text-[10px] text-white"
                  style={{
                    left: `${(start[r.id] / total) * 100}%`,
                    width: `${(r.dur / total) * 100}%`,
                    background: r.color,
                  }}
                >
                  {r.dur}ms
                </div>
              </div>
            </div>
          ))}
        </Stack>
        <Text size="xs" c="dimmed" mt="sm">
          The critical path is the longest dependency chain ending at "meaningful paint". Flattening
          it (preconnect/preload, SSR/inline data, parallel fetches) shortens time-to-paint far more
          than shrinking any single file.
        </Text>
      </DemoCard>
    </Stack>
  );
}
