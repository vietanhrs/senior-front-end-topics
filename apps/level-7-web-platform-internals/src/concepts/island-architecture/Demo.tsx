import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Badge, Button, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';
import { SearchIsland } from './SearchIsland';
import { CounterIsland } from './CounterIsland';

// Illustrative bundle sizes (KB) to compare shipping models.
const SPA_JS = 240; // whole page is one app
const ISLAND_JS = { search: 9, cart: 6 }; // only the islands ship

export function Demo() {
  const [hydrated, setHydrated] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const rootsRef = useRef<Root[]>([]);

  useEffect(() => () => rootsRef.current.forEach((r) => r.unmount()), []);

  function hydrateIslands() {
    if (hydrated || !searchRef.current || !cartRef.current) return;
    // The key move: a SEPARATE React root per island, not one app root.
    const r1 = createRoot(searchRef.current);
    r1.render(<SearchIsland />);
    const r2 = createRoot(cartRef.current);
    r2.render(<CounterIsland />);
    rootsRef.current = [r1, r2];
    setHydrated(true);
  }

  function reset() {
    rootsRef.current.forEach((r) => r.unmount());
    rootsRef.current = [];
    setHydrated(false);
  }

  const islandTotal = ISLAND_JS.search + ISLAND_JS.cart;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Two islands in a sea of static HTML">
        The article text below is static — it never ships or runs JS. Click "Hydrate islands" to
        mount a <b>separate React root</b> into each island slot (open React DevTools: you'll see two
        independent roots, not one app). The static prose stays inert forever.
      </Callout>

      <DemoCard
        title="A mostly-static page"
        right={
          <Group gap="xs">
            <Badge color={hydrated ? 'teal' : 'gray'} variant="filled">
              {hydrated ? '2 islands interactive' : 'all static (inert)'}
            </Badge>
            <Button size="xs" onClick={hydrateIslands} disabled={hydrated}>
              Hydrate islands
            </Button>
            <Button size="xs" variant="default" onClick={reset}>
              Reset
            </Button>
          </Group>
        }
      >
        {/* static "sea" */}
        <Text size="sm" mb="sm">
          <b>The Coastline Gazette</b> — Static article content rendered as HTML on the server. This
          paragraph, the heading, and everything around the islands ship <b>no JavaScript</b> and are
          never hydrated. Only the two bordered regions below become interactive.
        </Text>
        <Group grow align="stretch">
          <Paper withBorder radius="md" p="sm">
            {/* island slot 1 — inert placeholder until hydrated into its own root */}
            <div ref={searchRef}>
              {!hydrated && (
                <Text size="xs" c="dimmed">
                  🏝 Search island — static placeholder (not interactive yet)
                </Text>
              )}
            </div>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <div ref={cartRef}>
              {!hydrated && (
                <Text size="xs" c="dimmed">
                  🏝 Cart island — static placeholder (not interactive yet)
                </Text>
              )}
            </div>
          </Paper>
        </Group>
        <Text size="sm" mt="sm" c="dimmed">
          …more static article content, also zero-JS…
        </Text>
      </DemoCard>

      <DemoCard title="JavaScript shipped: SPA vs islands">
        <Stack gap="sm">
          <div>
            <Group justify="space-between" mb={2}>
              <Text size="sm">SPA (whole page hydrates)</Text>
              <Text size="sm" ff="monospace">{SPA_JS} KB</Text>
            </Group>
            <Progress value={100} color="red" />
          </div>
          <div>
            <Group justify="space-between" mb={2}>
              <Text size="sm">Islands (only interactive regions)</Text>
              <Text size="sm" ff="monospace">{islandTotal} KB</Text>
            </Group>
            <Progress value={(islandTotal / SPA_JS) * 100} color="teal" />
          </div>
          <Text size="xs" c="dimmed">
            Islands ship ~{Math.round((islandTotal / SPA_JS) * 100)}% of the SPA's JS here: search
            ({ISLAND_JS.search} KB) + cart ({ISLAND_JS.cart} KB), and nothing for the static prose.
            (Frameworks dedupe the shared framework runtime so it isn't bundled per island.)
          </Text>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
