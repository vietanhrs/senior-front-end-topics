import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Code, Group, Paper, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';
import { ensureDefined, TAG } from './element';

interface StarsEl extends HTMLElement {
  value: number;
  max: number;
}

export function Demo() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<StarsEl | null>(null);
  const [rating, setRating] = useState(2);
  const [lastEvent, setLastEvent] = useState<string>('—');

  // The correct interop path: create the element, set PROPERTIES (not attributes
  // for rich data), and listen for its CustomEvent with addEventListener.
  useEffect(() => {
    ensureDefined();
    const host = hostRef.current;
    if (!host) return;
    const el = document.createElement(TAG) as StarsEl;
    el.max = 5; // property, not attribute
    el.value = rating;
    const onRate = (e: Event) => {
      const value = (e as CustomEvent<{ value: number }>).detail.value;
      setRating(value);
      setLastEvent(`rate-change → ${value} (received via addEventListener)`);
    };
    el.addEventListener('rate-change', onRate); // NOT onRateChange
    host.appendChild(el);
    elRef.current = el;
    return () => {
      el.removeEventListener('rate-change', onRate);
      el.remove();
      elRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push React state → element via the PROPERTY.
  useEffect(() => {
    if (elRef.current) elRef.current.value = rating;
  }, [rating]);

  // Illustrate the attribute pitfall for objects, for real:
  const tmp = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (tmp) tmp.setAttribute('config', { theme: 'dark' } as unknown as string);
  const stringified = tmp?.getAttribute('config') ?? '[object Object]';

  return (
    <Stack gap="md">
      <Callout kind="info" title="Driving a real custom element from React">
        The stars below are a real <Code>&lt;{TAG}&gt;</Code> element. React sets its{' '}
        <Code>value</Code>/<Code>max</Code> as <b>properties</b> and listens for its{' '}
        <Code>rate-change</Code> <b>CustomEvent</b> via <Code>addEventListener</Code>. Click a star
        (element → React) or use the button (React → element) — both stay in sync.
      </Callout>

      <Group grow align="stretch">
        <DemoCard title="✔ Property + addEventListener (correct)">
          <Group justify="space-between" align="center">
            <div ref={hostRef} />
            <Badge variant="light">rating: {rating}</Badge>
          </Group>
          <Group mt="md">
            <Button size="xs" variant="light" onClick={() => setRating((r) => Math.min(5, r + 1))}>
              React sets el.value +1
            </Button>
            <Button size="xs" variant="default" onClick={() => setRating(0)}>
              reset
            </Button>
          </Group>
          <Text size="xs" c="dimmed" mt="sm">
            last event: {lastEvent}
          </Text>
        </DemoCard>

        <DemoCard title="❌ Object via attribute (data loss)">
          <Text size="sm" mb="xs">
            Passing an object through an <i>attribute</i> stringifies it:
          </Text>
          <Code block>{`el.setAttribute('config', { theme: 'dark' });
el.getAttribute('config');
// → "${stringified}"`}</Code>
          <Paper withBorder radius="md" p="sm" mt="sm">
            <Text size="xs" c="dimmed">
              Rich data must be a <b>property</b> (<Code>el.config = obj</Code>). React 19 sets a
              property when the element defines one; pre-19 sets attributes by default, so you needed
              a ref or a wrapper like <Code>@lit/react</Code>.
            </Text>
          </Paper>
        </DemoCard>
      </Group>
    </Stack>
  );
}
