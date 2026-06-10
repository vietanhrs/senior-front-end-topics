import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Slider, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Row {
  mode: 'clone' | 'transfer';
  sizeMB: number;
  roundtripMs: number;
  senderByteLengthAfter: number;
}

export function Demo() {
  const [sizeMB, setSizeMB] = useState(32);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  function getWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./echo.worker.ts', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  }

  function makeBuffer(): ArrayBuffer {
    const buf = new ArrayBuffer(sizeMB * 1024 * 1024);
    const view = new Uint8Array(buf);
    // touch a few pages so it's real, committed memory
    for (let i = 0; i < view.length; i += 65536) view[i] = i & 0xff;
    return buf;
  }

  function send(mode: 'clone' | 'transfer') {
    setBusy(true);
    const worker = getWorker();
    const buffer = makeBuffer();
    const t0 = performance.now();
    worker.onmessage = () => {
      const roundtripMs = performance.now() - t0;
      setRows((r) => [
        { mode, sizeMB, roundtripMs, senderByteLengthAfter: buffer.byteLength },
        ...r,
      ]);
      setBusy(false);
    };
    if (mode === 'transfer') {
      worker.postMessage({ buffer, transferBack: false }, [buffer]); // zero-copy handoff → detaches `buffer`
    } else {
      worker.postMessage({ buffer, transferBack: false }); // structured clone → copies
    }
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Copy vs handoff — and the detachment side effect">
        Both buttons send the same {sizeMB}MB <code>ArrayBuffer</code> to a real worker.{' '}
        <b>Clone</b> deep-copies it (sender keeps its buffer). <b>Transfer</b> hands the memory over
        with zero copy — and the sender's buffer becomes <b>detached</b> (<code>byteLength → 0</code>).
        Watch the round-trip time gap widen as you increase the size.
      </Callout>

      <DemoCard title={`Buffer size: ${sizeMB} MB`}>
        <Slider value={sizeMB} onChange={setSizeMB} min={4} max={128} step={4} disabled={busy} marks={[{ value: 4, label: '4' }, { value: 64, label: '64' }, { value: 128, label: '128' }]} mb="lg" />
        <Group>
          <Button color="orange" variant="light" onClick={() => send('clone')} disabled={busy}>
            postMessage (clone / copy)
          </Button>
          <Button color="teal" onClick={() => send('transfer')} disabled={busy}>
            postMessage (transfer)
          </Button>
          <Button variant="subtle" onClick={() => setRows([])} disabled={busy}>
            Clear
          </Button>
        </Group>
      </DemoCard>

      <DemoCard title="Results">
        {rows.length === 0 ? (
          <Text size="sm" c="dimmed">Send a buffer to compare. Larger sizes make the copy cost obvious.</Text>
        ) : (
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Mode</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Round-trip</Table.Th>
                <Table.Th>Sender buffer after</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <Badge color={r.mode === 'transfer' ? 'teal' : 'orange'} variant="light">{r.mode}</Badge>
                  </Table.Td>
                  <Table.Td>{r.sizeMB} MB</Table.Td>
                  <Table.Td><Text ff="monospace" size="sm">{r.roundtripMs.toFixed(1)} ms</Text></Table.Td>
                  <Table.Td>
                    <Badge color={r.senderByteLengthAfter === 0 ? 'red' : 'gray'} variant="light">
                      byteLength = {r.senderByteLengthAfter.toLocaleString()}{r.senderByteLengthAfter === 0 ? ' (detached)' : ''}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        <Text size="xs" c="dimmed" mt="sm">
          Note the transfer rows: the sender's <code>byteLength</code> is <b>0</b> afterwards — the
          memory now belongs to the worker. Read it after transferring and you'd get empty data.
        </Text>
      </DemoCard>
    </Stack>
  );
}
