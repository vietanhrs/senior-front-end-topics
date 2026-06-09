import { useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Switch } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const ROWS = 3000;

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [cv, setCv] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function measure() {
    const host = scrollRef.current;
    if (!host) return;
    // Force a style/layout flush several times and time it. With
    // content-visibility:auto, offscreen rows are skipped → cheaper layout.
    const t0 = performance.now();
    for (let i = 0; i < 30; i++) {
      host.style.setProperty('--n', String(i)); // invalidate
      void host.offsetHeight; // force synchronous layout
    }
    const ms = performance.now() - t0;
    log(
      `${cv ? 'content-visibility: auto' : 'no containment'} — 30 forced layouts of ${ROWS} rows = ${ms.toFixed(1)}ms`,
      cv ? 'success' : 'error',
    );
  }

  const rowStyle: React.CSSProperties = cv
    ? { contentVisibility: 'auto', containIntrinsicSize: 'auto 40px' }
    : {};

  return (
    <Stack gap="md">
      <Callout kind="info" title="Measure layout cost with and without containment">
        A {ROWS}-row list, each row with nested content. Toggle <code>content-visibility: auto</code>
        and click Measure a few times in each mode. With containment, the browser skips layout/paint
        of off-screen rows, so the forced-layout timing drops. (Effect varies by browser/device; the
        gap grows with row count and complexity.)
      </Callout>

      <Group justify="space-between">
        <Switch
          label="content-visibility: auto (+ contain-intrinsic-size)"
          checked={cv}
          onChange={(e) => setCv(e.currentTarget.checked)}
        />
        <Group gap="xs">
          <Badge variant="light">{ROWS} rows</Badge>
          <Button size="xs" onClick={measure}>
            Measure forced layout
          </Button>
          <Button size="xs" variant="default" onClick={clear}>
            Clear
          </Button>
        </Group>
      </Group>

      <DemoCard title="The list">
        <div ref={scrollRef} className="h-64 overflow-auto rounded-md border">
          {Array.from({ length: ROWS }, (_, i) => (
            <div key={i} style={rowStyle} className="flex items-center gap-2 border-b px-3 py-2">
              <span className="inline-block h-5 w-5 rounded-full" style={{ background: `hsl(${(i * 11) % 360} 70% 55%)` }} />
              <span className="text-sm font-medium">Row {i}</span>
              <span className="text-xs text-[var(--mantine-color-dimmed)]">
                nested · content · {i * 7} · {(i * 13).toString(16)} · contained={String(cv)}
              </span>
            </div>
          ))}
        </div>
      </DemoCard>

      <LogConsole logs={logs} height={140} empty="Toggle the switch and measure in each mode." />
    </Stack>
  );
}
