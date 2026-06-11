import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A "yield-friendly" task runner. It's supposed to slice long work and stay
// responsive, but it (a) never yields to paint, (b) ignores priority, and
// (c) can starve later-but-urgent work.
class Runner {
  constructor() { this.queue = []; }
  add(work, priority) { this.queue.push({ work, priority }); this.run(); }
  run() {
    // drains everything synchronously in insertion order
    while (this.queue.length) {
      const { work } = this.queue.shift();   // FIFO, priority ignored
      work();                                // runs to completion, no slicing
    }
    // microtask "yield" that doesn't actually let the browser paint
    Promise.resolve().then(() => {});
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: build the scheduler's work loop properly"
        description="Make it order tasks by expiration (priority), slice on a ~5ms budget, and yield via a real macrotask so the browser can paint and handle input between slices."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Order by <code>expiration = now + timeout(priority)</code> (a heap or, for a small queue, a
        sort). Run a unit of work, check a <code>shouldYield()</code> that compares elapsed against a
        ~5ms budget (and optionally <code>isInputPending()</code>), and when it's time to yield,
        re-schedule the loop with a <code>MessageChannel</code> message — not{' '}
        <code>setTimeout(0)</code> (clamped) and not a microtask (no paint).
      </Callout>

      <SolutionReveal
        language="js"
        code={`const TIMEOUTS = { immediate: -1, userBlocking: 250, normal: 5000, low: 10000, idle: Infinity };
const FRAME = 5; // ms slice budget

class Runner {
  #queue = [];
  #scheduled = false;
  #channel = new MessageChannel();

  constructor() {
    this.#channel.port1.onmessage = () => this.#flush();
  }

  add(work, priority = 'normal') {
    // work() returns a continuation (another function) if it has more to do, else null.
    this.#queue.push({ work, expiration: performance.now() + TIMEOUTS[priority] });
    this.#queue.sort((a, b) => a.expiration - b.expiration); // soonest-expiring first
    this.#schedule();
  }

  #schedule() {
    if (this.#scheduled) return;
    this.#scheduled = true;
    this.#channel.port2.postMessage(null); // macrotask, no 4ms clamp
  }

  #shouldYield(start) {
    if (performance.now() - start >= FRAME) return true;
    return navigator.scheduling?.isInputPending?.() ?? false;
  }

  #flush() {
    this.#scheduled = false;
    const start = performance.now();
    while (this.#queue.length && !this.#shouldYield(start)) {
      const task = this.#queue[0];
      const more = task.work();        // one slice
      if (more) task.work = more;       // continuation for next slice
      else this.#queue.shift();
    }
    if (this.#queue.length) this.#schedule(); // browser paints/handles input, then we resume
  }
}

// Why it's better:
// • Tasks run by expiration → urgent work first, and old low-priority work ages
//   in (its expiration eventually beats fresh high-priority tasks) → no starvation.
// • Work is sliced and yields on a 5ms budget / pending input → responsive.
// • Yielding via MessageChannel gives the browser a real turn to paint, unlike a
//   microtask or a clamped setTimeout(0).`}
      />
    </Stack>
  );
}
