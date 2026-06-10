import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Progress, Stack } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const TASK_MS = 4000;
const TIMEOUT_MS = 2500;

/** A cancelable long task: progresses in 100ms steps, checks the signal between steps. */
function longTask(signal: AbortSignal, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const steps = TASK_MS / 100;
    let i = 0;
    const tick = () => {
      if (signal.aborted) {
        reject(signal.reason instanceof DOMException ? signal.reason : new DOMException('Aborted', 'AbortError'));
        return;
      }
      i += 1;
      onProgress(Math.round((i / steps) * 100));
      if (i >= steps) resolve('result ready');
      else setTimeout(tick, 100);
    };
    tick();
  });
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'aborted' | 'timeout'>('idle');
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => () => ctrlRef.current?.abort(), []);

  async function start(withTimeout: boolean) {
    // New controller PER attempt (an aborted controller stays aborted forever).
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const signal = withTimeout
      ? AbortSignal.any([ctrl.signal, AbortSignal.timeout(TIMEOUT_MS)])
      : ctrl.signal;

    setProgress(0);
    setState('running');
    log(withTimeout ? `start with AbortSignal.any([user, timeout(${TIMEOUT_MS}ms)])` : 'start (user-cancelable only)', 'macro');

    try {
      const result = await longTask(signal, setProgress);
      setState('done');
      log(`completed: ${result}`, 'success');
    } catch (e) {
      // Distinguish self-inflicted cancellation kinds from real errors.
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        setState('timeout');
        log(`TimeoutError — auto-aborted after ${TIMEOUT_MS}ms (task needs ${TASK_MS}ms)`, 'error');
      } else if (e instanceof DOMException && e.name === 'AbortError') {
        setState('aborted');
        log('AbortError — cancelled by the user (no error toast for this!)', 'micro');
      } else {
        setState('idle');
        log(`real failure: ${String(e)}`, 'error');
      }
    }
  }

  const color =
    state === 'done' ? 'teal' : state === 'aborted' ? 'gray' : state === 'timeout' ? 'red' : 'indigo';

  return (
    <Stack gap="md">
      <Callout kind="info" title="One primitive, three outcomes">
        The task takes {TASK_MS / 1000}s. Run it plain and cancel mid-way (<b>AbortError</b>), or
        run it with a {TIMEOUT_MS / 1000}s timeout via{' '}
        <code>AbortSignal.any([userSignal, AbortSignal.timeout()])</code> (<b>TimeoutError</b> fires
        first). Note how the catch block distinguishes cancellation kinds from real failures.
      </Callout>

      <DemoCard
        title="Cancelable long task"
        right={
          <Badge color={color} variant="filled">
            {state}
          </Badge>
        }
      >
        <Progress value={progress} color={color} size="lg" radius="md" mb="md" animated={state === 'running'} />
        <Group>
          <Button onClick={() => start(false)} disabled={state === 'running'}>
            Run (cancelable)
          </Button>
          <Button variant="light" color="grape" onClick={() => start(true)} disabled={state === 'running'}>
            Run with {TIMEOUT_MS / 1000}s timeout
          </Button>
          <Button color="red" variant="light" onClick={() => ctrlRef.current?.abort()} disabled={state !== 'running'}>
            Abort (user)
          </Button>
          <Button variant="subtle" onClick={clear}>
            Clear log
          </Button>
        </Group>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Run the task, then abort it / let the timeout fire." />
    </Stack>
  );
}
