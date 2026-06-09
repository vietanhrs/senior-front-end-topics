import { useState } from 'react';
import { Badge, Group, Slider, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

export function Demo() {
  const [offset, setOffset] = useState(0.5);
  const [snap, setSnap] = useState(false);
  const dpr = window.devicePixelRatio || 1;

  // Snapping rounds the offset to the nearest device-pixel boundary (1/DPR).
  const applied = snap ? Math.round(offset * dpr) / dpr : offset;
  const isFractional = Math.abs(applied * dpr - Math.round(applied * dpr)) > 0.001;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Zoom in (or use a HiDPI screen) to see it">
        Move the offset to a fractional value like 0.5px and watch the hairline border and text edges
        blur as anti-aliasing spreads them across device pixels. Turn on "snap to device grid" to
        round to the nearest <code>1/DPR</code> and regain crispness. Your DPR is shown below — the
        effect is clearest at DPR 1 or with browser zoom.
      </Callout>

      <Group>
        <Badge variant="light">devicePixelRatio: {dpr}</Badge>
        <Badge variant="light">1 device px = {(1 / dpr).toFixed(3)} CSS px</Badge>
        <Badge color={isFractional ? 'orange' : 'teal'} variant="filled">
          {isFractional ? 'off the device grid → blur' : 'aligned to device grid → crisp'}
        </Badge>
      </Group>

      <DemoCard title="Fractional offset vs device-pixel snapping">
        <Stack gap="lg">
          <div>
            <Group justify="space-between">
              <Text size="sm">translateX offset: {offset.toFixed(2)}px</Text>
              <Switch
                size="sm"
                label="snap to device grid"
                checked={snap}
                onChange={(e) => setSnap(e.currentTarget.checked)}
              />
            </Group>
            <Slider value={offset} onChange={setOffset} min={0} max={2} step={0.05} mt="xs" />
            <Text size="xs" c="dimmed" mt={4}>
              applied offset: {applied.toFixed(3)}px
            </Text>
          </div>

          <div className="rounded-md border p-4" style={{ overflow: 'hidden' }}>
            <div style={{ transform: `translateX(${applied}px)` }}>
              {/* A 1px hairline — the classic victim of subpixel positioning */}
              <div style={{ borderTop: '1px solid var(--mantine-color-indigo-7)', marginBottom: 12 }} />
              <Text fz={13} style={{ fontFamily: 'monospace' }}>
                The quick brown fox — watch these glyph edges blur at fractional offsets.
              </Text>
              <div
                style={{
                  marginTop: 12,
                  width: 120,
                  height: 24,
                  border: '1px solid var(--mantine-color-indigo-7)',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
