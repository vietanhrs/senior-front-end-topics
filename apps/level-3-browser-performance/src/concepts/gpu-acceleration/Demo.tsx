import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

/** A box animated by JS setting transform every frame — runs on the MAIN thread. */
function JsAnimatedBox() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const t = performance.now() - start;
      if (ref.current) ref.current.style.transform = `rotate(${(t / 8) % 360}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <Stack gap={4} align="center">
      <div ref={ref} className="flex h-16 w-16 items-center justify-center rounded-md bg-orange-500 text-xs font-bold text-white">
        JS
      </div>
      <Text size="xs" c="dimmed">
        rAF on main thread
      </Text>
    </Stack>
  );
}

/** A box animated by a CSS keyframe transform — runs on the COMPOSITOR thread. */
function CssAnimatedBox() {
  return (
    <Stack gap={4} align="center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-md bg-teal-500 text-xs font-bold text-white"
        style={{ animation: 'sfe-spin 1.5s linear infinite', willChange: 'transform' }}
      >
        CSS
      </div>
      <Text size="xs" c="dimmed">
        CSS transform (GPU)
      </Text>
    </Stack>
  );
}

export function Demo() {
  const [blocking, setBlocking] = useState(false);

  function blockMainThread() {
    setBlocking(true);
    // Yield one frame so the badge paints, then jam the main thread for ~2.5s.
    requestAnimationFrame(() => {
      const end = performance.now() + 2500;
      let x = 0;
      while (performance.now() < end) x += Math.sqrt(x + 1); // synchronous busy loop
      void x;
      setBlocking(false);
    });
  }

  return (
    <Stack gap="md">
      <style>{`@keyframes sfe-spin { to { transform: rotate(360deg); } }`}</style>

      <Callout kind="info" title="Block the main thread and watch which box keeps spinning">
        Both boxes spin via <code>transform</code>. The orange one is driven by JS (rAF) on the
        main thread; the teal one by a CSS keyframe animation the browser runs on the GPU
        compositor. Click "Block main thread (2.5s)": the orange box <b>freezes</b> (its JS can't
        run), while the teal box <b>keeps spinning smoothly</b> — that's GPU acceleration.
      </Callout>

      <DemoCard
        title="Main-thread JS animation vs GPU compositor animation"
        right={
          <Badge color={blocking ? 'red' : 'teal'} variant="filled">
            {blocking ? 'main thread BLOCKED' : 'main thread free'}
          </Badge>
        }
      >
        <Group justify="center" gap={64} py="md">
          <JsAnimatedBox />
          <CssAnimatedBox />
        </Group>
        <Group justify="center">
          <Button color="red" onClick={blockMainThread} disabled={blocking}>
            Block main thread (2.5s)
          </Button>
        </Group>
        <Text size="xs" c="dimmed" ta="center" mt="sm">
          The compositor thread keeps drawing the teal box from its existing layer texture — no main
          thread, no layout, no paint required.
        </Text>
      </DemoCard>
    </Stack>
  );
}
