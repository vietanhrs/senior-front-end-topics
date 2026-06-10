import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A React tooltip component that leaks detached nodes every time it mounts.
// Find the THREE leaks and fix them.
function Tooltip({ targetRef, data }) {
  const elRef = useRef(document.createElement('div'));

  useEffect(() => {
    const el = elRef.current;
    document.body.appendChild(el);

    // (1) listener on a long-lived target, never removed
    window.addEventListener('scroll', () => reposition(el, targetRef.current));

    // (2) interval referencing the node, never cleared
    setInterval(() => el.textContent = format(data), 1000);

    // (3) a module-level registry that keeps the node forever
    tooltipRegistry.push(el);
  }, []);

  return null;
}

const tooltipRegistry = [];`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stop the tooltip from leaking detached nodes"
        description="Each mount appends a node to <body>, wires a window listener, an interval, and a global registry — none cleaned up. On unmount the node detaches but stays referenced. Fix all three and remove the appended node."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Return a cleanup from <code>useEffect</code> that: removes the listener (named handler),
        clears the interval, removes the node from <code>&lt;body&gt;</code>, and drops it from the
        registry. Prefer a <code>WeakSet</code>/<code>WeakMap</code> if you must track nodes globally.
      </Callout>

      <SolutionReveal
        code={`const tooltipRegistry = new WeakSet(); // won't keep nodes alive on its own

function Tooltip({ targetRef, data }) {
  const elRef = useRef(document.createElement('div'));

  useEffect(() => {
    const el = elRef.current;
    document.body.appendChild(el);

    const onScroll = () => reposition(el, targetRef.current); // named -> removable
    window.addEventListener('scroll', onScroll);

    const id = setInterval(() => { el.textContent = format(data); }, 1000);

    tooltipRegistry.add(el);

    // Cleanup: undo EVERYTHING so nothing keeps the node alive after unmount.
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(id);
      el.remove();                 // detach from <body>
      tooltipRegistry.delete(el);  // (WeakSet would release it anyway, but be explicit)
    };
  }, [data, targetRef]);

  return null;
}

// Verify: mount/unmount the tooltip many times, take heap snapshots filtered by
// "Detached" — the count should stay flat, not climb.`}
      />
    </Stack>
  );
}
