import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Clicking "Apply" recomputes and renders a large, expensive visualization.
// The whole page freezes for ~300ms during the render. Make that render
// non-blocking (time-sliced) and show a pending indicator — without making
// the visualization itself cheaper.
function Dashboard({ rawData }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [view, setView] = useState(() => buildExpensiveView(rawData, defaultFilters));

  function apply(next) {
    setFilters(next);
    setView(buildExpensiveView(rawData, next)); // expensive -> blocks the thread
  }

  return <ExpensiveChart view={view} />;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the heavy render non-blocking"
        description="The expensive view render must not block input/animations. Use a transition so React time-slices it, and surface an isPending state. Note which kind of slowness this does and does NOT fix."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Wrap the non-urgent state update in <code>startTransition</code> from{' '}
        <code>useTransition</code>. Remember: this slices the <i>render</i> phase. If the chart
        commits tens of thousands of DOM nodes, you still need virtualization.
      </Callout>

      <SolutionReveal
        code={`function Dashboard({ rawData }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [view, setView] = useState(() => buildExpensiveView(rawData, defaultFilters));
  const [isPending, startTransition] = useTransition();

  function apply(next) {
    setFilters(next);                 // urgent: update the controls immediately
    startTransition(() => {           // non-urgent: render can be sliced & interrupted
      setView(buildExpensiveView(rawData, next));
    });
  }

  return (
    <>
      {isPending && <Badge>Updating…</Badge>}
      {/* keep showing the previous chart (dimmed) while the next is prepared */}
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        <ExpensiveChart view={view} />
      </div>
    </>
  );
}

// Fixes: input/animations stay responsive (render no longer one long task).
// Does NOT fix: a giant COMMIT (inserting huge DOM) — commit is atomic.
// For that, virtualize the chart so only visible nodes are committed.`}
      />
    </Stack>
  );
}
