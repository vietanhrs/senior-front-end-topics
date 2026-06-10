import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Four memoization mistakes. Identify each and fix it (one of them is "delete
// the memo entirely").
function Report({ rows, currency }) {
  // (1) expensive, but the dep is a fresh object every render → never cached
  const totals = useMemo(() => computeTotals(rows, { currency }), [{ currency }, rows]);

  // (2) trivial value, not passed to a memoized child → pointless memo
  const label = useMemo(() => 'Report (' + rows.length + ')', [rows.length]);

  // (3) memoized component, but children is a new element each render → never bails
  const Panel = memo(function Panel({ children }) { return <section>{children}</section>; });

  // (4) useMemo used for correctness: relied on to run setup exactly once
  useMemo(() => { initChart(); }, []); // side effect in useMemo!

  return (
    <Panel>
      <h1>{label}</h1>
      <Totals data={totals} />
    </Panel>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the four memoization pitfalls"
        description="Make the expensive memo actually cache, remove the pointless one, fix the memo'd component that never bails, and move the side effect out of useMemo."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        (1) depend on primitives, not an inline object. (2) just compute it. (3) define memo
        components at module scope and don't rely on `children` for bailout. (4) side effects belong
        in `useEffect`, not `useMemo`.
      </Callout>

      <SolutionReveal
        code={`// (3) Define memoized components OUTSIDE render (stable type) — and note that a
//     component taking \`children\` won't bail on its own; memoize the children's source.
const Panel = memo(function Panel({ children }) {
  return <section>{children}</section>;
});

function Report({ rows, currency }) {
  // (1) depend on the primitive + the array reference, no inline object
  const totals = useMemo(() => computeTotals(rows, { currency }), [rows, currency]);

  // (2) trivial — don't memoize, just compute
  const label = 'Report (' + rows.length + ')';

  // (4) side effect -> useEffect, runs once after mount (and is a real guarantee)
  useEffect(() => { initChart(); }, []);

  return (
    <Panel>
      <h1>{label}</h1>
      {/* Totals is the expensive part — memoize IT so Panel's children identity
          doesn't force its re-render. */}
      <MemoTotals data={totals} />
    </Panel>
  );
}

const MemoTotals = memo(Totals);

// Takeaways: stable/primitive deps make the cache hit; remove caches that protect
// trivial work; memo the expensive subtree (not a generic wrapper that gets new
// children every render); never put effects in useMemo.`}
      />
    </Stack>
  );
}
