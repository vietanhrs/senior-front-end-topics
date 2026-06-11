import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface FeedEntry {
  id: number;
  type: string;
  name: string;
  startTime: number;
  duration: number;
}

const WATCH = [
  'paint',
  'largest-contentful-paint',
  'layout-shift',
  'event',
  'longtask',
  'resource',
  'navigation',
  'mark',
  'measure',
];

const typeColor: Record<string, string> = {
  paint: 'cyan',
  'largest-contentful-paint': 'grape',
  'layout-shift': 'orange',
  event: 'blue',
  longtask: 'red',
  resource: 'gray',
  navigation: 'teal',
  mark: 'lime',
  measure: 'indigo',
};

const supportedTypes =
  typeof PerformanceObserver !== 'undefined'
    ? (PerformanceObserver.supportedEntryTypes ?? [])
    : [];

export function Demo() {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;
    const observers: PerformanceObserver[] = [];
    for (const type of WATCH) {
      if (!supportedTypes.includes(type)) continue;
      try {
        const po = new PerformanceObserver((list) => {
          const add = list.getEntries().map((e) => ({
            id: idRef.current++,
            type: e.entryType,
            name: e.name.length > 40 ? `${e.name.slice(0, 37)}…` : e.name,
            startTime: e.startTime,
            duration: e.duration,
          }));
          setFeed((prev) => [...add.reverse(), ...prev].slice(0, 40));
        });
        // single-type form so buffered replays pre-existing entries
        po.observe({ type, buffered: true });
        observers.push(po);
      } catch {
        /* skip unsupported */
      }
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const addMark = () => {
    performance.mark('demo-start');
    setTimeout(() => {
      performance.mark('demo-end');
      performance.measure('demo-task', 'demo-start', 'demo-end');
    }, 120);
  };

  const longTask = () => {
    const end = performance.now() + 80;
    while (performance.now() < end) {
      /* block > 50ms → a longtask entry */
    }
  };

  const fetchResource = () => {
    // a same-origin request → a 'resource' entry (initiatorType 'fetch')
    fetch(`${location.pathname}?perf=${Date.now()}`, { cache: 'no-store' }).catch(() => {});
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="One observer API, every metric type">
        Observers for {WATCH.length} entry types are attached (with <code>buffered: true</code>, so
        existing entries replay on mount). Generate events and watch them stream into the timeline:
        a <code>mark</code>+<code>measure</code>, a <code>longtask</code>, a <code>resource</code>{' '}
        fetch — plus any <code>event</code>/<code>layout-shift</code> your clicks cause.
      </Callout>

      <DemoCard title="supportedEntryTypes (this engine)">
        <Group gap={6}>
          {WATCH.map((t) => (
            <Badge key={t} size="sm" variant={supportedTypes.includes(t) ? 'light' : 'outline'} color={supportedTypes.includes(t) ? typeColor[t] : 'gray'}>
              {t}{supportedTypes.includes(t) ? '' : ' ✕'}
            </Badge>
          ))}
        </Group>
      </DemoCard>

      <Group>
        <Button onClick={addMark}>mark + measure</Button>
        <Button color="red" onClick={longTask}>trigger long task</Button>
        <Button color="gray" onClick={fetchResource}>fetch a resource</Button>
        <Button variant="subtle" onClick={() => setFeed([])}>Clear feed</Button>
      </Group>

      <DemoCard title="Performance timeline feed (newest first)">
        {feed.length === 0 ? (
          <Text size="sm" c="dimmed">No entries yet — generate some above.</Text>
        ) : (
          <Table withRowBorders={false} stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>type</Table.Th>
                <Table.Th>name</Table.Th>
                <Table.Th>start</Table.Th>
                <Table.Th>duration</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {feed.map((e) => (
                <Table.Tr key={e.id}>
                  <Table.Td>
                    <Badge size="xs" variant="light" color={typeColor[e.type] ?? 'gray'}>{e.type}</Badge>
                  </Table.Td>
                  <Table.Td><Text size="xs" ff="monospace">{e.name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="xs">{e.startTime.toFixed(0)}ms</Text></Table.Td>
                  <Table.Td><Text size="xs">{e.duration ? `${e.duration.toFixed(0)}ms` : '—'}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </DemoCard>
    </Stack>
  );
}
