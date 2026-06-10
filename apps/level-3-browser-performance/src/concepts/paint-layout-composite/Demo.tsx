import { useEffect, useRef, useState } from 'react';
import { Badge, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';
import { useFps } from '../../lib/useFps';

type Mode = 'composite' | 'paint' | 'layout';

const COUNT = 400;

const STAGES: Record<Mode, { label: string; stages: string; color: string }> = {
  composite: { label: 'transform: translateX (composite only)', stages: 'Composite', color: 'teal' },
  paint: { label: 'box-shadow + background (paint)', stages: 'Paint → Composite', color: 'orange' },
  layout: { label: 'left (layout)', stages: 'Layout → Paint → Composite', color: 'red' },
};

export function Demo() {
  const [mode, setMode] = useState<Mode>('composite');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const containerRef = useRef<HTMLDivElement>(null);
  const fps = useFps();

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const els = containerRef.current?.querySelectorAll<HTMLElement>('[data-box]');
      if (els) {
        const t = performance.now() - start;
        const offset = Math.sin(t / 400) * 30; // -30..30 px
        const blur = 6 + Math.sin(t / 400) * 6;
        for (const el of els) {
          // Reset competing properties so only the chosen one drives the motion.
          if (modeRef.current === 'composite') {
            el.style.transform = `translateX(${offset}px)`;
            el.style.left = '';
            el.style.boxShadow = '';
          } else if (modeRef.current === 'paint') {
            el.style.transform = '';
            el.style.left = '';
            el.style.boxShadow = `0 0 ${blur}px rgba(99,102,241,0.9)`;
          } else {
            el.style.transform = '';
            el.style.boxShadow = '';
            el.style.left = `${offset}px`; // animating `left` forces layout every frame
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cfg = STAGES[mode];

  return (
    <Stack gap="md">
      <Callout kind="info" title="Watch the FPS as you switch modes">
        The same {COUNT} boxes oscillate the same distance, driven the same way (rAF). Only the CSS
        property differs. <b>Layout</b> re-enters the pipeline earliest (reflow every frame) and
        usually drops FPS the most; <b>composite</b> (transform) stays smoothest. Turn on DevTools →
        Rendering → "Paint flashing" to see paint regions light up in paint/layout modes.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        fullWidth
        data={[
          { label: 'transform (composite)', value: 'composite' },
          { label: 'box-shadow (paint)', value: 'paint' },
          { label: 'left (layout)', value: 'layout' },
        ]}
      />

      <DemoCard
        title={cfg.label}
        right={
          <Group gap="xs">
            <Badge color={cfg.color} variant="light">
              {cfg.stages}
            </Badge>
            <Badge color={fps >= 50 ? 'teal' : fps >= 30 ? 'orange' : 'red'} variant="filled">
              {fps} fps
            </Badge>
          </Group>
        }
      >
        <div ref={containerRef} className="flex max-h-48 flex-wrap gap-1 overflow-hidden rounded-md border p-2">
          {Array.from({ length: COUNT }, (_, i) => (
            <div
              key={i}
              data-box
              className="h-4 w-4 rounded-sm"
              style={{ position: 'relative', background: `hsl(${(i * 9) % 360} 70% 55%)` }}
            />
          ))}
        </div>
        <Text size="xs" c="dimmed" mt="xs">
          Differences are most dramatic on a mid/low-end device or with CPU throttling (DevTools →
          Performance → CPU 4–6× slowdown).
        </Text>
      </DemoCard>
    </Stack>
  );
}
