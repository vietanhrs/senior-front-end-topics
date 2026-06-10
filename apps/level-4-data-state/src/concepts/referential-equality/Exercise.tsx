import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// <ExpensiveList> is wrapped in React.memo, but it STILL re-renders on every
// keystroke in the unrelated search box, and the effect below runs every render.
// Fix the referential-equality problems.
const ExpensiveList = memo(function ExpensiveList({ items, style, onSelect }) {
  // ...renders thousands of rows...
});

function Page({ data }) {
  const [query, setQuery] = useState('');

  // (1) new array identity every render
  const items = data.filter((d) => d.active);

  // (2) new object every render
  const listStyle = { maxHeight: 400, overflow: 'auto' };

  // (3) new function every render
  const onSelect = (id) => console.log('selected', id);

  // (4) effect depends on a fresh object → runs every render
  useEffect(() => {
    analytics.track('list_shown', { count: items.length });
  }, [items]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveList items={items} style={listStyle} onSelect={onSelect} />
    </>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stabilize the references so memo + effect behave"
        description="Typing in the search box re-renders Page, which hands ExpensiveList brand-new array/object/function props each time → memo is useless and the effect fires constantly. Make the references stable."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>useMemo</code> the derived array and the static style (or hoist the style out of the
        component entirely), <code>useCallback</code> the handler, and depend on a <i>primitive</i>
        (count) in the effect rather than the array object.
      </Callout>

      <SolutionReveal
        code={`// Static object never changes → hoist it OUT of the component (best: zero hooks).
const LIST_STYLE = { maxHeight: 400, overflow: 'auto' };

function Page({ data }) {
  const [query, setQuery] = useState('');

  // (1) memoize the derived array; identity changes only when \`data\` does
  const items = useMemo(() => data.filter((d) => d.active), [data]);

  // (3) stable handler identity
  const onSelect = useCallback((id) => console.log('selected', id), []);

  // (4) depend on a PRIMITIVE, not the array object
  const count = items.length;
  useEffect(() => {
    analytics.track('list_shown', { count });
  }, [count]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveList items={items} style={LIST_STYLE} onSelect={onSelect} />
    </>
  );
}

// Now typing only re-renders the <input>; ExpensiveList's props keep their
// identity, so React.memo bails out and the effect no longer fires per keystroke.
// (React 19's compiler can do much of this automatically.)`}
      />
    </Stack>
  );
}
