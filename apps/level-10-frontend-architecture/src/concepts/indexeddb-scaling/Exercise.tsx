import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Imports 50k records and then reads them back. It's slow, janks the UI, and
// sometimes throws TransactionInactiveError.
async function importAll(records) {
  for (const r of records) {
    const tx = db.transaction('items', 'readwrite');  // (1) a transaction PER record
    tx.objectStore('items').add(r);
    await txDone(tx);
  }
}

async function getByCategory(cat) {
  const all = await getAll('items');                  // (2) loads ALL 50k into memory
  return all.filter((r) => r.category === cat);       //     then filters in JS (no index)
}

async function enrich() {
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  for (const r of await getAll('items')) {
    const extra = await fetch('/api/' + r.id).then((x) => x.json()); // (3) await fetch mid-tx!
    store.put({ ...r, extra });                       // tx already auto-committed → throws
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the IndexedDB usage scale"
        description="Three classic mistakes: a transaction per record, full-scan-and-filter instead of an index, and awaiting fetch mid-transaction (which auto-commits and then throws). Fix all three."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Batch all writes into <b>one</b> transaction. Add a <b>category index</b> in{' '}
        <code>onupgradeneeded</code> and query it (or a key range) instead of scanning. Never{' '}
        <code>await</code> a non-IDB promise inside a live transaction — do all network work{' '}
        <i>first</i>, then open a single transaction to write the results.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// (schema) add the index once, in a version upgrade
req.onupgradeneeded = () => {
  const os = req.result.createObjectStore('items', { keyPath: 'id' });
  os.createIndex('by-category', 'category');
};

// (1) ONE transaction for the whole import → no per-record commit overhead
async function importAll(records) {
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  for (const r of records) store.add(r); // queue all requests synchronously
  await txDone(tx);                       // single commit
}

// (2) query the INDEX (reads only matches) — optionally a bounded range
function getByCategory(cat) {
  return reqDone(db.transaction('items').objectStore('items')
    .index('by-category').getAll(cat));
  // huge result? walk a cursor over the index and paginate with IDBKeyRange.
}

// (3) do ALL network work FIRST, then write in a single short transaction.
//     Never await fetch/timer between IDB requests — the tx auto-commits.
async function enrich() {
  const rows = await getByCategory('all');                     // read phase
  const enriched = await Promise.all(                          // network phase (no tx open)
    rows.map(async (r) => ({ ...r, extra: await fetch('/api/' + r.id).then((x) => x.json()) })),
  );
  const tx = db.transaction('items', 'readwrite');             // write phase: one live tx
  const store = tx.objectStore('items');
  for (const r of enriched) store.put(r);
  await txDone(tx);
}

// Bonus at real scale: do the IDB work in a Worker (structured clone is a
// main-thread cost), request persistent storage, and shard independent datasets.

// Why it scales: one transaction amortizes commit overhead; the index turns an
// O(all) scan into O(matches); and separating network from the transaction avoids
// TransactionInactiveError while keeping each transaction short.`}
      />
    </Stack>
  );
}
