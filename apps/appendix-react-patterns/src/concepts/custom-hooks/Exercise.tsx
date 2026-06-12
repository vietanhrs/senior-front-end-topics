import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Two components duplicate the exact same window-resize logic (and both forget
// to remove the listener on unmount). Copy-paste, not reuse.
function Sidebar() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    // no cleanup → leaks a listener per mount
  }, []);
  return width < 768 ? <CollapsedNav /> : <FullNav />;
}

function Chart() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    // duplicated, and also no cleanup
  }, []);
  return <svg width={width} />;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: extract the duplicated logic into a custom hook"
        description="The resize logic is copy-pasted into two components and both leak the listener. Extract one well-behaved useWindowWidth() hook that owns the effect + cleanup, and reuse it."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Move the state + effect into <code>useWindowWidth()</code>. Put the{' '}
        <code>removeEventListener</code> in the effect's cleanup so consumers can't forget it. Both
        components then become one line — sharing the logic, each with its own state value.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// one hook owns the state, the listener, AND its cleanup
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth); // lazy init
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize); // cleanup — no leak
  }, []);
  return width;
}

// (even better, tear-free under concurrent rendering — see Level 8 tearing:
//  const width = useSyncExternalStore(
//    (cb) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); },
//    () => window.innerWidth,
//  ); )

function Sidebar() {
  const width = useWindowWidth();
  return width < 768 ? <CollapsedNav /> : <FullNav />;
}

function Chart() {
  const width = useWindowWidth();
  return <svg width={width} />;
}

// Why it's better: the logic exists once and is reused; the listener is always
// cleaned up (the hook can't be misused); each component still gets its own width
// value. Adding a feature (throttling, SSR guard) now changes one place.`}
      />
    </Stack>
  );
}
