import { useMemo, useState } from 'react';
import { Alert, Checkbox, Code, Stack, Text } from '@mantine/core';
import { IconDeviceDesktop, IconServer } from '@tabler/icons-react';
import { Callout, DemoCard } from '@sfe/workbook';

interface Need {
  key: string;
  label: string;
  /** true => forces Client; false-ish needs lean Server */
  forcesClient: boolean;
}

const NEEDS: Need[] = [
  { key: 'state', label: 'Uses useState / useReducer (local state)', forcesClient: true },
  { key: 'effects', label: 'Uses useEffect / refs / lifecycle', forcesClient: true },
  { key: 'events', label: 'Has event handlers (onClick, onChange…)', forcesClient: true },
  { key: 'browser', label: 'Uses browser APIs (window, localStorage)', forcesClient: true },
  { key: 'db', label: 'Reads a database / secrets / filesystem directly', forcesClient: false },
  { key: 'heavydep', label: 'Pulls a heavy dependency (markdown, highlighter, date lib)', forcesClient: false },
  { key: 'static', label: 'Renders mostly static content from data', forcesClient: false },
];

export function Demo() {
  const [selected, setSelected] = useState<string[]>([]);

  const verdict = useMemo(() => {
    const needs = new Set(selected);
    const clientReasons = NEEDS.filter((n) => n.forcesClient && needs.has(n.key));
    const serverWins = NEEDS.filter((n) => !n.forcesClient && needs.has(n.key));

    if (clientReasons.length > 0) {
      return {
        kind: 'client' as const,
        reasons: clientReasons.map((n) => n.label),
        note:
          serverWins.length > 0
            ? 'It also has server-friendly needs — split it: keep the data/heavy part in a Server Component and extract only the interactive bit into a small "use client" island.'
            : 'Mark it with "use client". Its JS will be bundled & shipped.',
      };
    }
    if (serverWins.length > 0) {
      return {
        kind: 'server' as const,
        reasons: serverWins.map((n) => n.label),
        note: 'Keep it a Server Component (the default): no JS shipped, can be async and access server resources directly.',
      };
    }
    return {
      kind: 'server' as const,
      reasons: ['No interactivity required'],
      note: 'Default to a Server Component until you need state/effects/events/browser APIs.',
    };
  }, [selected]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Server vs Client classifier">
        Tick what the component needs to do; the rule of thumb resolves whether it should be a
        Server Component (default) or a Client Component, and why.
      </Callout>

      <Callout kind="warning" title="Runtime boundary">
        React Server Components are compiled and streamed by a framework/server runtime. This SPA
        cannot execute the RSC compiler or Flight stream, so the interactive part below focuses on
        boundary decisions and shows the payload shape you should expect from a real RSC app.
      </Callout>

      <DemoCard title="What does this component need?">
        <Checkbox.Group value={selected} onChange={setSelected}>
          <Stack gap="xs">
            {NEEDS.map((n) => (
              <Checkbox key={n.key} value={n.key} label={n.label} />
            ))}
          </Stack>
        </Checkbox.Group>
      </DemoCard>

      <Alert
        variant="light"
        color={verdict.kind === 'client' ? 'grape' : 'teal'}
        icon={verdict.kind === 'client' ? <IconDeviceDesktop size={18} /> : <IconServer size={18} />}
        title={verdict.kind === 'client' ? "Client Component  ('use client')" : 'Server Component (default)'}
      >
        <Stack gap={6}>
          <Text size="sm">Because:</Text>
          <ul className="ml-4 list-disc">
            {verdict.reasons.map((r) => (
              <li key={r}>
                <Text size="sm">{r}</Text>
              </li>
            ))}
          </ul>
          <Text size="sm">{verdict.note}</Text>
        </Stack>
      </Alert>

      <DemoCard title="The boundary in code">
        <Code block>
          {`// Post.tsx — Server Component (no directive): async, touches the DB, ships 0 JS
export default async function Post({ id }) {
  const post = await db.post.find(id);
  return (
    <article>
      <Markdown>{post.body}</Markdown>   {/* heavy parser stays on the server */}
      <LikeButton postId={post.id} />    {/* interactive island below */}
    </article>
  );
}

// LikeButton.tsx — Client Component: needs state + onClick
'use client';
export function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(v => !v)}>{liked ? '♥' : '♡'}</button>;
}`}
        </Code>
      </DemoCard>

      <DemoCard title="What the browser receives">
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            A real RSC response is not HTML for the server subtree and not a JavaScript bundle for
            that subtree. It is a Flight payload that tells the client renderer how to merge server
            output with client component references.
          </Text>
          <Code block>
            {`// Simplified Flight-like shape, not a public wire-format contract
[
  ["$", "article", null, {
    "children": [
      ["$", "h1", null, { "children": "Server-rendered title" }],
      ["$", "@client/LikeButton", null, { "postId": "42" }]
    ]
  }]
]

// Browser still downloads JS only for referenced Client Components.
// Server-only code, secrets, DB calls, and heavy markdown parsing stay off the client bundle.`}
          </Code>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
