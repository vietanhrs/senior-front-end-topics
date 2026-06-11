import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, NumberInput, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

export function Demo() {
  const { logs, log, clear } = useLogger();
  const targetRef = useRef<HTMLDivElement | null>(null);
  const moRef = useRef<MutationObserver | null>(null);
  const callbacksRef = useRef(0);

  const [count, setCount] = useState(2000);
  const [subtree, setSubtree] = useState(true);
  const [filterAttrs, setFilterAttrs] = useState(false);
  const [callbacks, setCallbacks] = useState(0);
  const [records, setRecords] = useState(0);

  const observerInit: MutationObserverInit = {
    childList: true,
    subtree,
    attributes: true,
    ...(filterAttrs ? { attributeFilter: ['data-keep'] } : {}),
  };

  // (Re)create the observer whenever the options change.
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    callbacksRef.current = 0;

    const mo = new MutationObserver((mutations) => {
      // One microtask-timed callback delivers the WHOLE batch of records,
      // no matter how many individual DOM ops produced them.
      callbacksRef.current += 1;
      setCallbacks(callbacksRef.current);
      setRecords((r) => r + mutations.length);
      log(
        `callback #${callbacksRef.current}: ${mutations.length} record(s) delivered in one batch`,
        'macro',
      );
    });

    mo.observe(target, observerInit);
    moRef.current = mo;
    log(
      `observing { childList, attributes, subtree:${subtree}${filterAttrs ? ", attributeFilter:['data-keep']" : ''} }`,
      'sync',
    );
    return () => mo.disconnect();
  }, [subtree, filterAttrs, log]);

  const runBatch = () => {
    const target = targetRef.current;
    if (!target) return;
    setCallbacks(0);
    setRecords(0);
    callbacksRef.current = 0;

    const t0 = performance.now();
    // A burst of synchronous DOM work: append a node and set TWO attributes each
    // (one filtered-in 'data-keep', one filtered-out 'data-noise'). With the
    // filter on, the noise writes generate no records at all.
    for (let i = 0; i < count; i++) {
      const node = document.createElement('span');
      target.appendChild(node);
      node.setAttribute('data-keep', String(i));
      node.setAttribute('data-noise', String(i)); // dropped when attributeFilter is on
    }
    const t1 = performance.now();
    log(`performed ~${count * 3} DOM ops synchronously in ${(t1 - t0).toFixed(1)}ms`, 'micro');
    log('records are still queued — callback fires after this task (microtask)…', 'default');

    // Clear the test nodes next frame so the demo stays light.
    requestAnimationFrame(() => {
      moRef.current?.disconnect();
      target.replaceChildren();
      moRef.current?.observe(target, observerInit);
    });
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="One batch in, one callback out">
        Run a burst of thousands of DOM mutations. However many ops you do, the observer fires{' '}
        <b>one</b> microtask-timed callback carrying the whole record list — that loop is the real
        cost. Toggle <code>subtree</code> and <code>attributeFilter</code> and watch the record
        count change: filtering out the <code>data-noise</code> writes drops those attribute records.
      </Callout>

      <Group grow align="flex-end">
        <NumberInput
          label="mutations (nodes to append)"
          value={count}
          onChange={(v) => setCount(Number(v) || 0)}
          min={100}
          max={20000}
          step={500}
          thousandSeparator
        />
        <Switch
          label="subtree: true"
          checked={subtree}
          onChange={(e) => setSubtree(e.currentTarget.checked)}
        />
        <Switch
          label="attributeFilter (['data-keep'])"
          checked={filterAttrs}
          onChange={(e) => setFilterAttrs(e.currentTarget.checked)}
        />
      </Group>

      <Group>
        <Button onClick={() => { clear(); runBatch(); }}>Run mutation batch</Button>
        <Badge variant="light" color="orange">callbacks {callbacks}</Badge>
        <Badge variant="light" color="grape">records {records}</Badge>
      </Group>

      <DemoCard title="Observed container (children appended then cleared)">
        <div ref={targetRef} className="min-h-12 rounded-md border p-3">
          <Text size="xs" c="dimmed">target — mutations are applied here</Text>
        </div>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Run a batch to see records coalesced into one callback." />
    </Stack>
  );
}
