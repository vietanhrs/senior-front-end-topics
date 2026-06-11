# Backpressure handling

## The problem

**Backpressure** is the feedback a slow consumer needs to push back on a fast producer. When data is
produced faster than it can be consumed, something has to give:

- **Buffer it** → the queue grows without bound → memory blows up (and latency climbs).
- **Drop it** → data loss (sometimes acceptable: e.g. drop intermediate mouse-move events).
- **Slow the producer** → the *correct* default: signal "not ready, hold on."

Backpressure is the mechanism for that third option — a way for the consumer to say *"don't give me
more yet."* Without it you get the classic failure modes: an unbounded array of pending work, an
event emitter whose listeners can't keep up, a WebSocket firehose that ooms the tab.

## How the Streams API builds it in

WHATWG Streams have backpressure as a first-class concept via the **internal queue**, a
**queuing strategy** (`highWaterMark`), and **`desiredSize`**:

```js
const stream = new ReadableStream(
  {
    pull(controller) {
      // called ONLY when the consumer needs more (queue below the high-water mark).
      controller.enqueue(produceOne());
    },
  },
  new CountQueuingStrategy({ highWaterMark: 4 }), // keep ~4 items buffered
);
```

- **Pull-based sources** (`pull`) are the natural backpressure model: the stream calls `pull` to
  *top up* the queue only while `controller.desiredSize > 0`. A slow reader → fewer reads → fewer
  `pull` calls → the producer is automatically throttled to the consumer's rate.
- **`controller.desiredSize`** = `highWaterMark − currentQueueSize`. Positive means "send more"; zero
  or negative means "back off." A **push** source should check it and pause when it goes ≤ 0.
- **Writable side:** `writer.write(chunk)` returns a **promise that resolves when there's room**.
  `await`ing it *is* applying backpressure; `writer.desiredSize` tells you how much headroom is left.
- **`pipeTo` / `pipeThrough`** propagate backpressure end-to-end automatically — the reason to prefer
  piping over manual read/write loops.

```js
await fetch(url).then((r) => r.body.pipeTo(writable)); // backpressure handled for you
```

## Beyond Streams

The same principle shows up everywhere concurrency does:

- **Bounded queues / semaphores** in your own producer-consumer code (cap in-flight work).
- **`for await...of`** over an async iterator naturally pulls one item at a time.
- **Debounce / throttle / `requestAnimationFrame` coalescing** = lossy backpressure for UI events.
- **TCP flow control & HTTP/2 flow-control windows** are backpressure at the transport layer.

> **Watch out — not every "source" can be paused.** A backpressure signal only works if the producer
> can actually act on it. A raw browser **`WebSocket` has no `pause()`/`resume()`**: `onmessage` fires
> for every frame regardless, so wrapping it in a `ReadableStream` does **not** create backpressure
> (`enqueue` keeps running past `desiredSize ≤ 0`). Use **`WebSocketStream`** (whose `readable` read
> rate governs flow → real transport backpressure) or **application-level** flow control (bounded
> buffer + drop/coalesce, a server slow-down/credit protocol, or close+reconnect). `fetch`'s
> `response.body` and your own `pull()` sources *do* honor backpressure — a bare `WebSocket` doesn't.

## Senior checklist

- Backpressure = consumer-to-producer "slow down" signal; the alternative is unbounded buffering or
  data loss.
- Prefer **pull-based** sources: the consumer's read rate throttles the producer for free.
- Watch **`desiredSize`** (read & writable) and **`await` `writer.write()`**; pause push sources when
  `desiredSize ≤ 0`.
- Use **`pipeTo`/`pipeThrough`** so backpressure propagates through the whole pipeline; use bounded
  queues in hand-rolled producer/consumer code.

## References

- [MDN: Streams — backpressure / Concepts](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts#backpressure)
- [Streams Standard: queuing strategies & desiredSize](https://streams.spec.whatwg.org/)
- [web.dev: Streams — the definitive guide](https://web.dev/articles/streams)
- [MDN: ReadableStreamDefaultController.desiredSize](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultController/desiredSize)
