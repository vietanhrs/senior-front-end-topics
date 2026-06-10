import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A checkout flow modeled with booleans. It has real bugs: the user can be
// "submitting" and "error" at once, "success" can show with no orderId, and a
// double-click submits twice. Refactor to a finite state machine.
function Checkout() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  async function submit() {
    setIsSubmitting(true);
    setIsError(false);
    try {
      const { id } = await placeOrder(cart);
      setIsSuccess(true);
      setOrderId(id);
    } catch {
      setIsError(true);       // isSubmitting still true here in some paths!
    } finally {
      setIsSubmitting(false);
    }
  }

  // render: tangled && chains, double-submit possible
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: model checkout as a finite state machine"
        description="Replace the booleans with one discriminated-union state + a reducer. Make impossible states unrepresentable (data lives with its state), and make double-submit impossible by only allowing SUBMIT from the right states."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        States: <code>idle | submitting | success | error</code>. Put <code>orderId</code> inside{' '}
        <code>success</code> and the message inside <code>error</code>. Only <code>idle</code>/
        <code>error</code> accept <code>SUBMIT</code>, so a second click while submitting is ignored.
      </Callout>

      <SolutionReveal
        code={`type State =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; orderId: string }   // orderId ONLY exists here
  | { status: 'error'; message: string };

type Event =
  | { type: 'SUBMIT' }
  | { type: 'RESOLVE'; orderId: string }
  | { type: 'REJECT'; message: string };

function reducer(state: State, event: Event): State {
  switch (state.status) {
    case 'idle':
    case 'error':
      return event.type === 'SUBMIT' ? { status: 'submitting' } : state; // double-submit ignored elsewhere
    case 'submitting':
      if (event.type === 'RESOLVE') return { status: 'success', orderId: event.orderId };
      if (event.type === 'REJECT')  return { status: 'error', message: event.message };
      return state;                                  // SUBMIT while submitting → ignored
    case 'success':
      return state;
  }
}

function Checkout() {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });

  async function submit() {
    if (state.status === 'submitting' || state.status === 'success') return; // guard
    dispatch({ type: 'SUBMIT' });
    try {
      const { id } = await placeOrder(cart);
      dispatch({ type: 'RESOLVE', orderId: id });
    } catch (e) {
      dispatch({ type: 'REJECT', message: String(e) });
    }
  }

  // Clean rendering — no && soup, every branch is exhaustive:
  switch (state.status) {
    case 'idle':       return <Button onClick={submit}>Place order</Button>;
    case 'submitting': return <Spinner />;                       // can't also be error
    case 'success':    return <Receipt orderId={state.orderId} />; // orderId guaranteed
    case 'error':      return <Error msg={state.message} onRetry={submit} />;
  }
}`}
      />
    </Stack>
  );
}
