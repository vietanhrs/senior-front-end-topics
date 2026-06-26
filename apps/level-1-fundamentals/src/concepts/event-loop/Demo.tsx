import { Button, Group, Stack, Text } from '@mantine/core';
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

  function runRaf() {
    clear();
    log('sync: schedule microtask, rAF, and setTimeout', 'sync');

    requestAnimationFrame(() => {
      log('requestAnimationFrame: before next paint', 'sync');
      queueMicrotask(() => log('microtask queued inside rAF: runs before paint finishes', 'micro'));
    });

    Promise.resolve().then(() => log('Promise.then: microtask before rAF', 'micro'));

    setTimeout(() => log('setTimeout(0): later task, after the frame opportunity', 'macro'), 0);

    log('sync: end of current task', 'sync');
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
            <Button size="xs" color="teal" leftSection={<IconPlayerPlay size={14} />} onClick={runRaf}>
              rAF before paint
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
          <Text size="xs" c="dimmed">
            The rAF experiment logs the common browser ordering: current task, microtasks, then the
            frame callback before paint. Timer ordering can vary by frame timing, but rAF is the
            frame-aligned hook, not a microtask.
          </Text>
          <LogConsole logs={logs} />
        </Stack>
      </DemoCard>
    </Stack>
  );
}
