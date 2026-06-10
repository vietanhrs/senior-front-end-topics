import { useRef, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

interface Query {
  q: string;
  latency: number;
}
const SLOW: Query = { q: 'apple', latency: 1500 };
const FAST: Query = { q: 'banana', latency: 400 };

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [mode, setMode] = useState<'buggy' | 'guarded'>('buggy');
  const [current, setCurrent] = useState('—'); // latest intended query
  const [displayed, setDisplayed] = useState('—'); // what results are shown for
  const [pending, setPending] = useState(0);
  const latest = useRef(0);

  function search({ q, latency }: Query) {
    const id = ++latest.current;
    setCurrent(q);
    setPending((p) => p + 1);
    log(`request #${id} for "${q}" sent (latency ${latency}ms)`, 'macro');
    setTimeout(() => {
      setPending((p) => p - 1);
      if (mode === 'guarded' && id !== latest.current) {
        log(`response #${id} ("${q}") arrived but is STALE → ignored`, 'success');
        return;
      }
      setDisplayed(q);
      log(`response #${id} ("${q}") applied to UI`, mode === 'buggy' ? 'error' : 'sync');
    }, latency);
  }

  function triggerRace() {
    clear();
    setDisplayed('—');
    log('Triggering race: search slow "apple", then immediately fast "banana"…', 'sync');
    search(SLOW);
    setTimeout(() => search(FAST), 50);
  }

  const torn = displayed !== '—' && current !== '—' && displayed !== current && pending === 0;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Stale response wins">
        Click "Trigger race": it searches the slow query "apple" then immediately the fast query
        "banana". In <b>buggy</b> mode, "apple" resolves last and overwrites "banana" — the UI shows
        results for a query the user already replaced. In <b>guarded</b> mode, a sequence token drops
        the superseded response.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Buggy (apply any response)', value: 'buggy' },
          { label: 'Guarded (sequence token)', value: 'guarded' },
        ]}
      />

      <DemoCard
        title="Search-as-you-type race"
        right={
          <Group gap="xs">
            <Badge variant="light">pending: {pending}</Badge>
            <Badge color={torn ? 'red' : 'teal'} variant="filled">
              {torn ? 'MISMATCH' : 'consistent'}
            </Badge>
          </Group>
        }
      >
        <Group mb="md">
          <Button onClick={triggerRace}>Trigger race</Button>
          <Button variant="default" onClick={() => search(FAST)}>
            Search "banana" (fast)
          </Button>
          <Button variant="default" onClick={() => search(SLOW)}>
            Search "apple" (slow)
          </Button>
        </Group>
        <Group>
          <Text size="sm">
            current query: <b>{current}</b>
          </Text>
          <Text size="sm">
            results shown for: <b style={{ color: torn ? 'var(--mantine-color-red-6)' : undefined }}>{displayed}</b>
          </Text>
        </Group>
        <LogConsole logs={logs} height={170} empty="Trigger the race to see response ordering." />
      </DemoCard>
    </Stack>
  );
}
