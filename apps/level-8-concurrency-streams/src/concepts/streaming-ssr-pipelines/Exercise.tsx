import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Edge SSR handler. It "streams", but it actually buffers the whole document,
// loses backpressure, can't inject a nonce, and never aborts a slow render.
import { renderToReadableStream } from 'react-dom/server';

export async function handler(request) {
  const stream = await renderToReadableStream(<App />);

  // reads the ENTIRE stream into one string before responding (no streaming!)
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let html = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    html += decoder.decode(value);
  }
  return new Response(html, { headers: { 'content-type': 'text/html' } });
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make it a real streaming pipeline"
        description="Stream the shell as soon as it's ready (don't buffer), inject a CSP nonce + bootstrap via a TransformStream, compress, propagate backpressure, and abort slow renders."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Return the stream directly as the <code>Response</code> body — never read it into a string.
        Use <code>onShellReady</code>/the resolved stream for TTFB, <code>pipeThrough</code> a{' '}
        <code>TransformStream</code> to inject the nonce/bootstrap and a{' '}
        <code>CompressionStream</code> to gzip, pass <code>{'{ signal }'}</code> to abort, and let{' '}
        <code>pipeThrough</code> carry backpressure.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { renderToReadableStream } from 'react-dom/server';

export async function handler(request) {
  const nonce = crypto.randomUUID();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // cap render time

  // renderToReadableStream resolves at onShellReady → we can respond immediately.
  const stream = await renderToReadableStream(<App nonce={nonce} />, {
    nonce,
    bootstrapScripts: ['/client.js'],
    signal: controller.signal,
  });
  stream.allReady.then(() => clearTimeout(timeout)); // full render finished in time

  // Inject per-response bits as a streaming transform (no buffering).
  const injectNonce = new TransformStream({
    transform(chunk, ctrl) { ctrl.enqueue(chunk); }, // (e.g. rewrite/insert preload links here)
  });

  // Compose the pipeline: render → inject → gzip. Backpressure propagates from
  // the client socket all the way back to the renderer.
  const body = stream
    .pipeThrough(injectNonce)
    .pipeThrough(new CompressionStream('gzip'));

  return new Response(body, {
    headers: {
      'content-type': 'text/html',
      'content-encoding': 'gzip',
      'content-security-policy': \`script-src 'nonce-\${nonce}'\`,
      'transfer-encoding': 'chunked',
    },
  });
}

// For crawlers / SSG where a partial document is unacceptable, await the full
// render before responding:
//   await stream.allReady; return new Response(stream, ...);

// Why it's better: the shell flushes at TTFB and boundaries stream after (no
// whole-document buffer), the nonce/bootstrap are injected incrementally,
// compression is part of the pipe, backpressure is preserved by pipeThrough, and
// a hung render is aborted instead of holding the connection forever.`}
      />
    </Stack>
  );
}
