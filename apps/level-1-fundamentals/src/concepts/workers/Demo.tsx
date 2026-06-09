import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconCpu, IconHandStop } from '@tabler/icons-react';
import { Callout, DemoCard } from '../../workbook/ui';

const LIMIT = 2_000_000;

function countPrimes(limit: number): number {
  let count = 0;
  for (let n = 2; n < limit; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        prime = false;
        break;
      }
    }
    if (prime) count++;
  }
  return count;
}

/** A JS-driven heartbeat. It only advances if the main thread is free, so it
 *  visibly FREEZES when we block the thread, and keeps ticking when we offload. */
function useHeartbeat() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return tick;
}

export function Demo() {
  const tick = useHeartbeat();
  const [result, setResult] = useState<string>('—');
  const [busy, setBusy] = useState<'none' | 'main' | 'worker'>('none');
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  function runOnMainThread() {
    setBusy('main');
    setResult('đang tính trên main thread…');
    // Defer one frame so the label paints before we freeze the thread.
    requestAnimationFrame(() => {
      const t0 = performance.now();
      const primes = countPrimes(LIMIT);
      setResult(`main thread: ${primes} primes trong ${Math.round(performance.now() - t0)}ms (UI vừa đứng hình!)`);
      setBusy('none');
    });
  }

  function runInWorker() {
    setBusy('worker');
    setResult('đang tính trong Web Worker…');
    const worker = new Worker(new URL('./heavy.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<{ result: number; ms: number }>) => {
      setResult(`worker: ${e.data.result} primes trong ${e.data.ms}ms (UI vẫn mượt suốt quá trình)`);
      setBusy('none');
      worker.terminate();
      workerRef.current = null;
    };
    worker.postMessage({ limit: LIMIT });
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Cách quan sát responsiveness">
        Nhịp tim bên dưới tăng mỗi animation frame và ô input phải gõ được mượt. Bấm{' '}
        <b>Block main thread</b> → nhịp tim ĐỨNG, gõ phím khựng. Bấm <b>Web Worker</b> → nhịp tim
        vẫn chạy đều, gõ phím mượt vì tính toán ở luồng khác.
      </Callout>

      <DemoCard
        title="Main thread vs Web Worker"
        right={
          <Badge color={busy === 'main' ? 'red' : busy === 'worker' ? 'grape' : 'gray'} variant="filled">
            {busy === 'none' ? 'idle' : busy === 'main' ? 'blocking main' : 'worker chạy'}
          </Badge>
        }
      >
        <Stack gap="md">
          <Group align="flex-end">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Nhịp tim (rAF) — phải nhấp nháy liên tục
              </Text>
              <Group gap="xs">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ background: tick % 2 ? 'var(--mantine-color-teal-5)' : 'var(--mantine-color-teal-9)' }}
                />
                <Text ff="monospace">frame #{tick}</Text>
              </Group>
            </Stack>
            <TextInput label="Gõ thử để cảm nhận độ mượt" placeholder="abc…" className="flex-1" />
          </Group>

          <Group>
            <Button color="red" leftSection={<IconHandStop size={16} />} onClick={runOnMainThread} disabled={busy !== 'none'}>
              Block main thread (sync)
            </Button>
            <Button color="grape" leftSection={<IconCpu size={16} />} onClick={runInWorker} disabled={busy !== 'none'}>
              Tính trong Web Worker
            </Button>
          </Group>

          <Text size="sm">
            Kết quả: <b>{result}</b>
          </Text>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
