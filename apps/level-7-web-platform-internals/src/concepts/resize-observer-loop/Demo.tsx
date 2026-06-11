import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type Mode = 'buggy' | 'fixed';
type Box = 'content-box' | 'border-box';

export function Demo() {
  const { logs, log, clear } = useLogger();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<Mode>('buggy');
  const [box, setBox] = useState<Box>('content-box');
  const [running, setRunning] = useState(false);
  const [loopErrors, setLoopErrors] = useState(0);
  const [passes, setPasses] = useState(0);
  const [width, setWidth] = useState(0);

  // Capture the window-level "ResizeObserver loop" error the spec dispatches.
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (/ResizeObserver loop/i.test(e.message)) {
        setLoopErrors((n) => n + 1);
        log(`window 'error': ${e.message}`, 'error');
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, [log]);

  useEffect(() => {
    if (!running) return;
    const el = boxRef.current;
    if (!el) return;

    // Reset to a known starting width so the run is reproducible.
    el.style.width = '120px';
    setPasses(0);
    setLoopErrors(0);
    let passCount = 0;

    const ro = new ResizeObserver((entries) => {
      passCount += 1;
      setPasses(passCount);
      for (const entry of entries) {
        const size =
          box === 'border-box'
            ? entry.borderBoxSize[0].inlineSize
            : entry.contentBoxSize[0].inlineSize;
        setWidth(Math.round(size));

        // Stop once we've grown enough — keeps the demo bounded (no true hang).
        if (size >= 320) {
          log(`reached ${Math.round(size)}px after ${passCount} pass(es) — stopping`, 'macro');
          ro.disconnect();
          setRunning(false);
          return;
        }

        if (mode === 'buggy') {
          // ❌ Synchronously resize the OBSERVED element inside its own callback.
          // Each write schedules another notification → the loop the spec bounds
          // to one pass/frame, emitting the window error and churning a frame.
          el.style.width = `${size + 20}px`;
          log(`buggy: grew observed element to ${Math.round(size) + 20}px in-callback`, 'sync');
        } else {
          // ✅ Defer the write to the next frame: reads this frame, writes next.
          // The mutation no longer feeds back synchronously, so no loop error.
          requestAnimationFrame(() => {
            el.style.width = `${size + 20}px`;
          });
          log(`fixed: deferred grow to rAF (now ${Math.round(size)}px)`, 'success');
        }
      }
    });

    ro.observe(el, { box });
    log(`observing with box="${box}", mode="${mode}"`, 'macro');
    return () => ro.disconnect();
  }, [running, mode, box, log]);

  return (
    <Stack gap="md">
      <Callout kind="warning" title="Trigger the famous loop, then fix it">
        Both modes grow an element from 120px to 320px from inside the RO callback. The{' '}
        <b>buggy</b> mode writes the new width <i>synchronously</i> in the callback — the browser
        bounds RO to one pass per frame and dispatches{' '}
        <code>"ResizeObserver loop completed with undelivered notifications"</code> on{' '}
        <code>window</code>. The <b>fixed</b> mode defers the write to{' '}
        <code>requestAnimationFrame</code>, breaking the synchronous feedback — no error.
      </Callout>

      <Group grow>
        <div>
          <Text size="sm" fw={500} mb={4}>mode</Text>
          <SegmentedControl
            fullWidth
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            disabled={running}
            data={[
              { label: '❌ buggy (sync write)', value: 'buggy' },
              { label: '✅ fixed (rAF defer)', value: 'fixed' },
            ]}
          />
        </div>
        <div>
          <Text size="sm" fw={500} mb={4}>box</Text>
          <SegmentedControl
            fullWidth
            value={box}
            onChange={(v) => setBox(v as Box)}
            disabled={running}
            data={[
              { label: 'content-box', value: 'content-box' },
              { label: 'border-box', value: 'border-box' },
            ]}
          />
        </div>
      </Group>

      <Group>
        <Button onClick={() => { clear(); setRunning(true); }} disabled={running}>
          Run resize loop
        </Button>
        <Badge variant="light">width {width}px</Badge>
        <Badge variant="light" color="grape">passes {passes}</Badge>
        <Badge variant="light" color={loopErrors ? 'red' : 'teal'}>
          loop errors {loopErrors}
        </Badge>
      </Group>

      <DemoCard title="Observed element (border shows the box it grows)">
        <div className="overflow-hidden rounded-md border p-3">
          <div
            ref={boxRef}
            className="rounded-md border-2 border-dashed p-3"
            style={{ width: 120, boxSizing: box, transition: 'none' }}
          >
            <Text size="xs" c="dimmed">observed</Text>
          </div>
        </div>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Press Run to drive the ResizeObserver." />
    </Stack>
  );
}
