import { useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fake search: latency shrinks as the query grows, so earlier (shorter) queries
// resolve LATER — reliably producing the out-of-order race.
async function fakeSearch(query: string, latency: number) {
  await delay(latency);
  return `results for "${query}"`;
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [query, setQuery] = useState('');
  const [naive, setNaive] = useState('—');
  const [guarded, setGuarded] = useState('—');
  const latestId = useRef(0);

  const fire = (q: string, latency: number) => {
    const id = ++latestId.current;
    log(`request #${id} "${q}" (latency ${latency}ms) sent`, 'sync');
    fakeSearch(q, latency).then((res) => {
      // Naive: applies every response as it arrives → last-to-resolve wins (stale).
      setNaive(res);
      // Guarded: applies only if this is still the latest request.
      if (id === latestId.current) {
        setGuarded(res);
        log(`request #${id} applied (latest)`, 'success');
      } else {
        log(`request #${id} "${q}" resolved but is STALE → guarded ignores it`, 'macro');
      }
    });
  };

  const runScripted = () => {
    clear();
    setNaive('—');
    setGuarded('—');
    latestId.current = 0;
    setQuery('abc');
    // Fired newest-last; latencies make the OLDEST resolve LAST.
    fire('a', 900);
    fire('ab', 350);
    fire('abc', 120);
    log('expected correct result: "results for \\"abc\\"" (the latest query)', 'micro');
  };

  const onType = (value: string) => {
    setQuery(value);
    if (value.trim() === '') {
      setNaive('—');
      setGuarded('—');
      return;
    }
    // Shorter queries get longer latency → live typing also races.
    const latency = 200 + Math.max(0, 900 - value.length * 120) + Math.random() * 150;
    fire(value, Math.round(latency));
  };

  const expected = query.trim() ? `results for "${query}"` : '—';
  const naiveWrong = naive !== '—' && expected !== '—' && naive !== expected;
  const guardedWrong = guarded !== '—' && expected !== '—' && guarded !== expected;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Out-of-order responses: apply the latest, not the last">
        Both panels run the same searches; responses arrive out of order (older/shorter queries are
        slower here). The <b>naive</b> panel calls <code>setState</code> on every response, so the
        slowest, oldest one wins — showing stale results. The <b>guarded</b> panel tags each request
        and applies only the latest. Try the scripted race, or just type.
      </Callout>

      <Group align="flex-end">
        <TextInput
          flex={1}
          label="search (type fast)"
          value={query}
          onChange={(e) => onType(e.currentTarget.value)}
          placeholder="type a query…"
        />
        <Button onClick={runScripted}>Run scripted race</Button>
        <Button variant="subtle" onClick={() => { clear(); setNaive('—'); setGuarded('—'); }}>
          Clear
        </Button>
      </Group>

      <Text size="sm">
        Expected (matches current query): <b>{expected}</b>
      </Text>

      <Group grow>
        <DemoCard
          title="❌ Naive (last response wins)"
          right={<Badge color={naiveWrong ? 'red' : 'gray'} variant="light">{naiveWrong ? 'STALE' : 'ok'}</Badge>}
        >
          <Text size="sm" ff="monospace">{naive}</Text>
        </DemoCard>
        <DemoCard
          title="✅ Guarded (latest request wins)"
          right={<Badge color={guardedWrong ? 'red' : 'teal'} variant="light">{guardedWrong ? 'STALE' : 'correct'}</Badge>}
        >
          <Text size="sm" ff="monospace">{guarded}</Text>
        </DemoCard>
      </Group>

      <LogConsole logs={logs} height={160} empty="Run the scripted race or type to see out-of-order responses." />
    </Stack>
  );
}
