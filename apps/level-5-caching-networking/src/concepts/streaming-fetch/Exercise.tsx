import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// An NDJSON event feed (one JSON object per line). Three streaming bugs:
//  (1) buffers the ENTIRE body before showing anything (await res.text()),
//  (2) when rewritten naively with chunks, decodes each chunk WITHOUT
//      { stream: true } → multi-byte characters split across chunks corrupt,
//  (3) parses each CHUNK as JSON — but a chunk can contain half a line or
//      three lines; chunk boundaries are arbitrary.
async function readFeed(url, onEvent) {
  const res = await fetch(url);
  const text = await res.text();           // (1) nothing shown until the end
  for (const line of text.split('\\n')) {
    if (line) onEvent(JSON.parse(line));
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stream the NDJSON feed correctly"
        description="Process events as they arrive: read response.body chunk-by-chunk, decode statefully, buffer to newline boundaries, parse only complete lines, flush the tail, and support cancellation."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Keep a string buffer; append each decoded chunk (<code>{'{ stream: true }'}</code>); split
        on <code>\n</code> and <code>pop()</code> the last (possibly incomplete) piece back into the
        buffer; after the loop, <code>decoder.decode()</code> + parse any remainder.
      </Callout>

      <SolutionReveal
        language="js"
        code={`async function readFeed(url, onEvent, { signal } = {}) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('HTTP ' + res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();      // ONE stateful decoder for the whole body
  let buf = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });  // (2) stateful decode
    const lines = buf.split('\\n');
    buf = lines.pop();                    // (3) keep the trailing incomplete line
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line));    // only COMPLETE frames
    }
  }

  buf += decoder.decode();                // flush any buffered partial character
  if (buf.trim()) onEvent(JSON.parse(buf));          // final line without trailing \\n
}

// Composable alternative with TransformStreams (backpressure included):
async function readFeed2(url, onEvent, { signal } = {}) {
  const res = await fetch(url, { signal });
  const lineStream = res.body
    .pipeThrough(new TextDecoderStream())            // bytes → text, stateful
    .pipeThrough(new TransformStream({               // text → lines
      transform(chunk, controller) {
        this.buf = (this.buf ?? '') + chunk;
        const lines = this.buf.split('\\n');
        this.buf = lines.pop();
        for (const l of lines) if (l.trim()) controller.enqueue(l);
      },
      flush(controller) {
        if (this.buf?.trim()) controller.enqueue(this.buf);
      },
    }));
  for await (const line of lineStream) onEvent(JSON.parse(line));
}`}
      />
    </Stack>
  );
}
