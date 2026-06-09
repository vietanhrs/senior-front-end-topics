import { useEffect, useRef, useState } from 'react';
import { Badge, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';
import { useFps } from '../../lib/useFps';

type Mode = 'off' | 'allocate' | 'reuse';

const PARTICLES = 4000;
const ALLOC_PER_FRAME = 1500; // arrays/objects created per frame in "allocate" mode

export function Demo() {
  const [mode, setMode] = useState<Mode>('off');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const fps = useFps();
  const [allocs, setAllocs] = useState(0);

  // Preallocated buffer reused by "reuse" mode.
  const bufferRef = useRef<Float64Array>(new Float64Array(PARTICLES * 2));
  // A sink to stop the optimizer from removing the work.
  const sinkRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    let total = 0;
    let lastReport = performance.now();
    const loop = () => {
      const m = modeRef.current;
      if (m === 'allocate') {
        // ❌ Heavy per-frame allocation: new arrays + objects every frame -> GC churn.
        let s = 0;
        for (let i = 0; i < ALLOC_PER_FRAME; i++) {
          const point = { x: Math.random(), y: Math.random(), data: [i, i + 1, i + 2] };
          const mapped = [point.x, point.y].map((v) => v * 2); // intermediate array + closure
          s += mapped[0] + mapped[1] + point.data[0];
        }
        sinkRef.current = s;
        total += ALLOC_PER_FRAME;
      } else if (m === 'reuse') {
        // ✔ Same amount of math, but mutate a preallocated buffer -> ~zero allocation.
        const buf = bufferRef.current;
        let s = 0;
        for (let i = 0; i < ALLOC_PER_FRAME; i++) {
          const xi = (i * 2) % buf.length;
          buf[xi] = Math.random() * 2;
          buf[xi + 1] = Math.random() * 2;
          s += buf[xi] + buf[xi + 1] + i;
        }
        sinkRef.current = s;
      }
      const now = performance.now();
      if (now - lastReport > 300) {
        setAllocs(total);
        lastReport = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Watch FPS + the Performance memory track">
        Both "allocate" and "reuse" do the same amount of math every frame. "Allocate" creates ~{ALLOC_PER_FRAME}
        short-lived objects/arrays per frame (GC churn); "reuse" mutates one preallocated buffer.
        Record a Performance profile in each mode: "allocate" shows a memory sawtooth and frequent
        Minor GC events (and lower/janky FPS), "reuse" stays flat.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        fullWidth
        data={[
          { label: 'Idle', value: 'off' },
          { label: 'Allocate per frame (GC churn)', value: 'allocate' },
          { label: 'Reuse buffer (~0 alloc)', value: 'reuse' },
        ]}
      />

      <DemoCard
        title="Allocation pressure vs frame rate"
        right={
          <Group gap="xs">
            <Badge color={fps >= 50 ? 'teal' : fps >= 30 ? 'orange' : 'red'} variant="filled">
              {fps} fps
            </Badge>
            {mode === 'allocate' && (
              <Badge color="red" variant="light">
                ~{(allocs / 1000).toFixed(0)}k objs allocated
              </Badge>
            )}
          </Group>
        }
      >
        <Text size="sm" c="dimmed">
          {mode === 'off' && 'Idle — start one of the modes and watch the FPS badge.'}
          {mode === 'allocate' &&
            'Allocating short-lived objects every frame. On many devices the FPS dips and stutters as Minor GCs fire between frames.'}
          {mode === 'reuse' &&
            'Same workload, reusing one Float64Array. Allocation is near zero, so GC barely runs — FPS stays steady.'}
        </Text>
        <Text size="xs" c="dimmed" mt="sm">
          Tip: throttle CPU (DevTools → Performance → 4–6×) to exaggerate the difference, and open the
          Performance monitor to watch the JS heap shape.
        </Text>
      </DemoCard>
    </Stack>
  );
}
