import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// "Place order" creates duplicate orders on double-click and on retry-after-
// timeout (the request succeeded but the response was lost, so it retries and
// charges again). Make the action idempotent and safe to repeat.
function Checkout({ cart }) {
  async function placeOrder() {
    // fires a brand-new POST every call; no key, no guard, retries duplicate
    const res = await fetchWithRetry('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ cart }),
    });
    return res.json();
  }

  return <button onClick={placeOrder}>Place order</button>;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make 'Place order' idempotent"
        description="Add an idempotency key that is created once per intended order and reused across retries, plus a client-side submitting guard. Explain why the key (not just the guard) is required."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Generate the key when the user <i>intends</i> the order (not per request), send it as an{' '}
        <code>Idempotency-Key</code> header, and reuse it for every retry of that attempt. Add a{' '}
        <code>submitting</code> state to block double-clicks; rotate the key only for a genuinely new
        order.
      </Callout>

      <SolutionReveal
        code={`function Checkout({ cart }) {
  const [status, setStatus] = useState('idle'); // idle | submitting | done
  // Key for the CURRENT intended order; stable across retries of this attempt.
  const idempotencyKey = useRef(crypto.randomUUID());

  async function placeOrder() {
    if (status === 'submitting' || status === 'done') return; // (1) guard double-clicks
    setStatus('submitting');
    try {
      const res = await fetchWithRetry('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey.current, // (2) same key on every retry → server dedupes
        },
        body: JSON.stringify({ cart }),
      });
      const order = await res.json();
      setStatus('done');
      idempotencyKey.current = crypto.randomUUID(); // (3) next, distinct order gets a fresh key
      return order;
    } catch (e) {
      setStatus('idle'); // allow a manual retry — SAME key, so still at most one order
      throw e;
    }
  }

  return (
    <button onClick={placeOrder} disabled={status !== 'idle'}>
      {status === 'submitting' ? 'Placing…' : 'Place order'}
    </button>
  );
}

// Why the key AND the guard:
//  - The disabled/submitting guard stops a second CLICK.
//  - But fetchWithRetry may resend after a timeout where the order was ALREADY
//    created and only the response was lost. The guard can't know that; the
//    idempotency key lets the server recognize the retry and return the original
//    order instead of creating a second one.
// Bonus: design the endpoint to upsert by a client-generated orderId so the
// create is naturally idempotent.`}
      />
    </Stack>
  );
}
