import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const W = 320;
const H = 180;

const supported =
  typeof HTMLCanvasElement !== 'undefined' &&
  'transferControlToOffscreen' in HTMLCanvasElement.prototype;

export function Demo() {
  const { logs, log, clear } = useLogger();
  const workerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const startedRef = useRef(false);

  const [workerFps, setWorkerFps] = useState(0);
  const [mainFps, setMainFps] = useState(0);
  const [started, setStarted] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // Main-thread canvas: a plain rAF loop that competes with everything else
  // on the main thread — it freezes whenever the main thread is busy.
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let t = 0;
    const loop = () => {
      g.fillStyle = 'rgba(15,18,28,0.35)';
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) {
        const a = t * 0.02 + (i * Math.PI * 2) / 60;
        const x = W / 2 + Math.cos(a) * (40 + (i % 5) * 12);
        const y = H / 2 + Math.sin(a) * (40 + (i % 5) * 12);
        g.beginPath();
        g.arc(x, y, 5, 0, Math.PI * 2);
        g.fillStyle = `hsl(${(i * 6 + t) % 360} 80% 60%)`;
        g.fill();
      }
      t++;
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        setMainFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const startWorker = () => {
    if (startedRef.current || !supported) return;
    const canvas = workerCanvasRef.current;
    if (!canvas) return;
    startedRef.current = true;
    setStarted(true);

    const offscreen = canvas.transferControlToOffscreen();
    const worker = new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ type: 'fps'; fps: number }>) => {
      if (e.data.type === 'fps') setWorkerFps(e.data.fps);
    };
    // Transfer the surface (not a copy) — moved via the transfer list.
    worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);
    workerRef.current = worker;
    log('transferControlToOffscreen() → worker now owns the canvas; rAF loop runs off-main-thread', 'success');
  };

  const blockMainThread = () => {
    setBlocking(true);
    log('blocking the main thread for ~1500ms (synchronous busy loop)…', 'macro');
    // Defer so the badge/log paint before we freeze the thread.
    requestAnimationFrame(() => {
      const end = performance.now() + 1500;
      while (performance.now() < end) {
        /* spin — nothing else on the main thread can run */
      }
      log('main thread free again — note the worker canvas never stuttered', 'sync');
      setBlocking(false);
    });
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="Block the main thread and watch which canvas survives">
        The left canvas renders on the <b>main thread</b>; the right one is{' '}
        <code>transferControlToOffscreen()</code>-ed to a <b>worker</b>. Start the worker, then press{' '}
        <b>Block main thread</b>: the main canvas (and its FPS) freezes for ~1.5s while the worker
        canvas keeps animating at full FPS — its loop isn't on the blocked thread.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="Not supported here">
          This engine lacks <code>transferControlToOffscreen</code>. In production you'd fall back to
          main-thread rendering — exactly the left canvas.
        </Callout>
      )}

      <Group>
        <Button onClick={startWorker} disabled={started || !supported}>
          {started ? 'Worker rendering ✓' : 'Start worker render'}
        </Button>
        <Button color="orange" variant="light" onClick={blockMainThread} loading={blocking}>
          Block main thread (1.5s)
        </Button>
        <Button variant="subtle" onClick={clear}>Clear log</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <DemoCard title="Main thread">
          <Stack gap={6} align="center">
            <canvas
              ref={mainCanvasRef}
              width={W}
              height={H}
              className="w-full rounded-md border"
              style={{ background: '#0f121c' }}
            />
            <Badge color={mainFps < 30 ? 'red' : 'teal'} variant="light">
              {mainFps} fps {blocking && '· frozen'}
            </Badge>
          </Stack>
        </DemoCard>
        <DemoCard title="Worker (OffscreenCanvas)">
          <Stack gap={6} align="center">
            <canvas
              ref={workerCanvasRef}
              width={W}
              height={H}
              className="w-full rounded-md border"
              style={{ background: '#0f121c' }}
            />
            <Badge color={started ? 'teal' : 'gray'} variant="light">
              {started ? `${workerFps} fps · off-thread` : 'not started'}
            </Badge>
          </Stack>
        </DemoCard>
      </SimpleGrid>

      <Text size="xs" c="dimmed">
        FPS is sampled every 500ms by each loop. While the main thread is blocked it can't even run
        its own sampler, so its number stalls — the worker's keeps updating.
      </Text>

      <LogConsole logs={logs} height={140} empty="Start the worker, then block the main thread." />
    </Stack>
  );
}
