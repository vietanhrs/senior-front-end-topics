import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// This component is non-deterministic in four ways. It flickers, loses state,
// and fails SSR hydration + snapshot tests. Make it deterministic.
function Feed({ posts }) {
  return (
    <ul>
      {posts
        .sort((a, b) => b.likes - a.likes)          // (1) ties are arbitrary; also mutates props!
        .map((p) => (
          <li key={Math.random()}>                  // (2) new key every render → remounts
            {p.title} — published {new Date().toLocaleString()}  {/* (3) time in render */}
            {Math.random() > 0.5 && <Badge>Hot</Badge>}          {/* (4) random in render */}
          </li>
        ))}
    </ul>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make Feed deterministic"
        description="Fix all four issues: stable total-order sort without mutating props, stable keys, no time/random in render. Decide where the time/'hot' computation should live instead."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Copy before sorting and add an <code>id</code> tiebreaker; key by <code>p.id</code>; compute
        "hot" from data (e.g. <code>likes &gt; threshold</code>), not randomness; derive the
        published label from <code>p.publishedAt</code> (data), formatted deterministically.
      </Callout>

      <SolutionReveal
        code={`function Feed({ posts }) {
  // (1) copy first (don't mutate props); total order with a stable id tiebreaker
  const sorted = [...posts].sort(
    (a, b) => (b.likes - a.likes) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );

  return (
    <ul>
      {sorted.map((p) => (
        <li key={p.id}>                            {/* (2) stable, data-derived key */}
          {p.title} — published {formatDate(p.publishedAt)}  {/* (3) time from DATA, not now() */}
          {p.likes > 100 && <Badge>Hot</Badge>}     {/* (4) "hot" derived from data */}
        </li>
      ))}
    </ul>
  );
}

// Deterministic formatting: fixed locale + timezone so server and client agree.
const fmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
function formatDate(iso) { return fmt.format(new Date(iso)); }

// Where the non-determinism belongs:
//  - ids/timestamps: created with the post (server/reducer), stored on the data.
//  - genuine randomness (e.g. shuffle): seed a PRNG so the same seed → same order,
//    or compute it in an event/effect and store the result in state.`}
      />
    </Stack>
  );
}
