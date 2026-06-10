import { useRef, useState } from 'react';
import { Badge, Button, Group, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type Strategy = 'none' | 'prefetch' | 'prerender';

const FETCH_MS = 900; // network: fetch the document
const RENDER_MS = 700; // parse + render the page

const PAGES = ['Product A', 'Product B', 'Product C'];

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [strategy, setStrategy] = useState<Strategy>('none');
  // page -> 'none' | 'fetched' | 'rendered'
  const stateRef = useRef<Record<string, 'none' | 'fetched' | 'rendered'>>({});
  const [navigated, setNavigated] = useState<string | null>(null);
  const [navMs, setNavMs] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function speculate(page: string) {
    const st = stateRef.current[page] ?? 'none';
    if (strategy === 'none' || st !== 'none') return;
    if (strategy === 'prefetch') {
      log(`hover → prefetch "${page}" HTML (eagerness: moderate)…`, 'macro');
      timersRef.current.push(
        setTimeout(() => {
          stateRef.current[page] = 'fetched';
          log(`prefetch of "${page}" complete (HTML cached)`, 'success');
        }, FETCH_MS),
      );
    } else {
      log(`hover → PRERENDER "${page}" in a hidden context…`, 'macro');
      timersRef.current.push(
        setTimeout(() => {
          stateRef.current[page] = 'fetched';
          timersRef.current.push(
            setTimeout(() => {
              stateRef.current[page] = 'rendered';
              log(`"${page}" fully prerendered (analytics gated on prerenderingchange)`, 'success');
            }, RENDER_MS),
          );
        }, FETCH_MS),
      );
    }
  }

  async function navigate(page: string) {
    if (busy) return;
    setBusy(true);
    setNavigated(null);
    const st = stateRef.current[page] ?? 'none';
    const t0 = performance.now();
    log(`CLICK "${page}" (state: ${st})`, 'sync');

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    if (st === 'none') {
      log(`fetching… (${FETCH_MS}ms)`, 'macro');
      await wait(FETCH_MS);
      log(`rendering… (${RENDER_MS}ms)`, 'macro');
      await wait(RENDER_MS);
    } else if (st === 'fetched') {
      log(`HTML already prefetched → rendering only (${RENDER_MS}ms)`, 'micro');
      await wait(RENDER_MS);
    } else {
      log('page already prerendered → ACTIVATE (≈0ms)', 'success');
      await wait(30);
    }
    const ms = Math.round(performance.now() - t0);
    setNavMs(ms);
    setNavigated(page);
    setBusy(false);
    log(`navigation visible in ${ms}ms`, ms < 100 ? 'success' : ms < FETCH_MS ? 'micro' : 'error');
  }

  function reset() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    stateRef.current = {};
    setNavigated(null);
    setNavMs(null);
    clear();
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Hover, wait a beat, then click">
        Pick a strategy, <b>hover</b> a link for ~a second (that's <code>eagerness: moderate</code>
        firing the speculation), then click it. <b>None</b>: full fetch+render (~{FETCH_MS + RENDER_MS}ms).{' '}
        <b>Prefetch</b>: HTML is ready, only render remains (~{RENDER_MS}ms). <b>Prerender</b>: the
        hidden page just activates (~0ms). Clicking without hovering shows the cost of a missed guess.
      </Callout>

      <SegmentedControl
        value={strategy}
        onChange={(v) => {
          setStrategy(v as Strategy);
          reset();
        }}
        fullWidth
        data={[
          { label: 'No speculation', value: 'none' },
          { label: 'prefetch (HTML only)', value: 'prefetch' },
          { label: 'prerender (full page)', value: 'prerender' },
        ]}
      />

      <DemoCard
        title="Product links"
        right={
          navMs != null && (
            <Badge size="lg" color={navMs < 100 ? 'teal' : navMs <= RENDER_MS + 50 ? 'yellow' : 'red'} variant="filled">
              navigation: {navMs}ms
            </Badge>
          )
        }
      >
        <Group mb="md">
          {PAGES.map((p) => (
            <Button
              key={p}
              variant="light"
              onMouseEnter={() => speculate(p)}
              onClick={() => navigate(p)}
              disabled={busy}
            >
              {p} →
            </Button>
          ))}
          <Button variant="subtle" onClick={reset}>
            Reset
          </Button>
        </Group>
        <Paper withBorder radius="md" p="md" mih={70} className="text-center">
          {navigated ? (
            <Text fw={600}>📄 {navigated} page shown ({navMs}ms after click)</Text>
          ) : (
            <Text c="dimmed" size="sm">
              {busy ? 'navigating…' : 'destination page appears here'}
            </Text>
          )}
        </Paper>
      </DemoCard>

      <LogConsole logs={logs} height={180} empty="Hover a link to speculate, then click to navigate." />
    </Stack>
  );
}
