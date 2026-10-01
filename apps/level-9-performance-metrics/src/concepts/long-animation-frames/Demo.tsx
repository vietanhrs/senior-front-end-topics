import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type ScriptTiming = {
  duration?: number;
  sourceURL?: string;
  sourceFunctionName?: string;
};

type LoafEntry = PerformanceEntry & {
  blockingDuration?: number;
  scripts?: ScriptTiming[];
};

type Row = {
  id: number;
  duration: number;
  blockingDuration: number;
  topScript: string;
};

const supported =
  typeof PerformanceObserver !== 'undefined' &&
  PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame');

const block = (ms: number) => {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // Intentionally block the main thread for the demo.
  }
};

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [frames, setFrames] = useState<Row[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!supported) return;

    const observer = new PerformanceObserver((list) => {
      for (const rawEntry of list.getEntries()) {
        const entry = rawEntry as LoafEntry;
        const topScript = [...(entry.scripts ?? [])]
          .sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0))[0];

        const label =
          topScript?.sourceFunctionName ||
          topScript?.sourceURL?.split('/').pop() ||
          'unknown / unattributed';

        setFrames((prev) =>
          [
            {
              id: idRef.current++,
              duration: entry.duration,
              blockingDuration: entry.blockingDuration ?? 0,
              topScript: label,
            },
            ...prev,
          ].slice(0, 10),
        );

        log(
          `LoAF: ${entry.duration.toFixed(0)}ms, blocking ${(entry.blockingDuration ?? 0).toFixed(0)}ms`,
          'error',
        );
      }
    });

    observer.observe({ type: 'long-animation-frame', buffered: true });
    return () => observer.disconnect();
  }, [log]);

  const triggerJank = () => {
    log('blocking the main thread for ~140ms, then forcing a render…', 'macro');
    block(140);
    document.body.getBoundingClientRect();
  };

  const reset = () => {
    setFrames([]);
    clear();
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="Long task vs long animation frame">
        A long task tells you that JavaScript blocked the main thread. A Long Animation Frame (LoAF)
        tells you that a whole rendering update took too long and can also attribute time to the
        scripts that contributed to it.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="LoAF is not available in this browser">
          <code>long-animation-frame</code> is still limited across browsers. Open this workbook in
          a supporting Chromium-based browser to populate the table; the theory and exercise still
          apply everywhere.
        </Callout>
      )}

      <Group>
        <Button color="red" onClick={triggerJank}>
          Trigger ~140ms jank
        </Button>
        <Button variant="subtle" onClick={reset}>
          Reset
        </Button>
        <Badge variant="light">{frames.length} LoAFs captured</Badge>
      </Group>

      <DemoCard title="Recent long animation frames">
        {frames.length === 0 ? (
          <Text size="sm" c="dimmed">
            No LoAF entries captured yet.
          </Text>
        ) : (
          <Table withRowBorders={false}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>frame</Table.Th>
                <Table.Th>blocking</Table.Th>
                <Table.Th>largest script attribution</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {frames.map((frame) => (
                <Table.Tr key={frame.id}>
                  <Table.Td>
                    <Badge color="red" variant="light">
                      {frame.duration.toFixed(0)}ms
                    </Badge>
                  </Table.Td>
                  <Table.Td>{frame.blockingDuration.toFixed(0)}ms</Table.Td>
                  <Table.Td>
                    <Text size="sm">{frame.topScript}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </DemoCard>

      <LogConsole logs={logs} height={140} empty="Trigger jank and inspect the captured frame." />
    </Stack>
  );
}
