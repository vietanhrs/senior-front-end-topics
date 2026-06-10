import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Optimistic rename with TWO bugs:
//  - on failure it does setItems(prevItems), clobbering any OTHER edit that
//    happened while this request was in flight (stale snapshot rollback).
//  - on success it keeps the optimistic guess, ignoring the server's canonical
//    value (e.g. trimmed/normalized name, updatedAt).
function rename(id, name) {
  const prevItems = items;                 // whole-list snapshot
  setItems(items.map((i) => i.id === id ? { ...i, name } : i)); // optimistic

  api.rename(id, name)
    .then(() => { /* keep optimistic value */ })
    .catch(() => setItems(prevItems));      // clobbers concurrent edits
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix concurrent rollback + reconcile with the server"
        description="Make the rollback targeted (revert only this item to its previous value, using a functional update) and reconcile success with the server's returned record. Bonus: rewrite with React 19 useOptimistic."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Snapshot only the affected item's previous value. Roll back with a functional{' '}
        <code>setItems((cur) =&gt; ...)</code> that touches just that id, so concurrent edits to
        other items survive. On success, replace the item with the server's response.
      </Callout>

      <SolutionReveal
        code={`function rename(id, name) {
  const prevName = items.find((i) => i.id === id)?.name;   // snapshot just THIS item

  // optimistic, functional + targeted
  setItems((cur) => cur.map((i) => (i.id === id ? { ...i, name, pending: true } : i)));

  api.rename(id, name)
    .then((serverItem) => {
      // reconcile with the canonical server record (normalized name, updatedAt, …)
      setItems((cur) => cur.map((i) => (i.id === id ? { ...serverItem, pending: false } : i)));
    })
    .catch(() => {
      // targeted rollback — only this item, only if still present; other edits survive
      setItems((cur) => cur.map((i) => (i.id === id ? { ...i, name: prevName, pending: false } : i)));
      toast.error('Rename failed');
    });
}

// React 19 — let useOptimistic manage the optimistic value + auto-revert:
function ItemRow({ item, renameAction }) {
  const [optimisticName, setOptimisticName] = useOptimistic(item.name);
  async function onRename(name) {
    setOptimisticName(name);          // shown immediately
    await renameAction(item.id, name); // on throw/settle, React reverts to item.name
  }
  return <Editable value={optimisticName} onSubmit={onRename} />;
}

// Or React Query: onMutate (snapshot + optimistic cache), onError (rollback),
// onSettled (invalidate to refetch the canonical value).`}
      />
    </Stack>
  );
}
