import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Loader, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type Mode = 'blocking' | 'streaming';
type Phase = 'idle' | 'waiting' | 'shell' | 'sidebar' | 'main';

// Section resolve times (sidebar resolves AFTER main here, to show out-of-order flush).
const SHELL_MS = 150;
const MAIN_MS = 900;
const SIDEBAR_MS = 1500;

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [mode, setMode] = useState<Mode>('streaming');
  const [shell, setShell] = useState(false);
  const [main, setMain] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [ttfb, setTtfb] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setShell(false); setMain(false); setSidebar(false); setTtfb(null);
  }

  function run() {
    reset();
    clear();
    const t0 = performance.now();
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

    if (mode === 'blocking') {
      log('renderToString: server waits for ALL data before sending a single byte…', 'macro');
      // nothing paints until the slowest (sidebar) resolves
      at(SIDEBAR_MS, () => {
        setShell(true); setMain(true); setSidebar(true);
        setTtfb(Math.round(performance.now() - t0));
        log(`whole document sent at once after ${SIDEBAR_MS}ms (blank until then)`, 'error');
      });
      return;
    }

    log('renderToPipeableStream: flush the shell immediately, stream boundaries as they resolve', 'macro');
    at(SHELL_MS, () => {
      setShell(true);
      setTtfb(Math.round(performance.now() - t0));
      log(`shell + skeletons flushed (+${SHELL_MS}ms) → browser paints now (fast FCP)`, 'success');
    });
    at(MAIN_MS, () => {
      setMain(true);
      log(`main content resolved (+${MAIN_MS}ms) → streamed + swap script runs (arrives before sidebar!)`, 'sync');
    });
    at(SIDEBAR_MS, () => {
      setSidebar(true);
      log(`sidebar resolved (+${SIDEBAR_MS}ms) → streamed last, slotted into place`, 'micro');
    });
  }

  const phase: Phase = !shell ? (ttfb == null && mode === 'blocking' ? 'waiting' : 'idle') : 'shell';
  void phase;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Shell first, slow sections stream in">
        Sidebar is the slowest dependency ({SIDEBAR_MS}ms); main resolves at {MAIN_MS}ms.{' '}
        <b>Blocking</b> SSR shows nothing until the slowest finishes. <b>Streaming</b> paints the
        shell at ~{SHELL_MS}ms, then streams main and sidebar as they resolve — note main arrives
        and swaps in <i>before</i> sidebar (out-of-order flush).
      </Callout>

      <Group justify="space-between">
        <SegmentedControl
          value={mode}
          onChange={(v) => { setMode(v as Mode); reset(); clear(); }}
          data={[
            { label: 'Blocking (renderToString)', value: 'blocking' },
            { label: 'Streaming (renderToPipeableStream)', value: 'streaming' },
          ]}
        />
        <Group gap="xs">
          {ttfb != null && (
            <Badge color={ttfb < 400 ? 'teal' : 'red'} variant="filled">
              first paint @ {ttfb}ms
            </Badge>
          )}
          <Button size="xs" onClick={run}>Request page</Button>
        </Group>
      </Group>

      <DemoCard title="Browser viewport">
        <Stack gap="sm">
          {!shell ? (
            <Group justify="center" p="xl">
              <Loader size="sm" />
              <Text c="dimmed" size="sm">{mode === 'blocking' ? 'blank — waiting for ALL data…' : 'connecting…'}</Text>
            </Group>
          ) : (
            <>
              <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-default-hover)">
                <Text size="sm" fw={700}>Header / nav (in the shell)</Text>
              </Paper>
              <Group align="stretch" grow>
                <Section title="Main article" ready={main} />
                <Section title="Sidebar (slowest)" ready={sidebar} />
              </Group>
            </>
          )}
        </Stack>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Request the page in each mode and compare first paint." />
    </Stack>
  );
}

function Section({ title, ready }: { title: string; ready: boolean }) {
  return (
    <Paper withBorder radius="md" p="sm" mih={90}>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600}>{title}</Text>
        <Badge size="xs" color={ready ? 'teal' : 'orange'} variant="light">
          {ready ? 'streamed in' : 'skeleton (fallback)'}
        </Badge>
      </Group>
      {ready ? (
        <Text size="sm">Real content, streamed from the server and swapped into the shell.</Text>
      ) : (
        <Stack gap={6}>
          <div className="h-3 w-3/4 rounded" style={{ background: 'var(--mantine-color-default-hover)' }} />
          <div className="h-3 w-1/2 rounded" style={{ background: 'var(--mantine-color-default-hover)' }} />
        </Stack>
      )}
    </Paper>
  );
}
