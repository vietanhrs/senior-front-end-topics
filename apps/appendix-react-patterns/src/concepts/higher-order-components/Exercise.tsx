import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A withAuth HOC that gates a page behind login. It has four classic HOC bugs.
function withAuth(Wrapped) {
  return function (props) {
    const user = useUser();
    if (!user) return <Redirect to="/login" />;
    return <Wrapped user={user} />;   // (1) drops all of Wrapped's own props
  };
  // (2) no displayName → DevTools shows "Anonymous"/"WithAuth" everywhere
  // (3) ref to the wrapped component is lost
}

function Dashboard({ user, filters, onExport }, ref) { /* ... */ }

// (4) created inside render → remounts Dashboard (and loses its state) every render
function Page(props) {
  const Guarded = withAuth(Dashboard);
  return <Guarded {...props} />;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the HOC hygiene bugs"
        description="This withAuth swallows props, has no displayName, loses refs, and is created inside render (remounting on every render). Fix all four — then note that a hook/component would be simpler here."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Spread <code>...rest</code> so the wrapped component keeps its props; set{' '}
        <code>displayName</code>; wrap with <code>forwardRef</code> and pass the ref through; and
        create the wrapped component <b>once</b> at module scope, not inside render.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { forwardRef } from 'react';

function withAuth(Wrapped) {
  // (3) forwardRef so a ref reaches the wrapped component, not the wrapper
  const WithAuth = forwardRef(function WithAuth(props, ref) {
    const user = useUser();
    if (!user) return <Redirect to="/login" />;
    // (1) pass through ALL props + the ref; inject user on top
    return <Wrapped ref={ref} user={user} {...props} />;
  });
  // (2) helpful name in DevTools
  WithAuth.displayName = \`withAuth(\${Wrapped.displayName ?? Wrapped.name})\`;
  // (bonus) copy non-React statics if Wrapped had any:
  // hoistNonReactStatics(WithAuth, Wrapped);
  return WithAuth;
}

const Dashboard = forwardRef(function Dashboard({ user, filters, onExport }, ref) { /* ... */ });

// (4) wrap ONCE, at module scope — stable identity, no remounts
const GuardedDashboard = withAuth(Dashboard);

function Page(props) {
  return <GuardedDashboard {...props} />;
}

// Simpler modern alternative — no HOC at all:
//   function Page(props) {
//     const user = useUser();
//     if (!user) return <Redirect to="/login" />;
//     return <Dashboard user={user} {...props} />;
//   }
// or a <RequireAuth> wrapper component with children.

// Why it's fixed: props flow through (...props), DevTools is readable
// (displayName), refs reach Dashboard (forwardRef), and the wrapped component is
// created once so Dashboard keeps its state across Page re-renders.`}
      />
    </Stack>
  );
}
