import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// "Saves" a note. It only works online, loses the write if offline, blocks the
// UI on the request, and double-creates on retry.
async function saveNote(text) {
  // straight to the network — throws and loses the note when offline
  const res = await fetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ text }),   // no client id → server makes a new row each retry
  });
  const note = await res.json();
  renderNote(note);                   // UI only updates after the round-trip
  return note;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make saving offline-first"
        description="This write is network-only: it throws offline (losing the note), updates the UI only after the server responds, and duplicates on retry. Save locally first, update optimistically, queue for replay, and make replay idempotent."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Generate a <b>client id</b> (idempotency key). Write to the <b>local store</b> and update the
        UI <b>optimistically</b> first. Try to sync; if it fails (offline), enqueue in a durable{' '}
        <b>outbox</b> and register <b>Background Sync</b> so the Service Worker replays it later. The
        server upserts by client id so replays don't duplicate.
      </Callout>

      <SolutionReveal
        language="js"
        code={`async function saveNote(text) {
  const note = { id: crypto.randomUUID(), text, syncedAt: null }; // (idempotency key = id)

  // 1) local-first: persist + render immediately (works offline, feels instant)
  await db.put('notes', note);
  renderNote(note);                        // optimistic UI

  // 2) try to sync now; if it fails, queue for later replay
  try {
    await pushToServer(note);
    await db.put('notes', { ...note, syncedAt: Date.now() });
  } catch {
    await db.add('outbox', { type: 'saveNote', payload: note }); // durable queue
    if ('sync' in (await navigator.serviceWorker?.ready ?? {})) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('flush-outbox');   // SW flushes even if the tab closes
    }
  }
  return note;
}

// idempotent server call: upsert by client id → replaying twice is harmless
function pushToServer(note) {
  return fetch('/api/notes', {
    method: 'PUT',                            // upsert, not POST-create
    headers: { 'Idempotency-Key': note.id },
    body: JSON.stringify(note),
  }).then((r) => { if (!r.ok) throw new Error('sync failed'); });
}

// drain the outbox on reconnect (and in the SW 'sync' event)
async function flushOutbox() {
  for (const item of await db.getAll('outbox')) {
    try {
      await pushToServer(item.payload);
      await db.delete('outbox', item.id);
      await db.put('notes', { ...item.payload, syncedAt: Date.now() });
    } catch { /* leave it queued; retry next sync */ }
  }
}
addEventListener('online', flushOutbox);

// Why it's better: the note is saved locally and shown instantly regardless of
// connectivity; offline writes are queued and replayed on reconnect (or by the SW
// via Background Sync after the tab closes); and the idempotency key + upsert mean
// retries/duplicate replays never create duplicate rows.`}
      />
    </Stack>
  );
}
