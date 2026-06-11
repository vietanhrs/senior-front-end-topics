import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Pipes incoming WebSocket messages into an async processor. Under load the tab
// memory climbs forever: the producer never waits for the slow consumer.
function pipe(socket, process) {
  const queue = [];
  let draining = false;

  socket.onmessage = (e) => {
    queue.push(e.data);        // unbounded buffer — no backpressure to the socket
    drain();
  };

  async function drain() {
    if (draining) return;
    draining = true;
    while (queue.length) {
      await process(queue.shift());  // slow; meanwhile onmessage keeps pushing
    }
    draining = false;
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: apply backpressure to the firehose"
        description="Messages arrive faster than process() handles them, and queue grows without limit. Bound the buffer and push back on the producer — and prefer the Streams API so backpressure propagates for free."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Two routes: (1) wrap the source in a <code>ReadableStream</code> with a{' '}
        <code>highWaterMark</code> and <code>pipeTo</code> a <code>WritableStream</code> that does the
        work — backpressure is automatic and you <code>await writer.write()</code>; or (2) keep the
        manual queue but make it <b>bounded</b> — pause the socket (or drop, with a counter) when it's
        full, resume when it drains.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// Preferred: let the Streams API handle backpressure end-to-end.
function pipe(socket, process) {
  const stream = new ReadableStream(
    {
      start(controller) {
        socket.onmessage = (e) => {
          controller.enqueue(e.data);
          // Push source: respect demand. When the queue is full, pause the socket.
          if ((controller.desiredSize ?? 0) <= 0) socket.pause?.();
        };
      },
      pull() { socket.resume?.(); },     // consumer wants more → let it flow again
      cancel() { socket.close(); },
    },
    new CountQueuingStrategy({ highWaterMark: 16 }),
  );

  const sink = new WritableStream(
    { write(chunk) { return process(chunk); } }, // returning the promise IS backpressure
    new CountQueuingStrategy({ highWaterMark: 1 }),
  );

  return stream.pipeTo(sink); // desiredSize/await propagate through the whole pipe
}

// Manual fallback when you can't use Streams: a BOUNDED queue.
function pipeBounded(socket, process, limit = 1000) {
  const queue = [];
  let dropped = 0;
  let draining = false;
  socket.onmessage = (e) => {
    if (queue.length >= limit) {
      socket.pause?.();              // or: dropped++ for lossy backpressure
      if (!socket.pause) { dropped++; return; }
    }
    queue.push(e.data);
    drain();
  };
  async function drain() {
    if (draining) return;
    draining = true;
    while (queue.length) {
      await process(queue.shift());
      if (queue.length < limit / 2) socket.resume?.(); // hysteresis: resume when drained
    }
    draining = false;
  }
}

// Why it's better: the buffer is bounded, so memory is bounded. The producer is
// paused (or sheds load deliberately) instead of buffering infinitely, and the
// Streams version propagates that signal through every stage automatically.`}
      />
    </Stack>
  );
}
