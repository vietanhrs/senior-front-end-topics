import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Code, Group, Stack, Table, Text } from '@mantine/core';
import { IconPlugConnected, IconTrash } from '@tabler/icons-react';
import { Callout, DemoCard } from '@sfe/workbook';

interface InjectedHint {
  id: number;
  rel: string;
  snippet: string;
  el: HTMLLinkElement;
}

const RECIPES: { rel: string; label: string; build: () => HTMLLinkElement; snippet: string }[] = [
  {
    rel: 'preconnect',
    label: 'preconnect → fonts.gstatic.com',
    snippet: '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    build: () => {
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = 'https://fonts.gstatic.com';
      l.crossOrigin = 'anonymous';
      return l;
    },
  },
  {
    rel: 'dns-prefetch',
    label: 'dns-prefetch → fonts.gstatic.com',
    snippet: '<link rel="dns-prefetch" href="https://fonts.gstatic.com">',
    build: () => {
      const l = document.createElement('link');
      l.rel = 'dns-prefetch';
      l.href = 'https://fonts.gstatic.com';
      return l;
    },
  },
  {
    rel: 'preload',
    label: 'preload font (as=font)',
    snippet:
      '<link rel="preload" as="font" type="font/woff2" crossorigin\n      href="https://fonts.gstatic.com/s/inter/v13/font.woff2">',
    build: () => {
      const l = document.createElement('link');
      l.rel = 'preload';
      l.as = 'font';
      l.type = 'font/woff2';
      l.crossOrigin = 'anonymous';
      l.href = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2';
      return l;
    },
  },
  {
    rel: 'prefetch',
    label: 'prefetch (next page)',
    snippet: '<link rel="prefetch" as="script" href="/next-route-chunk.js">',
    build: () => {
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.as = 'script';
      l.href = '/next-route-chunk.js';
      return l;
    },
  },
];

export function Demo() {
  const [hints, setHints] = useState<InjectedHint[]>([]);
  const elsRef = useRef<HTMLLinkElement[]>([]);

  // Remove every <link> we injected when leaving the concept (unmount only).
  useEffect(
    () => () => {
      elsRef.current.forEach((el) => el.remove());
      elsRef.current = [];
    },
    [],
  );

  function inject(recipe: (typeof RECIPES)[number]) {
    const el = recipe.build();
    document.head.appendChild(el);
    elsRef.current.push(el);
    setHints((prev) => [...prev, { id: Date.now() + Math.random(), rel: recipe.rel, snippet: recipe.snippet, el }]);
  }

  function clearAll() {
    elsRef.current.forEach((el) => el.remove());
    elsRef.current = [];
    setHints([]);
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="What to observe">
        Click to inject a real <code>&lt;link&gt;</code> hint into <code>&lt;head&gt;</code>.
        Open DevTools → Elements (see the new tag) and Network (see the early connection/fetch).
        The hints are removed automatically when you leave this concept.
      </Callout>

      <DemoCard
        title="Inject resource hints into <head>"
        right={
          <Button size="xs" variant="default" leftSection={<IconTrash size={14} />} onClick={clearAll}>
            Remove all
          </Button>
        }
      >
        <Group gap="xs">
          {RECIPES.map((r) => (
            <Button
              key={r.label}
              size="xs"
              variant="light"
              leftSection={<IconPlugConnected size={14} />}
              onClick={() => inject(r)}
            >
              {r.label}
            </Button>
          ))}
        </Group>

        <Text size="sm" fw={600} mt="md" mb={4}>
          Injected ({hints.length}):
        </Text>
        {hints.length === 0 ? (
          <Text size="sm" c="dimmed">
            No hints yet.
          </Text>
        ) : (
          <Stack gap={6}>
            {hints.map((h) => (
              <Group key={h.id} gap="xs" align="flex-start">
                <Badge variant="filled" color="indigo">
                  {h.rel}
                </Badge>
                <Code block style={{ flex: 1 }}>
                  {h.snippet}
                </Code>
              </Group>
            ))}
          </Stack>
        )}
      </DemoCard>

      <DemoCard title="Reference: which hint to choose?">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Situation</Table.Th>
              <Table.Th>Correct hint</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {[
              ['Will fetch a font/API from a third-party origin', 'preconnect (+ dns-prefetch fallback)'],
              ['Font declared in CSS, needed immediately', 'preload as=font crossorigin'],
              ['LCP image discovered late (in JS)', 'preload as=image + fetchpriority=high'],
              ['Code for a route the user may visit next', 'prefetch'],
              ['Critical JS ES module', 'modulepreload'],
            ].map(([s, h]) => (
              <Table.Tr key={s}>
                <Table.Td>{s}</Table.Td>
                <Table.Td>
                  <Code>{h}</Code>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </DemoCard>
    </Stack>
  );
}
