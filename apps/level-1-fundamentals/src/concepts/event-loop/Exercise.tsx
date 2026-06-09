import { Button, Stack } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, LogConsole, SolutionReveal, useLogger } from '../../workbook/ui';

const snippet = `console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => {
  console.log('3');
  // this microtask SCHEDULES another microtask
  Promise.resolve().then(() => console.log('4'));
});

Promise.resolve().then(() => console.log('5'));

console.log('6');`;

export function Exercise() {
  const { logs, log, clear } = useLogger();

  function run() {
    clear();
    log('1', 'sync');
    setTimeout(() => log('2', 'macro'), 0);
    Promise.resolve().then(() => {
      log('3', 'micro');
      Promise.resolve().then(() => log('4', 'micro'));
    });
    Promise.resolve().then(() => log('5', 'micro'));
    log('6', 'sync');
  }

  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: predict the print order"
        description="Write down the order you think the numbers print in. Click Run to compare, then open the solution. Key question: does microtask (4), scheduled while draining, run before or after (5)? And before or after macrotask (2)?"
      >
        <Stack gap="sm">
          <CodeHighlight code={snippet} language="js" radius="md" />
          <Button size="xs" leftSection={<IconPlayerPlay size={14} />} onClick={run} w="fit-content">
            Run & compare
          </Button>
          <LogConsole logs={logs} height={200} />
        </Stack>
      </DemoCard>

      <Callout kind="tip" title="Hint">
        The microtask queue is <b>fully drained</b> before reaching a macrotask — including
        microtasks added <i>while</i> draining. But those are pushed to the <b>end</b> of the
        current queue.
      </Callout>

      <SolutionReveal
        language="text"
        notes="Correct order: 1 → 6 → 3 → 5 → 4 → 2"
        code={`Synchronous phase:
  1  console.log('1')
  6  console.log('6')   // setTimeout & the .then's only REGISTER, don't run yet

Drain the microtask queue. At the start, queue = [A→3, B→5]:
  3  runs callback A. While running, it REGISTERS another microtask C→4,
     which is pushed to the END of the queue: queue = [B→5, C→4]
  5  runs callback B (already there from the start, ahead of C)
  4  runs callback C (the newly-scheduled microtask, still drained this round)
     -> queue empty

Macrotask:
  2  setTimeout(0) — only runs AFTER the microtask queue is completely empty

=> Lesson: newly-scheduled microtasks are always drained before the next
   macrotask. This is the mechanism behind "microtask starvation": if you keep
   spawning microtasks, (2) and even rendering never get their turn.`}
      />
    </Stack>
  );
}
