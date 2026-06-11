import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const CHUNKS = 40;
const CHUNK_MS = 4; // synchronous busy work per chunk

function burn(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    /* block the main thread */
  }
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  // A JS-driven heartbeat (NOT a CSS animation, which would keep running on the
  // compositor). It only ticks when a macrotask gets to run.
  const beatRef = useRef(0);
  const [beat, setBeat] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      beatRef.current += 1;
      setBeat(beatRef.current);
    }, 30);
    return () => clearInterval(id);
  }, []);

  const run = (mode: 'micro' | 'macro') => {
    if (running) return;
    setRunning(true);
    const startBeat = beatRef.current;
    const t0 = performance.now();
    let i = 0;

    const step = () => {
      burn(CHUNK_MS);
      i += 1;
      if (i < CHUNKS) {
        // micro: re-queue inside the SAME microtask checkpoint → starves timers+paint.
        // macro: each chunk is a fresh macrotask → the heartbeat interleaves.
        if (mode === 'micro') queueMicrotask(step);
        else setTimeout(step, 0);
      } else {
        const dt = Math.round(performance.now() - t0);
        const beats = beatRef.current - startBeat;
        log(
          `${mode === 'micro' ? 'microtask flood' : 'macrotask (yielding)'}: ${CHUNKS} chunks (~${CHUNKS * CHUNK_MS}ms work) in ${dt}ms — heartbeats during run: ${beats}`,
          mode === 'micro' ? 'error' : 'success',
        );
        if (mode === 'micro') log('the ~30ms heartbeat never ran: the microtask queue drained fully before any timer or paint', 'macro');
        else log('the heartbeat kept ticking: each chunk yielded to the event loop', 'sync');
        setRunning(false);
      }
    };

    log(`starting ${mode === 'micro' ? 'microtask flood' : 'macrotask (yielding)'} — watch the heartbeat counter`, 'macro');
    if (mode === 'micro') queueMicrotask(step);
    else setTimeout(step, 0);
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="Same work, two queues — one starves the UI">
        Both buttons do the same ~160ms of chunked busy work. The <b>microtask flood</b> re-queues
        each chunk with <code>queueMicrotask</code>, so the whole chain drains in one microtask
        checkpoint — the heartbeat (a <code>setInterval</code> macrotask) and rendering are{' '}
        <b>starved</b> to zero ticks. The <b>yielding</b> version uses <code>setTimeout</code>, so
        the heartbeat interleaves between chunks.
      </Callout>

      <Group>
        <Button color="red" onClick={() => run('micro')} loading={running}>
          Microtask flood (starves)
        </Button>
        <Button color="teal" onClick={() => run('macro')} loading={running}>
          Macrotask / yielding (fair)
        </Button>
        <Button variant="subtle" onClick={clear}>Clear</Button>
      </Group>

      <DemoCard title="Heartbeat (ticks every 30ms only if the loop is free)">
        <Group>
          <Badge size="lg" variant="light" color="grape">heartbeat #{beat}</Badge>
          <Text size="sm" c="dimmed">
            This number freezes during the microtask flood and keeps climbing during the yielding run.
          </Text>
        </Group>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Run each mode and compare the heartbeat counts." />
    </Stack>
  );
}
