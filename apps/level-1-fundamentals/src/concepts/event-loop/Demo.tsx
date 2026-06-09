import { Button, Group, Stack } from '@mantine/core';
import { IconPlayerPlay, IconRefresh } from '@tabler/icons-react';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

export function Demo() {
  const { logs, log, clear } = useLogger();

  function runClassic() {
    clear();
    log("console.log('script start')", 'sync');

    setTimeout(() => log('setTimeout(0) callback', 'macro'), 0);

    Promise.resolve().then(() => log('Promise.then #1', 'micro'));

    queueMicrotask(() => {
      log('queueMicrotask', 'micro');
      // a microtask scheduling a microtask: still drained this round, before any macrotask
      queueMicrotask(() => log('queueMicrotask (nested)', 'micro'));
    });

    Promise.resolve().then(() => log('Promise.then #2', 'micro'));

    log("console.log('script end')", 'sync');
  }

  function runAwait() {
    clear();
    const inner = async () => {
      log('A: before await (sync, runs immediately on call)', 'sync');
      await Promise.resolve();
      log('C: after await (microtask)', 'micro');
      log('D: continues in the same microtask', 'micro');
    };
    void inner();
    log('B: right after the async call (sync)', 'sync');
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="How to read this">
        The number on the left is the <b>actual execution order</b>. The badge tells you which
        kind of task it is. Predict before you click.
      </Callout>

      <DemoCard
        title="Execution-order experiments"
        right={
          <Group gap="xs">
            <Button size="xs" leftSection={<IconPlayerPlay size={14} />} onClick={runClassic}>
              Classic example
            </Button>
            <Button size="xs" color="grape" leftSection={<IconPlayerPlay size={14} />} onClick={runAwait}>
              await = microtask
            </Button>
            <Button size="xs" variant="default" leftSection={<IconRefresh size={14} />} onClick={clear}>
              Clear
            </Button>
          </Group>
        }
      >
        <Stack gap="sm">
          <div className="text-sm text-[var(--mantine-color-dimmed)]">
            <b>Classic example:</b> expect both sync lines → all microtasks (including the nested
            one) → finally setTimeout. <br />
            <b>await:</b> line B (sync, after the call) runs before C/D (after the await).
          </div>
          <LogConsole logs={logs} />
        </Stack>
      </DemoCard>
    </Stack>
  );
}
