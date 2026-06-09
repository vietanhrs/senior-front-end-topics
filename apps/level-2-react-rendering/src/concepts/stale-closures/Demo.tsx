import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

/** ❌ Buggy: the interval closure captures `count` from the first render (0). */
function BuggyTimer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1); // `count` is frozen at 0 → always sets 1
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <BigValue label="Buggy (stale closure)" value={count} bad />;
}

/** ✔ Fixed: functional updater always reads the latest state. */
function FixedTimer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <BigValue label="Fixed (functional updater)" value={count} />;
}

/** ✔ Fixed via ref: a long-lived callback reads the freshest value. */
function RefTimer() {
  const [count, setCount] = useState(0);
  const latest = useRef(count);
  useEffect(() => {
    latest.current = count; // keep current every render
  });
  useEffect(() => {
    const id = setInterval(() => setCount(latest.current + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <BigValue label="Fixed (ref holds latest)" value={count} />;
}

function BigValue({ label, value, bad }: { label: string; value: number; bad?: boolean }) {
  return (
    <Paper withBorder p="md" radius="md" className="flex-1 text-center">
      <Badge color={bad ? 'red' : 'teal'} variant="light" mb="xs">
        {label}
      </Badge>
      <Text fz={40} fw={700} ff="monospace">
        {value}
      </Text>
    </Paper>
  );
}

export function Demo() {
  const [runId, setRunId] = useState(0);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Watch the numbers">
        All three start an interval once on mount. The buggy one is stuck at <b>1</b> — its
        callback captured <code>count = 0</code> from the first render and never sees updates. The
        two fixes climb every second. Hit Restart to re-mount and watch again.
      </Callout>

      <DemoCard
        title="setInterval + stale closure"
        right={
          <Button size="xs" variant="default" onClick={() => setRunId((r) => r + 1)}>
            Restart
          </Button>
        }
      >
        <Group align="stretch" key={runId}>
          <BuggyTimer />
          <FixedTimer />
          <RefTimer />
        </Group>
      </DemoCard>
    </Stack>
  );
}
