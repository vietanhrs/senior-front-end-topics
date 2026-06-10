import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Uploads a large file through a compression TransformStream. On big files
// the tab's memory explodes and it eventually crashes. Two bugs:
//  (1) the producer enqueues ALL chunks in start() without ever checking room,
//  (2) the consumer calls write() without awaiting ready/write — fire & forget.
function uploadCompressed(file, compressor, sink) {
  const readable = new ReadableStream({
    start(controller) {
      for (const chunk of sliceFile(file, 64 * 1024)) {
        controller.enqueue(chunk);          // (1) queue grows unboundedly
      }
      controller.close();
    },
  });

  const writer = sink.getWriter();
  readable.pipeThrough(compressor).getReader().read().then(function pump({ done, value }) {
    if (done) return writer.close();
    writer.write(value);                     // (2) never awaited → sink overwhelmed
    return this.read().then(pump);
  });
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the upload pipeline respect backpressure"
        description="Rewrite so memory stays bounded for arbitrarily large files: a pull-based producer, awaited writes — or better, one pipeTo chain that propagates backpressure end-to-end."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Move production into <code>pull()</code> (one chunk per call) so the stream only asks when
        there's room. Then let <code>pipeThrough(compressor).pipeTo(sink)</code> do all the pacing —
        no manual pump loop, no unawaited writes.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function uploadCompressed(file, compressor, sink) {
  const chunks = sliceFile(file, 64 * 1024); // an iterator, not an array in memory
  const it = chunks[Symbol.iterator]();

  const readable = new ReadableStream(
    {
      // (1) PULL-based: called only when the internal queue has room.
      pull(controller) {
        const { value, done } = it.next();
        if (done) controller.close();
        else controller.enqueue(value);
      },
    },
    new ByteLengthQueuingStrategy({ highWaterMark: 256 * 1024 }), // bound by BYTES
  );

  // (2) One pipe chain: backpressure propagates from the slowest stage (network
  //     sink) back through the compressor to the file reader automatically.
  return readable.pipeThrough(compressor).pipeTo(sink);
}

// If you must hand-write the consumer instead of pipeTo:
async function manualConsume(readable, sink) {
  const reader = readable.getReader();
  const writer = sink.getWriter();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    await writer.ready;        // wait until the sink has room
    await writer.write(value); // and until this chunk is accepted
  }
  await writer.close();
}

// Result: memory is bounded by the queuing strategies' high-water marks
// (~hundreds of KB), regardless of file size.`}
      />
    </Stack>
  );
}
