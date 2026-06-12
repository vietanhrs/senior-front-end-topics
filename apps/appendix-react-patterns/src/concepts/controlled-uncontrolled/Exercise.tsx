import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// This input fights itself: it passes BOTH value and an uncontrolled defaultValue,
// starts as undefined (uncontrolled) then becomes controlled after fetch, and the
// onChange doesn't update the value it's given — so typing does nothing.
function NameField({ initial }) {
  const [name, setName] = useState();          // undefined → uncontrolled to start

  useEffect(() => { fetchName().then(setName); }, []); // later becomes a string → controlled (warning!)

  return (
    <input
      value={name}                              // undefined at first, then defined → mode switch
      defaultValue={initial}                    // defaultValue + value together (ignored + confusing)
      onChange={(e) => console.log(e.target.value)} // never calls setName → input is frozen
    />
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: pick one mode and make it consistent"
        description="This input mixes value + defaultValue, switches from uncontrolled to controlled mid-life (React warning), and ignores onChange so it's frozen. Make it cleanly controlled (or cleanly uncontrolled) and actually editable."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Controlled: initialize state to a defined value (<code>''</code>, never <code>undefined</code>),
        update it in <code>onChange</code>, and drop <code>defaultValue</code>. Seed async data into
        that same state. Or go fully uncontrolled with a ref + <code>defaultValue</code> and no{' '}
        <code>value</code>.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// Option A — CONTROLLED (most common for app forms with validation/derived state)
function NameField({ initial = '' }) {
  const [name, setName] = useState(initial);          // defined from the start → always controlled

  useEffect(() => {
    let active = true;
    fetchName().then((n) => active && setName(n ?? '')); // seed the SAME state; stays a string
    return () => { active = false; };
  }, []);

  return (
    <input
      value={name}                                       // always defined → no mode switch
      onChange={(e) => setName(e.target.value)}          // updates the source of truth → editable
      // no defaultValue when controlled
    />
  );
}

// Option B — UNCONTROLLED (just need the final value; fewer re-renders)
function NameFieldUncontrolled({ initial = '' }) {
  const ref = useRef(null);
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(ref.current.value); }}>
      <input defaultValue={initial} ref={ref} />        {/* defaultValue, NEVER value */}
      <button>Save</button>
    </form>
  );
}

// Why it's fixed: the controlled version is defined from the first render (no
// uncontrolled→controlled warning), onChange writes back to state (so it's
// editable), and value/defaultValue aren't mixed. The uncontrolled version keeps
// the value in the DOM and reads it on submit. Each picks exactly one owner of the
// state and sticks with it.`}
      />
    </Stack>
  );
}
