import { useState } from 'react';
import { Badge, Button, Code, Group, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [mode, setMode] = useState<'nonatomic' | 'atomic'>('nonatomic');
  const [result, setResult] = useState<{ final: number; expected: number } | null>(null);

  const isolated = typeof self !== 'undefined' && (self as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated === true;
  const sabAvailable = typeof SharedArrayBuffer !== 'undefined';

  // We can't create a real data race single-threaded, so we simulate the
  // classic interleaving of two "threads" each incrementing 5 times, using a
  // real Int32Array + real Atomics for the atomic path.
  function run() {
    clear();
    const view = new Int32Array(new ArrayBuffer(4)); // regular buffer; Atomics still works on it
    view[0] = 0;
    const PER_THREAD = 5;
    const expected = PER_THREAD * 2;

    if (mode === 'atomic') {
      log('Two threads each call Atomics.add(view, 0, 1) ×5, fully interleaved…', 'macro');
      for (let i = 0; i < PER_THREAD; i++) {
        const prevA = Atomics.add(view, 0, 1);
        const prevB = Atomics.add(view, 0, 1);
        log(`A: add→${prevA}→${prevA + 1}  |  B: add→${prevB}→${prevB + 1}`, 'sync');
      }
      log(`final = ${Atomics.load(view, 0)} (every increment counted)`, 'success');
      setResult({ final: Atomics.load(view, 0), expected });
    } else {
      log('Two threads do non-atomic read→+1→write, interleaved so both read the SAME value…', 'macro');
      // Simulate the lost-update interleaving: both read v, both write v+1.
      for (let i = 0; i < PER_THREAD; i++) {
        const a = view[0]; // thread A reads
        const b = view[0]; // thread B reads the SAME value (race window)
        view[0] = a + 1; // A writes
        view[0] = b + 1; // B overwrites with the same result → one increment lost
        log(`A reads ${a}, B reads ${b} → both write ${a + 1} (one update LOST)`, 'error');
      }
      log(`final = ${view[0]} but expected ${expected} → ${expected - view[0]} lost updates`, 'error');
      setResult({ final: view[0], expected });
    }
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Shared memory needs atomics — and cross-origin isolation">
        Real <code>SharedArrayBuffer</code> requires a cross-origin-isolated context (COOP + COEP).
        This workbook isn't isolated, so SAB may be unavailable here — but the <b>Atomics</b>
        correctness lesson is the same on any buffer. The non-atomic path below simulates the
        classic lost-update race; the atomic path uses real <code>Atomics.add</code>.
      </Callout>

      <DemoCard title="Environment">
        <Table withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>self.crossOriginIsolated</Table.Td>
              <Table.Td><Badge color={isolated ? 'teal' : 'orange'} variant="light">{String(isolated)}</Badge></Table.Td>
              <Table.Td><Text size="xs" c="dimmed">needs COOP: same-origin + COEP: require-corp</Text></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>typeof SharedArrayBuffer</Table.Td>
              <Table.Td><Badge color={sabAvailable ? 'teal' : 'orange'} variant="light">{typeof SharedArrayBuffer}</Badge></Table.Td>
              <Table.Td><Text size="xs" c="dimmed">{sabAvailable ? 'present (but real sharing still needs isolation)' : 'gated off without isolation'}</Text></Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </DemoCard>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Non-atomic read-modify-write (races)', value: 'nonatomic' },
          { label: 'Atomics.add (correct)', value: 'atomic' },
        ]}
      />

      <DemoCard
        title="Two threads × 5 increments"
        right={
          result && (
            <Badge size="lg" color={result.final === result.expected ? 'teal' : 'red'} variant="filled">
              final {result.final} / expected {result.expected}
            </Badge>
          )
        }
      >
        <Group mb="md">
          <Button onClick={run}>Run interleaved increments</Button>
        </Group>
        <Text size="xs" c="dimmed" mb="sm">
          Non-atomic: <Code>v = v + 1</Code> is read→add→write; interleave two threads and updates
          collide → final &lt; expected. Atomic: <Code>Atomics.add</Code> is indivisible → every
          increment lands.
        </Text>
        <LogConsole logs={logs} height={190} empty="Run to see the interleaving step by step." />
      </DemoCard>
    </Stack>
  );
}
