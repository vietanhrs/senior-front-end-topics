import { useRef, useState } from 'react';
import { Badge, Button, Group, Loader, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const NETWORK_MS = 1500;

// "Server" data that changes over time so revalidation visibly updates content.
function makeServer() {
  let version = 1;
  return {
    fetch(): Promise<string> {
      const v = version;
      return new Promise((r) => setTimeout(() => r(`weather v${v} · ${18 + v}°C`), NETWORK_MS));
    },
    bump() {
      version += 1;
    },
    get version() {
      return version;
    },
  };
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const serverRef = useRef(makeServer());
  const cacheRef = useRef<string | null>(null);
  const [mode, setMode] = useState<'blocking' | 'swr'>('blocking');
  const [shown, setShown] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'revalidating'>('idle');

  async function request() {
    const cached = cacheRef.current;
    if (mode === 'blocking' || !cached) {
      // Normal fetch: blank/spinner until the network answers.
      setShown(mode === 'swr' && cached ? cached : null);
      setState('loading');
      log(`fetch → blocking on network (${NETWORK_MS}ms)…`, 'macro');
      const data = await serverRef.current.fetch();
      cacheRef.current = data;
      setShown(data);
      setState('idle');
      log(`network responded → showing "${data}"`, 'sync');
      return;
    }
    // SWR: serve stale instantly, revalidate behind.
    setShown(cached);
    setState('revalidating');
    log(`SWR: served cached "${cached}" INSTANTLY (0ms) + revalidating in background…`, 'success');
    const data = await serverRef.current.fetch();
    cacheRef.current = data;
    setShown(data);
    setState('idle');
    log(`background revalidation done → UI updated to "${data}"`, 'micro');
  }

  function bumpServer() {
    serverRef.current.bump();
    log(`server data changed (now v${serverRef.current.version}) — cache is stale`, 'sync');
  }

  function reset() {
    serverRef.current = makeServer();
    cacheRef.current = null;
    setShown(null);
    setState('idle');
    clear();
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Feel the difference">
        Request once to fill the cache, click "Change server data" (cache is now stale), then
        request again in each mode. <b>Blocking</b>: a {NETWORK_MS}ms spinner replaces content you
        already had. <b>SWR</b>: stale content shows in 0ms with an "updating…" badge, then swaps to
        fresh when the background revalidation lands.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Blocking fetch (spinner)', value: 'blocking' },
          { label: 'Stale-while-revalidate', value: 'swr' },
        ]}
      />

      <DemoCard
        title="Weather widget"
        right={
          <Group gap="xs">
            <Button size="xs" onClick={request}>
              Request data
            </Button>
            <Button size="xs" variant="light" color="orange" onClick={bumpServer}>
              Change server data
            </Button>
            <Button size="xs" variant="default" onClick={reset}>
              Reset
            </Button>
          </Group>
        }
      >
        <Paper withBorder radius="md" p="lg" className="text-center">
          {state === 'loading' && !shown ? (
            <Group justify="center">
              <Loader size="sm" />
              <Text c="dimmed">loading… (user stares at a spinner)</Text>
            </Group>
          ) : shown ? (
            <Group justify="center" gap="sm">
              <Text fz={24} fw={700}>
                {shown}
              </Text>
              {state === 'revalidating' && (
                <Badge color="orange" variant="light" leftSection={<Loader size={10} color="orange" />}>
                  updating…
                </Badge>
              )}
              {state === 'loading' && shown && <Loader size="xs" />}
            </Group>
          ) : (
            <Text c="dimmed">no data yet — click "Request data"</Text>
          )}
        </Paper>
        <Text size="xs" c="dimmed" mt="sm">
          Equivalent header: <code>Cache-Control: max-age=0, stale-while-revalidate=300</code> ·
          client-side equivalent: React Query / SWR defaults.
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Fill the cache, make it stale, request again." />
    </Stack>
  );
}
