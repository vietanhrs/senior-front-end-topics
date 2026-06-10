import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// This reducer deep-clones the entire state on every keystroke "to be safe".
// Result: every selector/memo downstream re-runs (all references changed), and
// it's slow on large state. Rewrite it to update immutably WITH structural
// sharing (only the path to the change gets new references).
function reducer(state, action) {
  const next = structuredClone(state); // ❌ clones EVERYTHING
  switch (action.type) {
    case 'rename-board':
      next.boards[action.boardId].title = action.title;
      return next;
    case 'add-card':
      next.boards[action.boardId].columns[action.colId].cards.push(action.card);
      return next;
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: update immutably with structural sharing"
        description="Replace the full deep clone with path-only copies, so untouched boards/columns keep their references (and memoized selectors don't re-run). Keep it immutable — never mutate shared nodes."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Spread/clone every ancestor of the change and nothing else. For deeply nested updates this
        is verbose by hand — Immer's <code>produce</code> gives you the same structural sharing with
        mutation-style code.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// Option A — by hand: copy only the path (root → boards → board → ...).
function reducer(state, action) {
  switch (action.type) {
    case 'rename-board':
      return {
        ...state,
        boards: {
          ...state.boards,
          [action.boardId]: {
            ...state.boards[action.boardId],
            title: action.title,
          },
        },
        // every OTHER board object is shared by reference
      };

    case 'add-card': {
      const board = state.boards[action.boardId];
      const col = board.columns[action.colId];
      return {
        ...state,
        boards: {
          ...state.boards,
          [action.boardId]: {
            ...board,
            columns: {
              ...board.columns,
              [action.colId]: {
                ...col,
                cards: [...col.cards, action.card], // new array, not push()
              },
            },
          },
        },
      };
    }
  }
}

// Option B — Immer: same structural sharing, far less boilerplate.
import { produce } from 'immer';
const reducer = produce((draft, action) => {
  switch (action.type) {
    case 'rename-board':
      draft.boards[action.boardId].title = action.title; break;
    case 'add-card':
      draft.boards[action.boardId].columns[action.colId].cards.push(action.card); break;
  }
});

// Now untouched boards satisfy prev.boards[x] === next.boards[x] → memoized
// selectors and React.memo skip them.`}
      />
    </Stack>
  );
}
