import { useEffect, useRef, useState } from 'react';
import { Badge, Group, Progress, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const TARGETS = [0, 1, 2, 3, 4];
const THRESHOLDS: Record<string, number[]> = {
  '0': [0],
  '0.5': [0.5],
  '1': [1],
  steps: [0, 0.25, 0.5, 0.75, 1],
};

export function Demo() {
  const { logs, log } = useLogger();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const targetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [thresholdKey, setThresholdKey] = useState('steps');
  const [rootMargin, setRootMargin] = useState('0px');
  const [ratios, setRatios] = useState<Record<number, number>>({});
  const [loaded, setLoaded] = useState<Set<number>>(new Set());

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let io: IntersectionObserver;
    try {
      io = new IntersectionObserver(
        (entries) => {
          log(`callback: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} delivered (batched)`, 'macro');
          setRatios((prev) => {
            const next = { ...prev };
            for (const e of entries) {
              const i = Number((e.target as HTMLElement).dataset.i);
              next[i] = e.intersectionRatio;
              if (e.isIntersecting && e.intersectionRatio > 0) {
                setLoaded((s) => (s.has(i) ? s : new Set(s).add(i)));
              }
            }
            return next;
          });
        },
        { root, rootMargin, threshold: THRESHOLDS[thresholdKey] },
      );
    } catch (err) {
      log(`invalid rootMargin "${rootMargin}" → ${(err as Error).message}`, 'error');
      return;
    }
    targetRefs.current.forEach((t) => t && io.observe(t));
    log(`observing ${TARGETS.length} targets · threshold=[${THRESHOLDS[thresholdKey].join(', ')}] · rootMargin="${rootMargin}"`, 'sync');
    return () => io.disconnect();
  }, [thresholdKey, rootMargin, log]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Scroll the inner box and watch entries fire">
        A real <code>IntersectionObserver</code> watches all 5 targets. Change the threshold and
        rootMargin and scroll: the console logs each <b>batched</b> callback, and every target shows
        its live <code>intersectionRatio</code>. Note the initial callback fires on observe (before
        any scroll), and a positive rootMargin "loads" targets before they're visible.
      </Callout>

      <Group grow>
        <div>
          <Text size="sm" fw={500} mb={4}>threshold</Text>
          <SegmentedControl
            fullWidth
            value={thresholdKey}
            onChange={setThresholdKey}
            data={[
              { label: '0', value: '0' },
              { label: '0.5', value: '0.5' },
              { label: '1', value: '1' },
              { label: '[0…1]', value: 'steps' },
            ]}
          />
        </div>
        <TextInput
          label="rootMargin (try '200px' to preload, '-40px' to delay)"
          value={rootMargin}
          onChange={(e) => setRootMargin(e.currentTarget.value)}
        />
      </Group>

      <DemoCard title="Scroll container (root)">
        <div ref={rootRef} className="h-64 overflow-auto rounded-md border p-3">
          <Text size="xs" c="dimmed" mb="sm">↓ scroll ↓</Text>
          <Stack gap={80}>
            {TARGETS.map((i) => (
              <div
                key={i}
                data-i={i}
                ref={(el) => {
                  targetRefs.current[i] = el;
                }}
                className="rounded-md border p-3"
              >
                <Group justify="space-between" mb={6}>
                  <Text size="sm" fw={600}>Target {i}</Text>
                  <Group gap="xs">
                    {loaded.has(i) && <Badge size="xs" color="teal" variant="light">lazy-loaded</Badge>}
                    <Badge size="xs" variant="light">ratio {(ratios[i] ?? 0).toFixed(2)}</Badge>
                  </Group>
                </Group>
                <Progress value={(ratios[i] ?? 0) * 100} />
              </div>
            ))}
            <Text size="xs" c="dimmed">end</Text>
          </Stack>
        </div>
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Scroll the container to see batched IO callbacks." />
    </Stack>
  );
}
