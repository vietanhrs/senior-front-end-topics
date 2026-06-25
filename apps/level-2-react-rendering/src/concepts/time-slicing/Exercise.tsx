import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Clicking "Apply" renders a large, expensive visualization from rawData + filters.
// The whole page freezes for ~300ms during the render. Make that render
// non-blocking (time-sliced) and show a pending indicator — without making
// the visualization component itself cheaper.
function Dashboard({ rawData }) {
  const [filters, setFilters] = useState(defaultFilters);

  function apply(next) {
    setFilters(next); // drives expensive render below
  }

  const view = buildExpensiveView(rawData, filters);
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
        Wrap the cheap state update that drives the expensive render in{' '}
        <code>startTransition</code> from <code>useTransition</code>. Remember: this slices the
        <i> render</i> phase. If the chart commits tens of thousands of DOM nodes, you still need
        virtualization.
      </Callout>

      <SolutionReveal
        code={`function Dashboard({ rawData }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [chartFilters, setChartFilters] = useState(defaultFilters);
  const [isPending, startTransition] = useTransition();
  const view = useMemo(
    () => buildExpensiveView(rawData, chartFilters),
    [rawData, chartFilters],
  );

  function apply(next) {
    setFilters(next);                 // urgent: update the controls immediately
    startTransition(() => {           // non-urgent: render can be sliced & interrupted
      setChartFilters(next);          // cheap state update that drives expensive render
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
// Does NOT fix: a 300ms synchronous buildExpensiveView call inside the event
// handler before setState — React cannot yield inside arbitrary JS.
// Does NOT fix: a giant COMMIT (inserting huge DOM) — commit is atomic.
// For that, virtualize the chart so only visible nodes are committed.`}
      />
    </Stack>
  );
}
