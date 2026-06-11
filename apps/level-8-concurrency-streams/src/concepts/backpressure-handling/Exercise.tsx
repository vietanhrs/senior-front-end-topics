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
        description="Messages arrive faster than process() handles them, and queue grows without limit. The catch: a raw browser WebSocket has NO transport backpressure — there is no socket.pause(). So you must either use WebSocketStream or push back at the application level."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="warning" title="Gotcha: you can't pause a browser WebSocket">
        Browser <code>WebSocket</code> has no <code>pause()</code>/<code>resume()</code> (that's a
        Node stream API). <code>onmessage</code> fires for every frame as fast as they arrive, so
        wrapping it in a <code>ReadableStream</code> does <b>not</b> create backpressure —{' '}
        <code>enqueue</code> keeps running past <code>desiredSize ≤ 0</code> and the internal queue
        still grows unbounded.
      </Callout>

      <Callout kind="tip" title="Hint">
        Real options: (1) <code>WebSocketStream</code> (Chromium) exposes a <code>readable</code> whose
        read rate governs flow — <code>pipeTo</code> a slow sink and backpressure reaches TCP; (2) for
        a plain <code>WebSocket</code>, do <b>application-level</b> flow control — a bounded buffer that{' '}
        <b>drops/coalesces</b> when full (lossy), or sends the server a "slow down"/credit message, or{' '}
        <code>close()</code> + reconnect as a last resort.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// A raw browser WebSocket has NO transport backpressure: onmessage fires for
// every frame as fast as the server sends, and there is no socket.pause(). So
// wrapping it in a ReadableStream does NOT help — enqueue runs past desiredSize<=0
// and the queue grows unbounded. Two correct approaches:

// 1) PREFERRED (Chromium): WebSocketStream gives a real readable stream whose
//    read rate governs flow — a slow sink makes the connection apply flow control
//    to the server (genuine transport backpressure).
async function pipeWebSocketStream(url, process, { signal } = {}) {
  const wss = new WebSocketStream(url, { signal });
  const { readable } = await wss.opened;          // ReadableStream of messages
  await readable.pipeTo(
    new WritableStream(
      { write(chunk) { return process(chunk); } }, // returning the promise = backpressure
      new CountQueuingStrategy({ highWaterMark: 16 }),
    ),
    { signal },
  );
  // When the sink is slow, the stream stops reading → TCP backpressure to the server.
}

// 2) PLAIN WebSocket fallback: you cannot stop onmessage, so make backpressure
//    EXPLICIT at the application level. Bound the buffer and pick a policy when full.
function pipeAppFlowControl(socket, process, { limit = 1000 } = {}) {
  const queue = [];
  let draining = false;
  let dropped = 0;
  let asked = false; // have we asked the server to slow down?

  socket.onmessage = (e) => {
    if (queue.length >= limit) {
      // Option A — lossy: drop, or COALESCE (keep only the latest snapshot).
      dropped++;
      // queue[queue.length - 1] = e.data;   // coalesce instead of dropping
      // Option B — app-level flow control: tell the SERVER to back off.
      if (!asked) { asked = true; socket.send(JSON.stringify({ type: 'slow-down' })); }
      // Option C — last resort: close + reconnect with a resume cursor.
      // socket.close(1013 /* try again later */);
      return;
    }
    queue.push(e.data);
    drain();
  };

  async function drain() {
    if (draining) return;
    draining = true;
    while (queue.length) {
      await process(queue.shift());
      if (asked && queue.length < limit / 2) {     // hysteresis: resume when drained
        asked = false;
        socket.send(JSON.stringify({ type: 'resume' }));
      }
    }
    draining = false;
  }
}

// Why this is correct: the raw WebSocket can't be paused, so the only ways to
// bound memory are real transport backpressure via WebSocketStream, or explicit
// application-level control — drop/coalesce (lossy), a server slow-down protocol,
// or close+reconnect. (The Streams API DOES give automatic backpressure when the
// source genuinely supports it — e.g. fetch's response.body, a WebSocketStream,
// or your own pull()-based source — just not a bare WebSocket.)`}
      />
    </Stack>
  );
}
