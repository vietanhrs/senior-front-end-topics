import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A single-slot async lock guards a shared resource. Low-priority background
// sync holds it across awaits; an urgent user action then inverts behind it.
class AsyncLock {
  constructor() { this.p = Promise.resolve(); }
  run(fn) {                       // FIFO, no priorities at all
    const result = this.p.then(fn);
    this.p = result.catch(() => {});
    return result;
  }
}

const lock = new AsyncLock();

// background, low priority — holds the lock across slow awaits
function backgroundSync() {
  return lock.run(async () => {
    for (const chunk of bigDataset) {
      await persist(chunk);       // yields; lock stays held the whole loop
    }
  });
}

// urgent — user clicked "save now"
function saveNow(doc) {
  return lock.run(() => persist(doc)); // queued BEHIND the whole background sync
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stop the urgent save from inverting behind background sync"
        description="The lock is plain FIFO, so an urgent saveNow() waits for the entire low-priority backgroundSync() to release. Give the lock priorities, and make sure a high-priority waiter doesn't sit behind low-priority work — and that the holder can't be starved while a high waiter is pending."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Two ideas combine: (1) a <b>priority queue</b> for lock acquisition so the urgent waiter is
        served before queued low-priority work; (2) <b>priority inheritance</b> / not holding the
        lock across long awaits — chunk the background work so it releases between items and re-checks
        whether a higher-priority waiter is pending. Cancellation (<code>AbortController</code>) is the
        pragmatic escape hatch.
      </Callout>

      <SolutionReveal
        language="js"
        code={`class PriorityLock {
  #held = false;
  #waiters = [];                          // { priority, resolve }

  acquire(priority = 0) {
    return new Promise((resolve) => {
      this.#waiters.push({ priority, resolve });
      this.#waiters.sort((a, b) => b.priority - a.priority); // high priority first
      this.#dispatch();
    });
  }
  release() { this.#held = false; this.#dispatch(); }
  get hasHigherWaiter() {                  // for inheritance / cooperative yield
    return this.#waiters.length > 0;
  }
  #dispatch() {
    if (this.#held || this.#waiters.length === 0) return;
    this.#held = true;
    this.#waiters.shift().resolve();
  }
}

const lock = new PriorityLock();

// Background sync: LOW priority, and it does NOT hold the lock across the whole
// loop. It re-acquires per chunk and yields the lock whenever a higher-priority
// waiter is pending (cooperative priority inheritance).
async function backgroundSync() {
  for (const chunk of bigDataset) {
    await lock.acquire(0);
    try { await persist(chunk); }
    finally { lock.release(); }
    if (lock.hasHigherWaiter) await scheduler.yield(); // let urgent work jump in
  }
}

// Urgent save: HIGH priority → served before any queued background chunk.
async function saveNow(doc) {
  await lock.acquire(10);
  try { await persist(doc); }
  finally { lock.release(); }
}

// Why it's better:
// • The acquire queue is priority-ordered, so the urgent waiter is next in line.
// • Background work releases between chunks instead of holding across all awaits,
//   so the critical section is short and an urgent waiter never inverts behind it.
// • hasHigherWaiter lets low work voluntarily step aside — the cooperative
//   analogue of priority inheritance.`}
      />
    </Stack>
  );
}
