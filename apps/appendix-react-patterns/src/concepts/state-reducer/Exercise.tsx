import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A reusable useStepper hook. Every team that uses it wants a slightly different
// rule, so it has sprouted a pile of special-case props — and still can't cover
// the next request ("wrap around to 0 at max", "step by 2 on shift")...
function useStepper({ max, min = 0, disableAtMax, lockWhenEven, doubleStepThreshold }) {
  const [value, setValue] = useState(min);
  const inc = () => setValue((v) => {
    if (disableAtMax && v >= max) return v;
    if (lockWhenEven && v % 2 === 0) return v;
    const next = v + (v >= (doubleStepThreshold ?? Infinity) ? 2 : 1);
    return Math.min(next, max);
  });
  // ...and a symmetric pile in dec(). New rule = new prop = edit this file again.
  return { value, inc };
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: invert control with a state reducer"
        description="The hook keeps growing one-off behavior props and still can't anticipate every rule. Refactor it to run a clean internal reducer, then hand the consumer a stateReducer that can override any transition — replacing all those props."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Model transitions as actions in an <code>internalReducer</code>. Wrap it so the consumer's{' '}
        <code>stateReducer(state, changes, action)</code> gets the final say. Then each special rule
        (clamp, wrap-around, lock-even, double-step) becomes a few lines in the <i>consumer's</i>{' '}
        reducer — the hook loses all those props.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function internalReducer(state, action) {
  switch (action.type) {
    case 'inc': return { value: state.value + (action.step ?? 1) };
    case 'dec': return { value: state.value - (action.step ?? 1) };
    case 'set': return { value: action.value };
    default: return state;
  }
}

function useStepper({ initial = 0, stateReducer = (_s, changes) => changes } = {}) {
  const [state, dispatch] = useReducer((state, action) => {
    const changes = internalReducer(state, action);     // what we'd normally do
    return stateReducer(state, changes, action);        // consumer overrides/vetoes
  }, { value: initial });

  return {
    value: state.value,
    inc: (step) => dispatch({ type: 'inc', step }),
    dec: (step) => dispatch({ type: 'dec', step }),
    set: (value) => dispatch({ type: 'set', value }),
  };
}

// All the former PROPS become consumer reducers — and new rules need no hook edit:

// clamp 0..max
const a = useStepper({ stateReducer: (s, c) => ({ value: Math.max(0, Math.min(10, c.value)) }) });

// wrap around to 0 at max (a rule the old hook couldn't do)
const b = useStepper({ stateReducer: (s, c) => ({ value: c.value > 10 ? 0 : c.value }) });

// lock on even values
const d = useStepper({ stateReducer: (s, c, action) =>
  action.type === 'inc' && s.value % 2 === 0 ? s : c });

// Why it's better: the hook has ONE extensibility point instead of an
// ever-growing prop list. Consumers express any transition rule in their own
// reducer (clamp, wrap, lock, step-by-N, …) without the hook anticipating them —
// inversion of control. The internal reducer stays small and the API stays stable.`}
      />
    </Stack>
  );
}
