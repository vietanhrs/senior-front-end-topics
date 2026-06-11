// A faithful-but-tiny cooperative scheduler modeled on React's: tasks ordered by
// expiration in a min-heap, a ~5ms time slice, and yielding via MessageChannel
// (NOT setTimeout — no 4ms clamp; NOT microtasks — the browser must get to paint).

export type Priority = 'user-blocking' | 'normal' | 'low';

// Scaled down from React's real values (250/5000/10000ms) so aging is observable
// within a short demo run.
export const TIMEOUTS: Record<Priority, number> = {
  'user-blocking': 50,
  normal: 300,
  low: 600,
};

export interface SchedTask {
  id: string;
  priority: Priority;
  slices: number; // units of work remaining
  expiration: number;
}

const FRAME_BUDGET_MS = 5;

export class MiniScheduler {
  private heap: SchedTask[] = [];
  private port: MessagePort;
  private scheduled = false;

  constructor(
    private onSlice: (task: SchedTask) => void,
    private onYield?: (queued: number) => void,
  ) {
    const mc = new MessageChannel();
    this.port = mc.port2;
    mc.port1.onmessage = () => this.flush();
  }

  post(id: string, priority: Priority, slices: number) {
    const task: SchedTask = {
      id,
      priority,
      slices,
      expiration: performance.now() + TIMEOUTS[priority],
    };
    this.push(task);
    this.ensureScheduled();
  }

  private ensureScheduled() {
    if (!this.scheduled) {
      this.scheduled = true;
      this.port.postMessage(null); // macrotask, runs right after the current one
    }
  }

  private flush() {
    this.scheduled = false;
    const sliceStart = performance.now();
    while (this.heap.length > 0) {
      const task = this.heap[0];
      this.onSlice(task);
      task.slices -= 1;
      if (task.slices <= 0) this.pop();
      // shouldYield(): bail once we've spent the frame budget or input is pending.
      const inputPending =
        (navigator as Navigator & { scheduling?: { isInputPending?: () => boolean } }).scheduling
          ?.isInputPending?.() ?? false;
      if (performance.now() - sliceStart >= FRAME_BUDGET_MS || inputPending) break;
    }
    if (this.heap.length > 0) {
      this.onYield?.(this.heap.length);
      this.ensureScheduled(); // continue next macrotask — the browser gets a turn now
    }
  }

  // --- binary min-heap keyed by expiration ---
  private push(task: SchedTask) {
    const h = this.heap;
    h.push(task);
    let i = h.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (h[parent].expiration <= h[i].expiration) break;
      [h[parent], h[i]] = [h[i], h[parent]];
      i = parent;
    }
  }

  private pop() {
    const h = this.heap;
    const last = h.pop()!;
    if (h.length === 0) return;
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < h.length && h[l].expiration < h[smallest].expiration) smallest = l;
      if (r < h.length && h[r].expiration < h[smallest].expiration) smallest = r;
      if (smallest === i) break;
      [h[smallest], h[i]] = [h[i], h[smallest]];
      i = smallest;
    }
  }
}
