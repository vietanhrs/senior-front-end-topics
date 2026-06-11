import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

function rate(v: number) {
  if (v <= 0.1) return { label: 'good', color: 'teal' };
  if (v <= 0.25) return { label: 'needs improvement', color: 'orange' };
  return { label: 'poor', color: 'red' };
}

const supported =
  typeof PerformanceObserver !== 'undefined' &&
  PerformanceObserver.supportedEntryTypes?.includes('layout-shift');

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [cls, setCls] = useState(0);
  const [reserveSlot, setReserveSlot] = useState(false);
  const [banner, setBanner] = useState(false);
  // session-window accumulator
  const win = useRef({ value: 0, start: 0, last: 0 });

  useEffect(() => {
    if (!supported) return;
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as LayoutShiftEntry[]) {
        if (e.hadRecentInput) {
          log(`layout-shift ${e.value.toFixed(4)} — hadRecentInput → excluded from CLS`, 'default');
          continue;
        }
        const t = e.startTime;
        const w = win.current;
        if (w.value > 0 && (t - w.last > 1000 || t - w.start > 5000)) {
          w.value = 0;
          w.start = t;
        }
        if (w.value === 0) w.start = t;
        w.last = t;
        w.value += e.value;
        setCls((cur) => {
          const next = Math.max(cur, w.value);
          return next;
        });
        log(`layout-shift ${e.value.toFixed(4)} counted (window=${w.value.toFixed(4)})`, 'macro');
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });
    return () => po.disconnect();
  }, [log]);

  // Insert content AFTER a delay so it's beyond the 500ms input window → it counts
  // toward CLS (simulating a late-loading image/ad rather than a click response).
  const simulateLate = (reserved: boolean) => {
    setBanner(false);
    // Reserved mode reserves the slot NOW (this shift is within the input window →
    // excluded as hadRecentInput, which is the point: reserving on click is fine).
    setReserveSlot(reserved);
    log(`scheduling late content in 800ms (${reserved ? 'space reserved on click' : 'no reserved space'})…`, 'sync');
    setTimeout(() => {
      setBanner(true);
      log('late content inserted — watch for layout-shift entries', 'micro');
    }, 800);
  };

  const reset = () => {
    setBanner(false);
    setReserveSlot(false);
    setCls(0);
    win.current = { value: 0, start: 0, last: 0 };
    clear();
  };

  const r = rate(cls);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Trigger a real layout shift and watch CLS move">
        These buttons insert content <b>800ms later</b> (past the 500ms input window), so the shift
        counts toward CLS like a late-loading ad would. The <b>unreserved</b> version pushes the text
        down (a real <code>layout-shift</code> entry); the <b>reserved</b> version keeps a slot, so
        nothing moves. Shifts within 500ms of your click are excluded as <code>hadRecentInput</code>.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="layout-shift unsupported">
          This engine doesn't expose <code>layout-shift</code> entries; the CLS counter won't move
          here. The behavior and code in the theory still apply.
        </Callout>
      )}

      <Group>
        <Button color="red" onClick={() => simulateLate(false)}>Late content (no reserved space)</Button>
        <Button color="teal" onClick={() => simulateLate(true)}>Late content (reserved space)</Button>
        <Button variant="subtle" onClick={reset}>Reset</Button>
        <Badge size="lg" variant="light" color={r.color}>CLS {cls.toFixed(4)} · {r.label}</Badge>
      </Group>

      <DemoCard title="Content area (text shifts down if space isn't reserved)">
        <div className="rounded-md border p-3">
          {/* Reserved mode keeps a 90px slot from click time, so filling it later
              doesn't move anything. Unreserved mode has no slot → the banner pushes
              the paragraph down when it loads. */}
          <div style={{ minHeight: reserveSlot ? 90 : 0 }}>
            {banner && (
              <div
                style={{
                  height: 90,
                  background: 'var(--mantine-color-indigo-light)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size="sm" fw={600}>late-loaded banner (90px)</Text>
              </div>
            )}
          </div>
          <Text size="sm" mt="sm">
            This paragraph is the content users came to read. When a banner loads above it{' '}
            <b>without reserved space</b>, this text jumps downward — a layout shift. With a reserved
            slot, the banner fills pre-allocated space and this text never moves.
          </Text>
        </div>
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Trigger late content and watch layout-shift entries." />
    </Stack>
  );
}
