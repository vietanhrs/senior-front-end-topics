import { useMemo, useState } from 'react';
import { Badge, Chip, Group, Slider, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const TRIGGERS = [
  { key: 'willchange', label: 'will-change: transform', reason: 'Explicit hint — the intended way to promote a layer.' },
  { key: 'translatez', label: 'transform: translateZ(0)', reason: 'The classic "hack" to force a layer (prefer will-change).' },
  { key: 'fixed', label: 'position: fixed', reason: 'Fixed/sticky elements are frequently promoted.' },
  { key: 'filter', label: 'filter: blur(2px)', reason: 'Filters are composited on their own layer.' },
  { key: 'opacityanim', label: 'animation on opacity', reason: 'A running opacity/transform animation promotes the element.' },
];

const TILE = 256; // browsers tile layers; rough per-tile texture size

export function Demo() {
  const [active, setActive] = useState<string[]>([]);
  const [promoted, setPromoted] = useState(8);

  const promotedBox = active.length > 0;

  const style = useMemo(() => {
    const s: React.CSSProperties = {};
    if (active.includes('willchange')) s.willChange = 'transform';
    if (active.includes('translatez')) s.transform = 'translateZ(0)';
    if (active.includes('fixed')) s.position = 'relative'; // visual only; real `fixed` would detach
    if (active.includes('filter')) s.filter = 'blur(0.4px)';
    if (active.includes('opacityanim')) s.animation = 'sfe-pulse 1.6s ease-in-out infinite';
    return s;
  }, [active]);

  // Very rough GPU-memory estimate for a "layer explosion" of N small layers.
  const estMb = useMemo(() => (promoted * TILE * TILE * 4) / (1024 * 1024), [promoted]);

  return (
    <Stack gap="md">
      <style>{`@keyframes sfe-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>

      <Callout kind="info" title="Confirm in the Layers panel">
        Toggle triggers below and open DevTools → Layers (or Rendering → "Layer borders"). Each
        trigger is a reason the browser may give this element its own compositing layer. The real
        ground truth is the "compositing reasons" shown there.
      </Callout>

      <DemoCard
        title="What promotes this element to its own layer?"
        right={
          <Badge color={promotedBox ? 'teal' : 'gray'} variant={promotedBox ? 'filled' : 'light'}>
            {promotedBox ? 'likely its own layer' : 'shares the root layer'}
          </Badge>
        }
      >
        <Group align="flex-start" gap="xl">
          <div
            className="flex h-24 w-40 items-center justify-center rounded-md text-sm font-semibold text-white"
            style={{ background: 'var(--mantine-color-indigo-6)', ...style }}
          >
            target
          </div>
          <Stack gap="xs" style={{ flex: 1 }}>
            <Chip.Group multiple value={active} onChange={setActive}>
              <Group gap="xs">
                {TRIGGERS.map((t) => (
                  <Chip key={t.key} value={t.key} size="sm">
                    {t.label}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
            <Stack gap={2} mt="xs">
              {active.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No promotion triggers — the element paints into the root layer.
                </Text>
              ) : (
                active.map((k) => (
                  <Text key={k} size="xs" c="dimmed">
                    • {TRIGGERS.find((t) => t.key === k)!.reason}
                  </Text>
                ))
              )}
            </Stack>
          </Stack>
        </Group>
      </DemoCard>

      <DemoCard title="Layer explosion — the hidden GPU memory cost">
        <Text size="sm" c="dimmed" mb="sm">
          Promoting many elements (e.g. <code>* {'{'} will-change: transform {'}'}</code>) multiplies
          GPU memory. Rough estimate at one {TILE}×{TILE}px tile per layer:
        </Text>
        <Slider
          value={promoted}
          onChange={setPromoted}
          min={1}
          max={500}
          marks={[
            { value: 1, label: '1' },
            { value: 250, label: '250' },
            { value: 500, label: '500' },
          ]}
        />
        <Group mt="md">
          <Badge size="lg" variant="light">
            {promoted} layers
          </Badge>
          <Badge size="lg" color={estMb > 64 ? 'red' : estMb > 16 ? 'orange' : 'teal'} variant="filled">
            ≈ {estMb.toFixed(1)} MB GPU memory
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" mt="xs">
          Real layers are often larger than one tile, so this is a lower bound. On mobile GPUs this
          ceiling is low — layer explosion causes stutter or crashes. Promote only what you animate.
        </Text>
      </DemoCard>
    </Stack>
  );
}
