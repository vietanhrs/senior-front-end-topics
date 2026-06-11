import { useEffect, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const CHUNK_MS = 120;
const CHUNKS = 10;

function rate(ms: number) {
  if (ms <= 100) return { label: 'good', color: 'teal' };
  if (ms <= 300) return { label: 'needs improvement', color: 'orange' };
  return { label: 'poor', color: 'red' };
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [lastDelay, setLastDelay] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [realFid, setRealFid] = useState<number | null>(null);

  // The real metric: the page's actual first-input entry (buffered, so we catch
  // it even though it likely fired before this demo mounted).
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;
    let po: PerformanceObserver;
    try {
      po = new PerformanceObserver((list) => {
        for (const e of list.getEntries() as PerformanceEventTiming[]) {
          setRealFid(e.processingStart - e.startTime);
        }
      });
      po.observe({ type: 'first-input', buffered: true });
    } catch {
      /* first-input unsupported */
    }
    return () => po?.disconnect();
  }, []);

  const makeBusy = () => {
    setBusy(true);
    log(`flooding the main thread: ${CHUNKS} × ${CHUNK_MS}ms chunks — click "Tap me" NOW`, 'macro');
    let i = 0;
    const step = () => {
      const end = performance.now() + CHUNK_MS;
      while (performance.now() < end) {
        /* block — a queued click can't be dispatched until this chunk ends */
      }
      i += 1;
      if (i < CHUNKS) setTimeout(step, 0);
      else {
        setBusy(false);
        log('main thread free again', 'sync');
      }
    };
    setTimeout(step, 0);
  };

  const onTap = (e: React.MouseEvent) => {
    // Input delay ≈ time from the native event to this handler starting.
    const delay = performance.now() - e.nativeEvent.timeStamp;
    setLastDelay(delay);
    const r = rate(delay);
    log(`tap input delay ≈ ${delay.toFixed(1)}ms → ${r.label}`, delay <= 100 ? 'success' : 'error');
  };

  const r = lastDelay === null ? null : rate(lastDelay);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Feel the input delay">
        FID is the delay before the browser can even <i>start</i> your first interaction's handler,
        caused by a busy main thread. Press <b>Make main thread busy</b>, then immediately click{' '}
        <b>Tap me</b>: your click is queued behind a {CHUNK_MS}ms blocking chunk, so the measured
        input delay jumps. Click <b>Tap me</b> while idle and it's near zero.
      </Callout>

      <Group>
        <Button color="orange" onClick={makeBusy} loading={busy}>Make main thread busy (~{(CHUNKS * CHUNK_MS) / 1000}s)</Button>
        <Button onClick={onTap}>Tap me (measure input delay)</Button>
        <Button variant="subtle" onClick={() => { clear(); setLastDelay(null); }}>Clear</Button>
      </Group>

      <Group grow>
        <DemoCard title="Measured input delay (this tap)">
          {lastDelay === null ? (
            <Text size="sm" c="dimmed">Tap the button.</Text>
          ) : (
            <Group>
              <Text size="xl" fw={700}>{lastDelay.toFixed(0)} ms</Text>
              {r && <Badge color={r.color} variant="light">{r.label}</Badge>}
            </Group>
          )}
        </DemoCard>
        <DemoCard title="This page's real FID (first-input entry)">
          {realFid === null ? (
            <Text size="sm" c="dimmed">No first-input recorded (or unsupported).</Text>
          ) : (
            <Group>
              <Text size="xl" fw={700}>{realFid.toFixed(0)} ms</Text>
              <Badge color={rate(realFid).color} variant="light">{rate(realFid).label}</Badge>
            </Group>
          )}
        </DemoCard>
      </Group>

      <LogConsole logs={logs} height={150} empty="Make the thread busy, then tap to measure the delay." />
    </Stack>
  );
}
