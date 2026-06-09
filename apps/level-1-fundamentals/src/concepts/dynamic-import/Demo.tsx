import { useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { IconBolt, IconClockBolt } from '@tabler/icons-react';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type MathPack = typeof import('./mathPack');

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [result, setResult] = useState<string>('—');
  // Cache the PROMISE (not the module) so concurrent calls don't double-fetch.
  const loaderRef = useRef<Promise<MathPack> | null>(null);

  function loadPack(): Promise<MathPack> {
    if (loaderRef.current) {
      log("import('./mathPack') — already cached, returns the existing Promise (no refetch)", 'micro');
      return loaderRef.current;
    }
    log("import('./mathPack') — first call: fetching the chunk over the network…", 'macro');
    const t0 = performance.now();
    loaderRef.current = import('./mathPack').then((m) => {
      log(`Chunk loaded in ${Math.round(performance.now() - t0)}ms`, 'success');
      return m;
    });
    return loaderRef.current;
  }

  async function compute() {
    const pack = await loadPack();
    const fib = pack.nthFibonacci(30);
    setResult(`fib(30) = ${fib}, sample = ${pack.seedSample()}`);
    log(`Using the module: nthFibonacci(30) = ${fib}`, 'sync');
  }

  function prefetch() {
    log('Proactive prefetch (e.g. on hover / when idle)…', 'sync');
    void loadPack();
  }

  return (
    <Stack gap="md">
      <Callout kind="tip" title="Open the Network tab">
        Click "Prefetch" or "Compute" the first time → you'll see a <code>.js</code> chunk load.
        Click again → <b>no</b> new request: the module is cached by specifier.
      </Callout>

      <DemoCard
        title="import() is a Promise; modules are cached"
        right={
          <Badge variant="light" color={loaderRef.current ? 'teal' : 'gray'}>
            {loaderRef.current ? 'chunk loaded' : 'not loaded'}
          </Badge>
        }
      >
        <Stack gap="md">
          <Group>
            <Button leftSection={<IconBolt size={16} />} onClick={compute}>
              Compute (load on demand)
            </Button>
            <Button variant="light" leftSection={<IconClockBolt size={16} />} onClick={prefetch}>
              Prefetch
            </Button>
            <Button
              variant="default"
              onClick={() => {
                clear();
                setResult('—');
              }}
            >
              Clear log
            </Button>
          </Group>
          <Text size="sm">
            Result: <b>{result}</b>
          </Text>
          <LogConsole logs={logs} height={180} />
        </Stack>
      </DemoCard>
    </Stack>
  );
}
