import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Syncs cart state across tabs. It flickers, sometimes shows an OLDER cart than
// what you just had, and every tab opens its own socket to the server.
function useCartSync() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const ch = new BroadcastChannel('cart');
    ch.onmessage = (e) => setCart(e.data);   // blindly applies whatever arrives
    return () => ch.close();
  }, []);

  function update(next) {
    setCart(next);
    new BroadcastChannel('cart').postMessage(next); // new channel each call; no version
  }

  // every tab also does this independently:
  useEffect(() => { openServerSocket(onPush); }, []); // N tabs → N sockets
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make cross-tab cart sync consistent"
        description="It applies any incoming message (so a stale/out-of-order one can roll the cart backwards), creates a channel per update, and opens one server socket per tab. Add monotonic versioning and elect a single leader tab to own the socket."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Keep <b>one</b> channel. <b>Version</b> every update and apply an incoming one only if it's
        strictly newer (<b>monotonic reads</b> — no going backwards). Elect a <b>leader</b> with the{' '}
        <b>Web Locks API</b> so only one tab holds the server socket and broadcasts to the rest.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function useCartSync() {
  const [state, setState] = useState({ cart: [], version: 0 });
  const ref = useRef(state);
  ref.current = state;
  const chan = useRef(null);

  useEffect(() => {
    const ch = new BroadcastChannel('cart');   // ONE channel for the tab's lifetime
    chan.current = ch;
    ch.onmessage = (e) => {
      // monotonic reads: accept only a strictly-newer version → never roll backwards
      if (e.data.version > ref.current.version) setState(e.data);
    };

    // Leader election: exactly one tab holds the lock → owns the server socket.
    // navigator.locks.request never resolves while held, so only the leader runs this.
    navigator.locks.request('cart-leader', () =>
      new Promise(() => {                       // hold forever while we're leader
        openServerSocket((serverCart) => {
          const next = { cart: serverCart, version: ref.current.version + 1 };
          setState(next);
          ch.postMessage(next);                 // fan out to follower tabs
        });
      }),
    );

    return () => ch.close();                    // releasing the lock promotes another tab
  }, []);

  function update(cart) {
    const next = { cart, version: ref.current.version + 1 }; // bump version
    setState(next);                              // read-your-writes (optimistic, local)
    chan.current.postMessage(next);              // broadcast once, versioned
  }

  return [state.cart, update];
}

// Why it's consistent: one persistent channel (not a new one per message);
// versioned updates that are applied only when strictly newer (monotonic reads —
// stale/out-of-order messages are dropped, no flicker/rollback); and Web Locks
// elects a single leader tab to own the socket, so N tabs share ONE connection and
// followers stay in sync via broadcast. Model: eventual + read-your-writes + monotonic.`}
      />
    </Stack>
  );
}
