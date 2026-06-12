import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A shell that composes three MFEs. One MFE crashing blanks the whole page, the
// MFEs are coupled through a shared mutable global, and they load eagerly.
import Catalog from 'catalog/App';   // eager, synchronous
import Recs from 'recs/App';
import Nav from 'nav/App';

window.__APP_STATE__ = { user: null, cart: [] };  // shared mutable global → coupling

function Shell() {
  return (
    <div>
      <Nav />
      <Catalog />     {/* if Catalog throws during render, the entire app unmounts */}
      <Recs />
    </div>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: orchestrate the MFEs safely"
        description="A crash in any MFE takes down the shell, the MFEs are coupled via a global mutable object, and everything loads eagerly. Add failure isolation, loosen the coupling, and load remotes lazily."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Wrap each MFE in its own <b>error boundary</b> so a failure degrades to a fallback without
        touching siblings or the shell. Replace the shared mutable global with <b>loose
        communication</b> — props/callbacks from the shell, or a small pub-sub / custom events.{' '}
        <b>Lazy-load</b> remotes (<code>React.lazy</code> + <code>Suspense</code>) so a slow/broken
        remote doesn't block the rest.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { lazy, Suspense } from 'react';

// lazy remotes → independent load, slow/broken one can't block the others
const Catalog = lazy(() => import('catalog/App'));
const Recs = lazy(() => import('recs/App'));
const Nav = lazy(() => import('nav/App'));

// Per-MFE failure isolation: a crash degrades to a fallback, shell stays up.
class MfeBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { telemetry.report('mfe-crash', { name: this.props.name, err }); }
  render() {
    if (this.state.failed) return <div className="mfe-fallback">{this.props.name} is unavailable</div>;
    return this.props.children;
  }
}

function Mfe({ name, children }) {
  return (
    <MfeBoundary name={name}>
      <Suspense fallback={<Skeleton label={name} />}>{children}</Suspense>
    </MfeBoundary>
  );
}

function Shell() {
  // The shell owns shared services and passes them DOWN (no shared mutable global).
  const session = useSession();
  const bus = useEventBus();           // tiny pub-sub for cross-MFE messages

  return (
    <div>
      <Mfe name="Nav"><Nav session={session} onNavigate={bus.emit} /></Mfe>
      <Mfe name="Catalog"><Catalog session={session} onAddToCart={(i) => bus.emit('cart:add', i)} /></Mfe>
      <Mfe name="Recommendations"><Recs onSelect={(i) => bus.emit('product:view', i)} /></Mfe>
    </div>
  );
}

// Why it's better: each MFE is wrapped in an error boundary (one crash → local
// fallback, shell + siblings unaffected) and a Suspense boundary (independent
// lazy load). Coupling is explicit and loose — the shell injects session and a
// small event bus instead of a shared mutable global, so teams stay autonomous
// and you avoid a distributed monolith.`}
      />
    </Stack>
  );
}
