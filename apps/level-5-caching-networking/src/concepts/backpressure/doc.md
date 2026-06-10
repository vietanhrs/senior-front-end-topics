# Backpressure in the Streams API

## The problem backpressure solves

Whenever a **fast producer** feeds a **slow consumer**, data piles up in between. Without a
control mechanism, the buffer grows unboundedly → memory balloons → GC pressure → crash. Examples:
a gigabit download being parsed by slow JS; a fast WebSocket feeding a slow renderer; reading a
huge file while transforming it.

**Backpressure** is the consumer's ability to say *"slow down"* — propagated upstream so the
producer actually pauses. The WHATWG **Streams API** bakes this in.

## The mental model: desiredSize and pull

Every stream has an internal **queue** with a limit (the *high-water mark*, default ~1 chunk for
byte streams / 1 element otherwise, configurable via a **queuing strategy**):

```
producer ──enqueue──▶ [ internal queue (HWM) ] ──read──▶ consumer
                         │
                         └─ controller.desiredSize = HWM − queueLength
                            > 0  → "I want more" (pull is called)
                            ≤ 0  → "I'm full"   (a polite producer STOPS enqueuing)
```

- A **ReadableStream**'s `pull(controller)` is called when the consumer wants data — produce *on
  demand* and you get backpressure for free.
- A **WritableStream**'s `writer.write()` returns a **promise**; `writer.ready` resolves when
  there's room. **Await it** and the producer naturally throttles.
- `pipeTo` / `pipeThrough` propagate backpressure **automatically** through the whole chain —
  the slowest stage paces everyone upstream.

```ts
// Producer that respects backpressure: only produces when pulled.
const readable = new ReadableStream({
  pull(controller) {
    controller.enqueue(nextChunk());      // called only when the queue has room
  },
}, new CountQueuingStrategy({ highWaterMark: 10 }));

// Consumer side: awaiting write() throttles the loop to the sink's pace.
const writer = writable.getWriter();
for (const chunk of chunks) {
  await writer.ready;                     // ← the backpressure point
  await writer.write(chunk);
}
```

## Where it bites in the browser

- **`fetch` response bodies are ReadableStreams**: `response.body.getReader()` — if you read
  slowly, the browser slows the network receive (TCP/QUIC flow control propagates it!). If you
  instead buffer everything (`response.arrayBuffer()`), you opt out and pay full memory.
- **TransformStream** stages: a slow `transform()` automatically paces the readable side.
- **Ignoring `writer.ready` / enqueuing in a tight loop** (push-style producers using `start()`
  + `setInterval`) overflows the queue: `desiredSize` goes negative but nothing stops — *you* must
  check it.

## Push producers: respect desiredSize

For sources you can't "pull" (WebSocket, events), bridge carefully:

```ts
const readable = new ReadableStream({
  start(controller) {
    socket.onmessage = (e) => {
      controller.enqueue(e.data);
      if ((controller.desiredSize ?? 1) <= 0) {
        socket.pause?.();                  // or buffer with a cap / drop / coalesce
      }
    };
  },
  pull() { socket.resume?.(); },
});
```

If the source can't pause (DOM events), decide a **load-shedding policy**: drop, sample, or
coalesce — unbounded buffering is the only wrong answer.

## Queuing strategies

`new CountQueuingStrategy({ highWaterMark: N })` (count chunks) or
`new ByteLengthQueuingStrategy({ highWaterMark: bytes })` (count bytes — right for binary data).
HWM tunes the throughput-vs-memory trade-off: bigger absorbs bursts, smaller bounds memory.

## Senior checklist

- Backpressure = consumer-paced production; queues have a high-water mark, `desiredSize` is the signal.
- Prefer `pull()`-based producers and `pipeTo/pipeThrough` — they propagate backpressure automatically.
- Always `await writer.ready`/`write()`; for push sources check `desiredSize` and pause/shed.
- Reading a fetch body slowly throttles the actual network; buffering APIs opt out of all of this.

## References

- [MDN: Streams API concepts — backpressure](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts#backpressure)
- [WHATWG Streams spec](https://streams.spec.whatwg.org/)
- [web.dev: Streams — the definitive guide](https://web.dev/articles/streams)
- [MDN: ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
