import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const STORY =
  'Streaming responses turn waiting into watching. The browser hands you bytes as they arrive, ' +
  'so the first words can render while the last ones are still being generated on the server. ' +
  'This is exactly how chat UIs, log tails, and progressive search results feel instant: ' +
  'time-to-first-chunk replaces time-to-last-byte, memory stays flat, and an AbortSignal can ' +
  'stop the firehose the moment the user navigates away.';

const TOKENS = STORY.split(/(?<=\s)/); // keep spaces
const TOKEN_MS = 60;
const TOTAL_MS = TOKENS.length * TOKEN_MS;

/** Build a ReadableStream that emits the story token-by-token, like a slow server. */
function makeBodyStream(signal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => {
          if (signal.aborted) {
            controller.error(new DOMException('Aborted', 'AbortError'));
            reject(signal.reason);
            return;
          }
          if (i >= TOKENS.length) controller.close();
          else controller.enqueue(encoder.encode(TOKENS[i++]));
          resolve();
        }, TOKEN_MS);
        signal.addEventListener('abort', () => clearTimeout(t), { once: true });
      });
    },
  });
}

export function Demo() {
  const [mode, setMode] = useState<'buffered' | 'streaming'>('buffered');
  const [output, setOutput] = useState('');
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'aborted'>('idle');
  const [firstByteMs, setFirstByteMs] = useState<number | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => () => ctrlRef.current?.abort(), []);

  async function run() {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setOutput('');
    setFirstByteMs(null);
    setState('running');
    const t0 = performance.now();
    const body = makeBodyStream(ctrl.signal);

    try {
      if (mode === 'buffered') {
        // Equivalent of await res.text(): wait for the WHOLE body first.
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let all = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          all += decoder.decode(value, { stream: true });
        }
        all += decoder.decode();
        setFirstByteMs(Math.round(performance.now() - t0)); // first CONTENT shown = end
        setOutput(all);
      } else {
        // Streaming: render every chunk the moment it arrives.
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let first = true;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (first) {
            setFirstByteMs(Math.round(performance.now() - t0));
            first = false;
          }
          const text = decoder.decode(value, { stream: true });
          setOutput((o) => o + text);
        }
      }
      setState('done');
    } catch {
      setState('aborted');
    }
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Same response time, very different first content">
        The simulated server emits a token every {TOKEN_MS}ms (~{(TOTAL_MS / 1000).toFixed(1)}s
        total). <b>Buffered</b> (like <code>res.text()</code>): blank until the end, then everything
        at once. <b>Streaming</b> (<code>getReader()</code> + <code>TextDecoder</code>): words appear
        as they arrive — note the "first content" timing badge.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Buffered (await res.text())', value: 'buffered' },
          { label: 'Streaming (read chunks)', value: 'streaming' },
        ]}
      />

      <DemoCard
        title="Token stream"
        right={
          <Group gap="xs">
            {firstByteMs != null && (
              <Badge color={firstByteMs < 500 ? 'teal' : 'orange'} variant="filled">
                first content @ {firstByteMs}ms
              </Badge>
            )}
            <Button size="xs" onClick={run} disabled={state === 'running'}>
              Fetch
            </Button>
            <Button size="xs" color="red" variant="light" onClick={() => ctrlRef.current?.abort()} disabled={state !== 'running'}>
              Abort
            </Button>
          </Group>
        }
      >
        <Paper withBorder radius="md" p="md" mih={120}>
          {output ? (
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {output}
              {state === 'running' && <Text span c="indigo">▍</Text>}
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              {state === 'running' ? 'waiting for the full body…' : 'click Fetch'}
            </Text>
          )}
        </Paper>
        <Text size="xs" c="dimmed" mt="xs">
          Streaming also lets Abort stop mid-body — try aborting halfway in each mode.
        </Text>
      </DemoCard>
    </Stack>
  );
}
