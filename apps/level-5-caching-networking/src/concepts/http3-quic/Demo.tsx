import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const STREAMS = ['A · app.js', 'B · styles.css', 'C · hero.jpg'];
const PACKETS_PER_STREAM = 10;
const LOST_STREAM = 1; // styles.css loses a packet
const LOST_PACKET = 3;
const RETRANSMIT_DELAY = 14; // ticks until the lost packet is recovered

type Mode = 'h2' | 'h3';

/**
 * Tick-based simulation. Packets for the 3 streams are interleaved round-robin.
 * One packet of stream B is "lost" and recovered after RETRANSMIT_DELAY ticks.
 *  - h2 (TCP): in-order BYTE STREAM — nothing after the lost packet can be
 *    delivered to ANY stream until it's retransmitted (transport HoL blocking).
 *  - h3 (QUIC): per-stream ordering — only stream B waits; A and C keep going.
 */
function simulate(mode: Mode): { delivered: number[][]; doneAt: number[] } {
  const delivered: number[][] = STREAMS.map(() => []);
  const doneAt = STREAMS.map(() => -1);
  // Build the interleaved send order: (stream, packetIndex)
  const wire: { s: number; p: number }[] = [];
  for (let p = 0; p < PACKETS_PER_STREAM; p++) for (let s = 0; s < STREAMS.length; s++) wire.push({ s, p });

  const lostWireIndex = wire.findIndex((x) => x.s === LOST_STREAM && x.p === LOST_PACKET);
  const recoveredTick = lostWireIndex + RETRANSMIT_DELAY;

  let tick = 0;
  const buffered: { s: number; p: number }[] = []; // packets held back (h2 only)
  for (let i = 0; i < wire.length; i++) {
    tick = i;
    const pkt = wire[i];
    const isLost = i === lostWireIndex;
    if (isLost) continue; // not delivered yet; recovered later

    if (mode === 'h2' && i > lostWireIndex && tick < recoveredTick) {
      buffered.push(pkt); // TCP holds EVERYTHING behind the gap
      continue;
    }
    delivered[pkt.s].push(tick);
    if (delivered[pkt.s].length === PACKETS_PER_STREAM && doneAt[pkt.s] === -1) doneAt[pkt.s] = tick;
  }
  // Recovery: lost packet (and any buffered ones) arrive at recoveredTick
  const flushTick = Math.max(recoveredTick, tick + 1);
  delivered[LOST_STREAM].push(flushTick);
  for (const pkt of buffered) delivered[pkt.s].push(flushTick);
  for (let s = 0; s < STREAMS.length; s++) {
    if (delivered[s].length >= PACKETS_PER_STREAM && doneAt[s] === -1) doneAt[s] = flushTick;
  }
  return { delivered, doneAt };
}

export function Demo() {
  const [mode, setMode] = useState<Mode>('h2');
  const [clock, setClock] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { delivered, doneAt } = useMemo(() => simulate(mode), [mode]);
  const totalTicks = Math.max(...doneAt) + 2;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function run() {
    setClock(0);
    setRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setClock((c) => {
        if (c + 1 >= totalTicks) {
          if (timerRef.current) clearInterval(timerRef.current);
          setRunning(false);
        }
        return c + 1;
      });
    }, 120);
  }

  const proto =
    (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)
      ?.nextHopProtocol || 'unknown';

  return (
    <Stack gap="md">
      <Callout kind="info" title="One lost packet, two transports">
        Three resources stream in parallel; one packet of <b>styles.css</b> is lost mid-transfer.
        Run both modes: over <b>h2/TCP</b> the loss stalls <i>all three</i> streams (in-order byte
        stream → head-of-line blocking); over <b>h3/QUIC</b> only styles.css waits for the
        retransmit while app.js and hero.jpg finish on time.
      </Callout>

      <Group justify="space-between">
        <SegmentedControl
          value={mode}
          onChange={(v) => { setMode(v as Mode); setClock(0); }}
          data={[
            { label: 'HTTP/2 over TCP', value: 'h2' },
            { label: 'HTTP/3 over QUIC', value: 'h3' },
          ]}
        />
        <Group gap="xs">
          <Badge variant="light">this page loaded via: {proto}</Badge>
          <Button size="xs" onClick={run} disabled={running}>
            {running ? 'Streaming…' : 'Run simulation'}
          </Button>
        </Group>
      </Group>

      <DemoCard title={`Packet delivery (lost packet recovered after ${RETRANSMIT_DELAY} ticks)`}>
        <Stack gap="sm">
          {STREAMS.map((name, s) => {
            const arrived = delivered[s].filter((t) => t <= clock).length;
            const done = doneAt[s] <= clock;
            const blocked = !done && running && delivered[s].filter((t) => t <= clock).length < Math.min(PACKETS_PER_STREAM, Math.floor(clock / 3) + 1);
            return (
              <div key={name}>
                <Group justify="space-between" mb={4}>
                  <Text size="sm" fw={500}>
                    {name} {s === LOST_STREAM && <Text span c="red" size="xs">(suffers the packet loss)</Text>}
                  </Text>
                  <Badge size="sm" color={done ? 'teal' : blocked ? 'red' : 'blue'} variant={done ? 'filled' : 'light'}>
                    {done ? `done @ tick ${doneAt[s]}` : blocked ? 'stalled' : `${arrived}/${PACKETS_PER_STREAM}`}
                  </Badge>
                </Group>
                <div className="flex gap-1">
                  {Array.from({ length: PACKETS_PER_STREAM }, (_, p) => {
                    const at = delivered[s][p];
                    const shown = at != null && at <= clock;
                    return (
                      <div
                        key={p}
                        className="h-4 flex-1 rounded-sm"
                        style={{
                          background: shown
                            ? `var(--mantine-color-${s === LOST_STREAM ? 'pink' : ['indigo', 'grape', 'teal'][s]}-6)`
                            : 'var(--mantine-color-default-hover)',
                          transition: 'background 100ms',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          <Text size="xs" c="dimmed">
            tick {clock} — in h2 mode notice app.js & hero.jpg freeze the moment the loss occurs even
            though THEIR packets arrived; QUIC delivers them independently.
          </Text>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
