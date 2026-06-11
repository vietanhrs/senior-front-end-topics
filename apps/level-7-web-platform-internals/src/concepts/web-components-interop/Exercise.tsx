import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Using a third-party web component <date-range-picker> from React (pre-React-19
// behavior). It renders, but: the preset object never applies, the selected
// range never reaches React, and TypeScript complains the tag is unknown.

function Filters() {
  const [range, setRange] = useState(null);
  return (
    <date-range-picker
      preset={{ start: '2026-01-01', end: '2026-03-31' }}  // (1) object via attribute → "[object Object]"
      min="2020-01-01"                                      // (ok: string attribute)
      onRangeChange={(e) => setRange(e.detail)}             // (2) custom event ≠ React onX
    />
  );
}
// (3) TS: Property 'date-range-picker' does not exist on type 'JSX.IntrinsicElements'`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the web component interop correctly"
        description="Pass the object as a property (via ref), subscribe to the custom event with addEventListener (+ cleanup), and add the JSX typing. Note what changes under React 19."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Object props → set as a <b>property</b> on the element via a <code>ref</code> in an effect.
        Custom events → <code>el.addEventListener('range-change', …)</code> with cleanup, not{' '}
        <code>onRangeChange</code>. Augment <code>JSX.IntrinsicElements</code> for the tag.
      </Callout>

      <SolutionReveal
        language="tsx"
        code={`// (3) JSX typing for the custom tag (React 19: React.JSX namespace)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'date-range-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        min?: string;   // string-safe attribute can stay in JSX
      };
    }
  }
}

function Filters() {
  const [range, setRange] = useState(null);
  const ref = useRef<HTMLElement & { preset?: unknown }>(null);

  // (1) object → PROPERTY, set imperatively (don't pass via attribute)
  useEffect(() => {
    if (ref.current) ref.current.preset = { start: '2026-01-01', end: '2026-03-31' };
  }, []);

  // (2) custom event → addEventListener (+ cleanup), not onRangeChange
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => setRange((e as CustomEvent).detail);
    el.addEventListener('range-change', handler);
    return () => el.removeEventListener('range-change', handler);
  }, []);

  return <date-range-picker ref={ref} min="2020-01-01" />;
}

// Notes:
//  - React ≤ 18 sets unknown props as ATTRIBUTES (stringifies objects) and won't
//    bind custom events → the ref pattern above is required (or wrap with @lit/react).
//  - React 19 sets a PROPERTY when the element instance has one, so
//    <date-range-picker preset={obj} /> can work directly — but arbitrary custom
//    events still generally need addEventListener. The ref approach is the
//    portable baseline across versions.
//  - If the element may render before customElements.define runs, gate measuring/
//    styling with :defined / customElements.whenDefined('date-range-picker').`}
      />
    </Stack>
  );
}
