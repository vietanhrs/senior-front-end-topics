import { useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type Region = 'pending' | 'ready';

interface ChunkInfo {
  label: string;
  bytes: number;
  injected: boolean;
  at: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [shell, setShell] = useState<Region>('pending');
  const [main, setMain] = useState<Region>('pending');
  const [sidebar, setSidebar] = useState<Region>('pending');
  const [ttfb, setTtfb] = useState<number | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const runningRef = useRef(false);

  const run = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    clear();
    setChunks([]);
    setShell('pending');
    setMain('pending');
    setSidebar('pending');
    setTtfb(null);
    setDone(null);
    const t0 = performance.now();

    // Stage 1: the renderer as a ReadableStream of HTML chunks (shell first, then
    // each Suspense boundary out of order as its data resolves).
    const source = new ReadableStream<string>({
      async start(controller) {
        controller.enqueue('<header>shell</header><main><!--$?--><template id="B:main"></template>');
        log('render: shell flushed (onShellReady) → TTFB', 'macro');
        await delay(350);
        controller.enqueue('<div id="S:main">main content</div>'); // boundary 1 resolves
        log('render: <Suspense main> resolved → streaming its HTML', 'sync');
        await delay(450);
        controller.enqueue('<aside id="S:sidebar">sidebar content</aside>'); // boundary 2 (later)
        log('render: <Suspense sidebar> resolved → streaming its HTML', 'sync');
        controller.close();
      },
    });

    // Stage 2: a TransformStream that injects the hydration <script> after each
    // boundary chunk — exactly how React slots out-of-order HTML into place.
    const inject = new TransformStream<string, string>({
      transform(chunk, controller) {
        if (chunk.includes('S:main')) {
          controller.enqueue(chunk + '<script>$RC("B:main","S:main")</script>');
        } else if (chunk.includes('S:sidebar')) {
          controller.enqueue(chunk + '<script>$RC("B:sidebar","S:sidebar")</script>');
        } else {
          controller.enqueue(chunk);
        }
      },
    });

    // Stage 3: real byte encoding, composed into the same pipe.
    const piped = source.pipeThrough(inject).pipeThrough(new TextEncoderStream());

    // Stage 4: the "client" reads bytes as they arrive and reveals regions.
    const reader = piped.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done: rdone } = await reader.read();
      if (rdone) break;
      const text = decoder.decode(value, { stream: true });
      const at = Math.round(performance.now() - t0);
      const injected = text.includes('$RC');
      const label = text.includes('shell')
        ? 'shell'
        : text.includes('S:main')
          ? 'main + hydrate'
          : 'sidebar + hydrate';
      setChunks((c) => [...c, { label, bytes: value.byteLength, injected, at }]);

      if (text.includes('shell')) {
        setShell('ready');
        setTtfb(at);
      }
      if (text.includes('S:main')) setMain('ready');
      if (text.includes('S:sidebar')) setSidebar('ready');
      log(`client: received ${value.byteLength}B chunk "${label}" at +${at}ms`, 'micro');
    }
    const total = Math.round(performance.now() - t0);
    setDone(total);
    log(`stream closed at +${total}ms — boundaries arrived out of order, each slotted by its inline script`, 'success');
    runningRef.current = false;
  };

  const RegionBox = ({ name, state }: { name: string; state: Region }) => (
    <div
      className="rounded-md border p-3"
      style={{ flex: 1, opacity: state === 'ready' ? 1 : 0.55 }}
    >
      <Group justify="space-between">
        <Text size="sm" fw={600}>{name}</Text>
        <Badge size="xs" color={state === 'ready' ? 'teal' : 'gray'} variant="light">
          {state === 'ready' ? 'streamed' : 'fallback'}
        </Badge>
      </Group>
    </div>
  );

  return (
    <Stack gap="md">
      <Callout kind="info" title="A real Web Streams SSR pipeline, in the browser">
        Run it: a <code>ReadableStream</code> of HTML chunks (shell → boundaries, out of order) is{' '}
        <code>pipeThrough</code> a <code>TransformStream</code> that injects each hydration{' '}
        <code>&lt;script&gt;</code>, then a real <code>TextEncoderStream</code>, and the "client"
        reads the bytes as they arrive — revealing each region when its chunk lands.
      </Callout>

      <Group>
        <Button onClick={run}>Stream the page</Button>
        {ttfb !== null && <Badge variant="light" color="orange">TTFB +{ttfb}ms</Badge>}
        {done !== null && <Badge variant="light" color="teal">complete +{done}ms</Badge>}
      </Group>

      <DemoCard title="Client document (regions reveal as chunks stream in)">
        <Stack gap="xs">
          <RegionBox name="Shell (header + layout)" state={shell} />
          <Group grow>
            <RegionBox name="<Suspense> main" state={main} />
            <RegionBox name="<Suspense> sidebar" state={sidebar} />
          </Group>
        </Stack>
      </DemoCard>

      <DemoCard title="Pipeline output (chunks after transform + encode)">
        {chunks.length === 0 ? (
          <Text size="sm" c="dimmed">Run to see encoded chunks arrive.</Text>
        ) : (
          <Stack gap={4}>
            {chunks.map((c, i) => (
              <Group key={i} gap="xs">
                <Badge size="sm" variant="light" color="indigo" style={{ width: 130 }}>{c.label}</Badge>
                <Badge size="sm" variant="outline">{c.bytes} B</Badge>
                {c.injected && <Badge size="sm" color="grape" variant="light">+hydrate script</Badge>}
                <Text size="xs" c="dimmed">+{c.at}ms</Text>
              </Group>
            ))}
          </Stack>
        )}
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Run to watch chunks flow through the pipeline." />
    </Stack>
  );
}
