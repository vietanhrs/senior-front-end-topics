import { useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const TRIALS = 2000;

// Probe the live environment. SAB needs cross-origin isolation (COOP/COEP),
// which a plain dev/preview server doesn't set — so we surface the real state.
const hasSAB = typeof SharedArrayBuffer !== 'undefined';
const isolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;

// A model of the publication bug: the producer writes `data` then flips `ready`.
// Under relaxed ordering (no atomics) those two stores can be observed OUT OF
// ORDER, so a consumer that sees ready===1 may still read a stale data===0.
// Atomic store-release / load-acquire forbids that reordering.
function runTrials(atomic: boolean) {
  let staleReads = 0;
  for (let i = 0; i < TRIALS; i++) {
    // produce: logically data=42 then ready=1
    // observe order at the consumer:
    const reordered = !atomic && Math.random() < 0.5; // relaxed: writes may be seen reordered
    const consumerSeesReadyBeforeData = reordered;
    // consumer spins until ready===1, then reads data
    const dataVisibleWhenReady = !consumerSeesReadyBeforeData;
    if (!dataVisibleWhenReady) staleReads += 1;
  }
  return staleReads;
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [relaxedFails, setRelaxedFails] = useState<number | null>(null);
  const [atomicFails, setAtomicFails] = useState<number | null>(null);

  const run = (atomic: boolean) => {
    const fails = runTrials(atomic);
    if (atomic) setAtomicFails(fails);
    else setRelaxedFails(fails);
    log(
      `${atomic ? 'atomic (release/acquire)' : 'relaxed (plain writes)'}: ${fails}/${TRIALS} trials read stale data after seeing ready=1`,
      atomic ? 'success' : 'error',
    );
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="The publication bug: write data, then flip a flag">
        A producer writes <code>data = 42</code> then <code>ready = 1</code>; a consumer spins until{' '}
        <code>ready === 1</code> then reads <code>data</code>. With <b>plain</b> writes the two stores
        can be observed out of order, so the consumer sometimes reads stale <code>data = 0</code>.
        An atomic <b>store-release / load-acquire</b> pair forbids that reordering. This runs{' '}
        {TRIALS.toLocaleString()} modeled trials per mode.
      </Callout>

      <DemoCard title="Live environment probe">
        <Group>
          <Badge variant="light" color={hasSAB ? 'teal' : 'red'}>
            SharedArrayBuffer {hasSAB ? 'available' : 'missing'}
          </Badge>
          <Badge variant="light" color={isolated ? 'teal' : 'orange'}>
            crossOriginIsolated: {String(isolated)}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" mt={6}>
          Real SAB sharing with a worker needs <code>crossOriginIsolated === true</code> (COOP +
          COEP headers). A normal dev/preview server doesn't set them, so the trials below{' '}
          <b>model</b> the memory ordering rather than racing real threads.
        </Text>
      </DemoCard>

      <Group>
        <Button color="red" onClick={() => run(false)}>Run relaxed (plain writes)</Button>
        <Button color="teal" onClick={() => run(true)}>Run atomic (release/acquire)</Button>
        <Button variant="subtle" onClick={() => { clear(); setRelaxedFails(null); setAtomicFails(null); }}>
          Clear
        </Button>
      </Group>

      <Group grow>
        <DemoCard title="❌ Relaxed (no atomics)">
          <Badge size="lg" color={relaxedFails ? 'red' : 'gray'} variant="light">
            {relaxedFails === null ? 'not run' : `${relaxedFails} stale reads`}
          </Badge>
        </DemoCard>
        <DemoCard title="✅ Atomic store-release / load-acquire">
          <Badge size="lg" color={atomicFails === 0 ? 'teal' : 'gray'} variant="light">
            {atomicFails === null ? 'not run' : `${atomicFails} stale reads`}
          </Badge>
        </DemoCard>
      </Group>

      <LogConsole logs={logs} height={140} empty="Run both modes and compare stale-read counts." />
    </Stack>
  );
}
