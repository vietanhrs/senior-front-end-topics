import { useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const N = 12;
const MID = Math.floor(N / 2);

interface Row {
  i: number;
  value: number;
}

// A controlled reproduction of tearing: we "render" N rows in sequence, and an
// external store mutates exactly at the midpoint (the slice boundary). The naive
// pass reads the LIVE store per row; the snapshot pass reads one value captured
// at render start — exactly what useSyncExternalStore guarantees.
function renderNaive(base: number): Row[] {
  let live = base;
  const rows: Row[] = [];
  for (let i = 0; i < N; i++) {
    if (i === MID) live = base + 1; // external mutation mid-render
    rows.push({ i, value: live });
  }
  return rows;
}

function renderSnapshot(base: number): Row[] {
  const snapshot = base; // read ONCE, consistently, at render start
  const rows: Row[] = [];
  for (let i = 0; i < N; i++) {
    // store still mutates at MID, but every row uses the frozen snapshot
    rows.push({ i, value: snapshot });
  }
  return rows;
}

function Grid({ rows }: { rows: Row[] }) {
  return (
    <Group gap={4} wrap="wrap">
      {rows.map((r) => (
        <Badge
          key={r.i}
          size="lg"
          variant="filled"
          color={r.value % 2 === 0 ? 'indigo' : 'orange'}
          style={{ width: 44 }}
        >
          {r.value}
        </Badge>
      ))}
    </Group>
  );
}

export function Demo() {
  const [base, setBase] = useState(0);
  const [naive, setNaive] = useState<Row[]>([]);
  const [safe, setSafe] = useState<Row[]>([]);

  const run = () => {
    const b = base + 2; // bump by 2 so parity/color stays meaningful per run
    setBase(b);
    setNaive(renderNaive(b));
    setSafe(renderSnapshot(b));
  };

  const torn = naive.length > 0 && new Set(naive.map((r) => r.value)).size > 1;
  const consistent = safe.length > 0 && new Set(safe.map((r) => r.value)).size === 1;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Render a list while the store mutates mid-render">
        Both lists render {N} rows; the external store value changes at row {MID} (the slice
        boundary). The <b>naive</b> list reads the live store per row → the first half shows the old
        value, the second half the new one: <b>torn</b>. The <b>snapshot</b> list reads one value at
        render start (what <code>useSyncExternalStore</code> enforces) → always consistent.
      </Callout>

      <Button onClick={run}>Render while store mutates</Button>

      <DemoCard
        title="❌ Naive live reads — tearing"
        right={
          naive.length > 0 && (
            <Badge color={torn ? 'red' : 'teal'} variant="light">
              {torn ? 'TORN (2 values)' : 'consistent'}
            </Badge>
          )
        }
      >
        {naive.length === 0 ? <Text size="sm" c="dimmed">Press the button.</Text> : <Grid rows={naive} />}
      </DemoCard>

      <DemoCard
        title="✅ Consistent snapshot — useSyncExternalStore"
        right={
          safe.length > 0 && (
            <Badge color={consistent ? 'teal' : 'red'} variant="light">
              {consistent ? 'consistent' : 'torn'}
            </Badge>
          )
        }
      >
        {safe.length === 0 ? <Text size="sm" c="dimmed">Press the button.</Text> : <Grid rows={safe} />}
      </DemoCard>
    </Stack>
  );
}
