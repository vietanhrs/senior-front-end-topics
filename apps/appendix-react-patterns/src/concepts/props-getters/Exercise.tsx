import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// useMenu exposes raw state + a toggle, leaving consumers to wire aria + handlers
// by hand. They forget aria, mismatch ids, and clobber the toggle with their own
// onClick. Accessibility is broken at every call site.
function useMenu() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, toggle: () => setIsOpen((o) => !o) };
}

// every consumer reinvents (and breaks) the wiring:
function Menu() {
  const { isOpen, toggle } = useMenu();
  return (
    <>
      {/* no aria-expanded / aria-controls; their onClick REPLACES toggle */}
      <button onClick={() => track('open')}>Menu</button>
      {isOpen && <ul>...</ul>}   {/* no id, no role */}
    </>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: give the hook props getters"
        description="Returning raw state forces every consumer to wire aria + handlers themselves — and they get it wrong (missing aria, mismatched ids, clobbered toggle). Provide getTriggerProps/getMenuProps that wire it correctly and compose the consumer's handlers."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Return getters that bundle <code>aria-expanded</code>/<code>aria-controls</code>, a shared{' '}
        <code>id</code> (<code>useId</code>), <code>role</code>, and the toggle handler. Use a{' '}
        <code>callAll</code> helper so the consumer's <code>onClick</code> runs alongside yours instead
        of replacing it.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`const callAll = (...fns) => (...args) => fns.forEach((fn) => fn?.(...args));

function useMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const toggle = () => setIsOpen((o) => !o);

  const getTriggerProps = ({ onClick, ...props } = {}) => ({
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': menuId,
    ...props,
    onClick: callAll(onClick, toggle),       // consumer's + ours both fire
  });

  const getMenuProps = (props = {}) => ({
    id: menuId,
    role: 'menu',
    hidden: !isOpen,
    ...props,
  });

  return { isOpen, getTriggerProps, getMenuProps };
}

// consumers can't get the wiring wrong — and still add their own handlers/props:
function Menu() {
  const { getTriggerProps, getMenuProps } = useMenu();
  return (
    <>
      <button {...getTriggerProps({ onClick: () => track('open') })}>Menu</button>
      <ul {...getMenuProps()}>...</ul>
    </>
  );
}

// Why it's better: every call site gets correct aria-expanded/controls, matching
// ids, and role for free; the consumer's onClick is composed with the toggle (not
// replaced); and the internal wiring can change without touching consumers. Pair
// with a state reducer if consumers also need to control the open/close transitions.`}
      />
    </Stack>
  );
}
