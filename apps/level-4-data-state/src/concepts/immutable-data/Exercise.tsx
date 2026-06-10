import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A todos reducer riddled with mutations. The UI updates inconsistently and
// memoized children don't refresh. Find every mutation and make it immutable.
function todosReducer(state, action) {
  switch (action.type) {
    case 'add':
      state.todos.push({ id: action.id, text: action.text, done: false });
      return state;                                  // same ref

    case 'toggle':
      const t = state.todos.find((t) => t.id === action.id);
      t.done = !t.done;                              // mutates an item
      return { ...state };                           // shallow copy hides the mutation

    case 'sortByText':
      state.todos.sort((a, b) => a.text.localeCompare(b.text)); // sort mutates in place
      return { ...state };

    case 'clearDone':
      for (let i = state.todos.length - 1; i >= 0; i--)
        if (state.todos[i].done) state.todos.splice(i, 1);       // splice mutates
      return { ...state };
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the todos reducer fully immutable"
        description="Fix all four cases so each returns new references along the change path (no push/splice/sort/in-place item mutation). Untouched todos should keep their references."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>[...arr, x]</code> to add, <code>map</code> to update an item (returning a new object
        only for the match), <code>filter</code> to remove, <code>[...arr].sort()</code> /{' '}
        <code>toSorted()</code> to sort. Or wrap the whole thing in Immer's <code>produce</code>.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function todosReducer(state, action) {
  switch (action.type) {
    case 'add':
      return { ...state, todos: [...state.todos, { id: action.id, text: action.text, done: false }] };

    case 'toggle':
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,   // new object only for the match
        ),
      };

    case 'sortByText':
      return {
        ...state,
        todos: [...state.todos].sort((a, b) => a.text.localeCompare(b.text)), // copy first
        // or: todos: state.todos.toSorted((a, b) => a.text.localeCompare(b.text))
      };

    case 'clearDone':
      return { ...state, todos: state.todos.filter((t) => !t.done) };
  }
}

// Immer alternative — mutation-style, immutable output:
import { produce } from 'immer';
const todosReducer = produce((draft, action) => {
  switch (action.type) {
    case 'add': draft.todos.push({ id: action.id, text: action.text, done: false }); break;
    case 'toggle': {
      const t = draft.todos.find((t) => t.id === action.id);
      if (t) t.done = !t.done; break;
    }
    case 'sortByText': draft.todos.sort((a, b) => a.text.localeCompare(b.text)); break;
    case 'clearDone': return void (draft.todos = draft.todos.filter((t) => !t.done));
  }
});`}
      />
    </Stack>
  );
}
