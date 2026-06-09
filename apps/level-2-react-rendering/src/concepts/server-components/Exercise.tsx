import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `'use client';                       // ⟵ is this directive in the right place?
import db from '@/server/db';        // server-only module
import { useState } from 'react';
import { Markdown } from 'heavy-markdown-lib'; // 120KB

export default async function Article({ slug }) {
  const article = await db.article.findBySlug(slug); // DB access
  const [expanded, setExpanded] = useState(false);   // interactivity

  return (
    <article>
      <Markdown>{article.body}</Markdown>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Collapse' : 'Expand'}
      </button>
    </article>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the server/client split"
        description="This component is broken: it's marked 'use client' yet is async, imports a server-only DB module, and bundles a 120KB markdown lib — while also needing interactive state. Split it correctly."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        A Client Component can't be async, can't import server-only modules, and ships all its
        imports to the browser. Keep the data + heavy rendering on the server; extract ONLY the
        interactive part into a tiny <code>'use client'</code> island, passing data as props.
      </Callout>

      <SolutionReveal
        code={`// Article.tsx — Server Component (no 'use client'): async + DB + heavy lib stay server-side
import db from '@/server/db';
import { Markdown } from 'heavy-markdown-lib';   // never shipped to the browser
import { ExpandToggle } from './ExpandToggle';

export default async function Article({ slug }) {
  const article = await db.article.findBySlug(slug);
  return (
    <article>
      {/* Markdown is rendered on the server; the 120KB lib isn't bundled */}
      <Markdown>{article.body}</Markdown>
      <ExpandToggle />               {/* the only interactive island */}
    </article>
  );
}

// ExpandToggle.tsx — small Client Component: the only thing that needs state/events
'use client';
import { useState } from 'react';
export function ExpandToggle() {
  const [expanded, setExpanded] = useState(false);
  return (
    <button onClick={() => setExpanded((v) => !v)}>
      {expanded ? 'Collapse' : 'Expand'}
    </button>
  );
}

// Result: ~0 JS for the article body + markdown lib; only the tiny toggle ships.`}
      />
    </Stack>
  );
}
