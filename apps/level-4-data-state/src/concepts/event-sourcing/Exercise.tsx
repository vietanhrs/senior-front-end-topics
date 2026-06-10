import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A drawing canvas stores only the CURRENT shapes array and mutates it.
// Product wants: unlimited undo/redo + the ability to replay a drawing.
// This design can't do either. Re-architect it as event sourcing.
function useCanvas() {
  const [shapes, setShapes] = useState([]);

  function addShape(shape)   { setShapes((s) => [...s, shape]); }
  function moveShape(id, dx, dy) {
    setShapes((s) => s.map((sh) => sh.id === id ? { ...sh, x: sh.x + dx, y: sh.y + dy } : sh));
  }
  function deleteShape(id)   { setShapes((s) => s.filter((sh) => sh.id !== id)); }

  // no history, no undo, no replay
  return { shapes, addShape, moveShape, deleteShape };
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: re-architect the canvas with event sourcing"
        description="Store an append-only event log + a cursor. Derive shapes by folding events up to the cursor. Implement undo/redo by moving the cursor (and truncating the future when a new event is appended)."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Keep <code>events: Event[]</code> and <code>cursor: number</code>. <code>shapes =
        events.slice(0, cursor).reduce(apply, [])</code>. Appending after an undo slices off the
        redo tail. Snapshot every K events if replays get slow.
      </Callout>

      <SolutionReveal
        code={`type Event =
  | { type: 'add'; shape: Shape }
  | { type: 'move'; id: string; dx: number; dy: number }
  | { type: 'delete'; id: string };

function apply(shapes: Shape[], e: Event): Shape[] {
  switch (e.type) {
    case 'add':    return [...shapes, e.shape];
    case 'move':   return shapes.map((s) => s.id === e.id ? { ...s, x: s.x + e.dx, y: s.y + e.dy } : s);
    case 'delete': return shapes.filter((s) => s.id !== e.id);
  }
}

function useCanvas() {
  const [events, setEvents] = useState<Event[]>([]);
  const [cursor, setCursor] = useState(0);

  // Derived projection — never stored, always folded.
  const shapes = useMemo(() => events.slice(0, cursor).reduce(apply, []), [events, cursor]);

  function commit(e: Event) {
    const kept = events.slice(0, cursor);   // drop any redo tail
    setEvents([...kept, e]);
    setCursor(kept.length + 1);
  }

  const addShape  = (shape) => commit({ type: 'add', shape });
  const moveShape = (id, dx, dy) => commit({ type: 'move', id, dx, dy });
  const deleteShape = (id) => commit({ type: 'delete', id });

  const undo = () => setCursor((c) => Math.max(0, c - 1));
  const redo = () => setCursor((c) => Math.min(events.length, c + 1));
  const replayTo = (t: number) => setCursor(t);   // time-travel / animated replay

  return { shapes, addShape, moveShape, deleteShape, undo, redo, replayTo };
}

// Bonus — snapshots for long logs:
//   keep [{ at: k, state }]; to render at cursor C, start from the latest
//   snapshot <= C and fold only events (snapshot.at .. C].`}
      />
    </Stack>
  );
}
