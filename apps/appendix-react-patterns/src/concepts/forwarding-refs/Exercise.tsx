import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A search form wants to focus the input after submitting and clear it on Esc.
// But <FancyInput> doesn't forward its ref, so inputRef.current is null — and the
// team's workaround is to reach into the DOM by id (fragile, breaks encapsulation).
function FancyInput({ value, onChange }) {
  return <input className="fancy" value={value} onChange={onChange} />; // ref goes nowhere
}

function SearchForm() {
  const inputRef = useRef(null);
  const focusInput = () => inputRef.current?.focus(); // inputRef.current === null

  return (
    <form onSubmit={(e) => { e.preventDefault(); search(); focusInput(); }}>
      <FancyInput ref={inputRef} />          {/* ref is ignored by FancyInput */}
      {/* hack elsewhere: document.getElementById('search')?.focus() */}
    </form>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: forward the ref and expose a clean imperative API"
        description="FancyInput swallows the ref, so the parent can't focus it (and resorts to getElementById). Forward the ref to the real input, and expose only the focus/clear operations the parent needs via useImperativeHandle."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Wrap <code>FancyInput</code> in <code>forwardRef</code> and either put the ref straight on the{' '}
        <code>&lt;input&gt;</code>, or use <code>useImperativeHandle</code> to expose a minimal{' '}
        <code>{'{ focus, clear }'}</code> API. Then the parent's <code>inputRef.current</code> works —
        no <code>getElementById</code>. (React 19: take <code>ref</code> as a prop, no{' '}
        <code>forwardRef</code>.)
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { forwardRef, useImperativeHandle, useRef } from 'react';

const FancyInput = forwardRef(function FancyInput({ value, onChange }, ref) {
  const inputRef = useRef(null);
  // expose a small, intentional API rather than the raw node
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => onChange({ target: { value: '' } }),
  }), [onChange]);
  return <input className="fancy" ref={inputRef} value={value} onChange={onChange} />;
});

function SearchForm() {
  const api = useRef(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') api.current?.clear(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); search(q); api.current?.focus(); }}>
      <FancyInput value={q} onChange={(e) => setQ(e.target.value)} ref={api} />
    </form>
  );
}

// React 19 version — ref is just a prop, no forwardRef:
//   function FancyInput({ value, onChange, ref }) {
//     const inputRef = useRef(null);
//     useImperativeHandle(ref, () => ({ focus: () => inputRef.current.focus() }));
//     return <input ref={inputRef} value={value} onChange={onChange} />;
//   }

// Why it's better: the ref reaches the real input, so focus()/clear() work and the
// getElementById hack disappears (encapsulation restored). useImperativeHandle
// exposes only the operations the parent should have, keeping the rest of the
// input private. Data still flows declaratively via value/onChange.`}
      />
    </Stack>
  );
}
