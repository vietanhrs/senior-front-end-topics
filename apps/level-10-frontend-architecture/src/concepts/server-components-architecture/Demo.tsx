import { useMemo, useState } from 'react';
import { Badge, Group, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Node {
  id: string;
  label: string;
  parent: string | null;
  depth: number;
  kb: number; // client JS cost if it's a client component
  interactive: boolean; // does it really need state/events?
}

const TREE: Node[] = [
  { id: 'page', label: 'Page', parent: null, depth: 0, kb: 2, interactive: false },
  { id: 'nav', label: 'Nav', parent: 'page', depth: 1, kb: 4, interactive: false },
  { id: 'article', label: 'Article', parent: 'page', depth: 1, kb: 6, interactive: false },
  { id: 'like', label: 'LikeButton', parent: 'article', depth: 2, kb: 3, interactive: true },
  { id: 'comments', label: 'Comments', parent: 'page', depth: 1, kb: 8, interactive: false },
  { id: 'form', label: 'CommentForm', parent: 'comments', depth: 2, kb: 5, interactive: true },
];

const ALL_KB = TREE.reduce((s, n) => s + n.kb, 0);

export function Demo() {
  // true = client component, false = server component
  const [client, setClient] = useState<Record<string, boolean>>({ like: true, form: true });

  const isClient = (id: string) => !!client[id];

  const { bundle, violations } = useMemo(() => {
    let bundle = 0;
    const violations: string[] = [];
    for (const n of TREE) {
      if (isClient(n.id)) bundle += n.kb;
      // a client parent cannot IMPORT a server child
      if (n.parent && isClient(n.parent) && !isClient(n.id)) {
        const parent = TREE.find((x) => x.id === n.parent)!;
        violations.push(`${parent.label} (client) imports ${n.label} (server) — invalid; make ${n.label} client or pass it as children`);
      }
      // an interactive leaf marked server can't have state/events
      if (n.interactive && !isClient(n.id)) {
        violations.push(`${n.label} needs state/handlers but is a server component — won't work; mark it 'use client'`);
      }
    }
    return { bundle, violations };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Mark each component server or client; watch the bundle">
        Server components ship <b>0 KB</b> of JS; only client components are bundled and hydrated.
        Toggle each node and watch the client bundle — the goal is to keep <code>'use client'</code>{' '}
        on the interactive <b>leaves</b> only. The validator flags broken boundaries (a client
        component can't import a server one; an interactive node can't be server).
      </Callout>

      <DemoCard title="Component tree">
        <Stack gap={6}>
          {TREE.map((n) => (
            <Group key={n.id} style={{ paddingLeft: n.depth * 24 }} justify="space-between">
              <Group gap="xs">
                <Text size="sm" fw={n.depth === 0 ? 700 : 500}>{n.label}</Text>
                {n.interactive && <Badge size="xs" variant="outline" color="grape">interactive</Badge>}
                <Badge size="xs" variant="light" color={isClient(n.id) ? 'orange' : 'teal'}>
                  {isClient(n.id) ? `client · ${n.kb}KB` : 'server · 0KB'}
                </Badge>
              </Group>
              <Switch
                size="xs"
                label="'use client'"
                checked={isClient(n.id)}
                onChange={(e) => setClient((c) => ({ ...c, [n.id]: e.currentTarget.checked }))}
              />
            </Group>
          ))}
        </Stack>
      </DemoCard>

      <Group>
        <Badge size="lg" variant="light" color={bundle === 0 ? 'teal' : bundle < ALL_KB / 2 ? 'teal' : 'orange'}>
          client bundle: {bundle}KB
        </Badge>
        <Badge size="lg" variant="light" color="gray">all-client would be: {ALL_KB}KB</Badge>
        <Badge size="lg" variant="light" color={violations.length ? 'red' : 'teal'}>
          {violations.length ? `${violations.length} boundary issue(s)` : 'boundaries valid'}
        </Badge>
      </Group>

      {violations.length > 0 && (
        <Callout kind="warning" title="Boundary violations">
          <Stack gap={2}>
            {violations.map((v, i) => (
              <Text key={i} size="sm">• {v}</Text>
            ))}
          </Stack>
        </Callout>
      )}

      <Text size="sm" c="dimmed">
        Server components can be async and fetch data / use secrets directly; client components own
        state, effects, and events. Keeping only the two interactive leaves on the client ships{' '}
        {client.like && client.form ? `${bundle}KB instead of ${ALL_KB}KB` : 'far less JS'}.
      </Text>
    </Stack>
  );
}
