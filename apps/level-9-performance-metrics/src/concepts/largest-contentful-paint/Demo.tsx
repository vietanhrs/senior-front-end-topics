import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

interface SceneItem {
  t: number;
  w: number;
  h: number;
  label: string;
}

const SCENE: SceneItem[] = [
  { t: 250, w: 160, h: 36, label: 'heading' },
  { t: 650, w: 320, h: 70, label: 'text block' },
  { t: 1150, w: 360, h: 200, label: 'hero image (largest)' },
  { t: 1550, w: 90, h: 90, label: 'late icon' },
];
const INPUT_AT = 900;

interface RealLcp {
  time: number;
  size: number;
  el: string;
}

function rate(ms: number) {
  if (ms <= 2500) return { label: 'good', color: 'teal' };
  if (ms <= 4000) return { label: 'needs improvement', color: 'orange' };
  return { label: 'poor', color: 'red' };
}

const supported =
  typeof PerformanceObserver !== 'undefined' &&
  PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint');

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [real, setReal] = useState<RealLcp | null>(null);
  const [painted, setPainted] = useState<SceneItem[]>([]);
  const [candidate, setCandidate] = useState<{ label: string; time: number; area: number } | null>(null);
  const [freezeOnInput, setFreezeOnInput] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // The real page LCP (buffered → present even though load finished before mount).
  useEffect(() => {
    if (!supported) return;
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries() as (PerformanceEntry & { size: number; element?: Element })[];
      const last = entries[entries.length - 1];
      if (last) setReal({ time: last.startTime, size: last.size, el: last.element?.tagName ?? '—' });
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    return () => po.disconnect();
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    timers.current.forEach(clearTimeout);
    clear();
    setPainted([]);
    setCandidate(null);
    log(`paint timeline started${freezeOnInput ? ` · simulated user input at ${INPUT_AT}ms (freezes LCP)` : ''}`, 'macro');
    for (const item of SCENE) {
      const id = setTimeout(() => {
        setPainted((p) => [...p, item]);
        const area = item.w * item.h;
        const afterInput = freezeOnInput && item.t > INPUT_AT;
        if (afterInput) {
          log(`${item.label} painted at ${item.t}ms — after input → ignored for LCP`, 'default');
          return;
        }
        setCandidate((cur) => {
          if (!cur || area > cur.area) {
            log(`LCP candidate → ${item.label} (area ${area}px², t=${item.t}ms)`, 'sync');
            return { label: item.label, time: item.t, area };
          }
          log(`${item.label} painted (smaller) — LCP unchanged`, 'default');
          return cur;
        });
      }, item.t);
      timers.current.push(id);
    }
  };

  const r = candidate ? rate(candidate.time) : null;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Watch the LCP candidate evolve, then freeze">
        Run the timeline: elements paint at different times and sizes. The LCP candidate updates to
        the <b>largest element painted so far</b>, and its paint time is the running LCP — so the late
        hero image pushes LCP to {SCENE[2].t}ms. Toggle "freeze on input" to simulate a user
        interaction at {INPUT_AT}ms, which freezes LCP at the largest element seen <i>before</i> then.
      </Callout>

      <Group>
        <Button onClick={run}>Run paint timeline</Button>
        <Switch
          label={`simulate input at ${INPUT_AT}ms`}
          checked={freezeOnInput}
          onChange={(e) => setFreezeOnInput(e.currentTarget.checked)}
        />
        {candidate && r && (
          <Badge size="lg" variant="light" color={r.color}>
            LCP {candidate.time}ms · {candidate.label} · {r.label}
          </Badge>
        )}
      </Group>

      <DemoCard title="Viewport (elements paint over time; the LCP candidate is outlined)">
        <Group align="flex-start" gap="sm" wrap="wrap" style={{ minHeight: 220 }}>
          {painted.map((item, i) => (
            <div
              key={i}
              style={{
                width: item.w / 1.5,
                height: item.h / 1.5,
                background: 'var(--mantine-color-indigo-light)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: candidate?.label === item.label ? '3px solid var(--mantine-color-teal-6)' : 'none',
              }}
            >
              <Text size="xs" fw={600}>{item.label}</Text>
            </div>
          ))}
        </Group>
      </DemoCard>

      <DemoCard title="This page's real LCP (largest-contentful-paint entry)">
        {real === null ? (
          <Text size="sm" c="dimmed">No LCP recorded (or unsupported in this engine).</Text>
        ) : (
          <Group>
            <Text size="xl" fw={700}>{(real.time / 1000).toFixed(2)} s</Text>
            <Badge color={rate(real.time).color} variant="light">{rate(real.time).label}</Badge>
            <Text size="sm" c="dimmed">largest: &lt;{real.el.toLowerCase()}&gt; · {Math.round(real.size)}px²</Text>
          </Group>
        )}
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Run the timeline to watch candidates update." />
    </Stack>
  );
}
