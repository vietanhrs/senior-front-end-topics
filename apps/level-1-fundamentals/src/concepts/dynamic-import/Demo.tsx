import { useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { IconBolt, IconClockBolt } from '@tabler/icons-react';
import { Callout, DemoCard, LogConsole, useLogger } from '../../workbook/ui';

type MathPack = typeof import('./mathPack');

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [result, setResult] = useState<string>('—');
  // Cache the PROMISE (not the module) so concurrent calls don't double-fetch.
  const loaderRef = useRef<Promise<MathPack> | null>(null);

  function loadPack(): Promise<MathPack> {
    if (loaderRef.current) {
      log('import(\'./mathPack\') — đã có trong cache, trả về Promise cũ (không tải lại)', 'micro');
      return loaderRef.current;
    }
    log('import(\'./mathPack\') — lần đầu: tải chunk qua mạng…', 'macro');
    const t0 = performance.now();
    loaderRef.current = import('./mathPack').then((m) => {
      log(`Chunk tải xong sau ${Math.round(performance.now() - t0)}ms`, 'success');
      return m;
    });
    return loaderRef.current;
  }

  async function compute() {
    const pack = await loadPack();
    const fib = pack.nthFibonacci(30);
    setResult(`fib(30) = ${fib}, sample = ${pack.seedSample()}`);
    log(`Dùng module: nthFibonacci(30) = ${fib}`, 'sync');
  }

  function prefetch() {
    log('Prefetch chủ động (vd khi hover / lúc nhàn rỗi)…', 'sync');
    void loadPack();
  }

  return (
    <Stack gap="md">
      <Callout kind="tip" title="Mở Network tab">
        Bấm "Prefetch" hoặc "Tính toán" lần đầu → thấy một chunk <code>.js</code> tải về. Bấm
        các lần sau → <b>không</b> có request mới: module đã được cache theo specifier.
      </Callout>

      <DemoCard
        title="import() là Promise, module được cache"
        right={
          <Badge variant="light" color={loaderRef.current ? 'teal' : 'gray'}>
            {loaderRef.current ? 'chunk đã nạp' : 'chưa nạp'}
          </Badge>
        }
      >
        <Stack gap="md">
          <Group>
            <Button leftSection={<IconBolt size={16} />} onClick={compute}>
              Tính toán (tải khi cần)
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
            Kết quả: <b>{result}</b>
          </Text>
          <LogConsole logs={logs} height={180} />
        </Stack>
      </DemoCard>
    </Stack>
  );
}
