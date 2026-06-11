import { useMemo } from 'react';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

type Id = 'L' | 'M' | 'H';

interface Task {
  id: Id;
  basePri: number;
  arrive: number;
  needsLock: boolean;
  remaining: number;
}

interface Result {
  timeline: (Id | null)[];
  finish: Record<Id, number>;
  events: string[];
}

const COLOR: Record<Id, string> = { L: 'gray', M: 'yellow', H: 'indigo' };
const LABEL: Record<Id, string> = {
  L: 'L · low (holds lock 5)',
  M: 'M · medium (CPU 8, no lock)',
  H: 'H · high (needs lock 2)',
};

// A tiny deterministic scheduler: each tick it runs the highest-priority READY
// task for one unit. The lock is exclusive; a task that needs it but can't have
// it is NOT ready. With inheritance, the lock holder is boosted to the priority
// of the highest task currently blocked waiting for that lock.
function simulate(inheritance: boolean): Result {
  const tasks: Record<Id, Task> = {
    L: { id: 'L', basePri: 1, arrive: 0, needsLock: true, remaining: 5 },
    M: { id: 'M', basePri: 2, arrive: 1, needsLock: false, remaining: 8 },
    H: { id: 'H', basePri: 3, arrive: 2, needsLock: true, remaining: 2 },
  };
  let holder: Id | null = null;
  const timeline: (Id | null)[] = [];
  const finish = {} as Record<Id, number>;
  const events: string[] = [];

  const effPri = (id: Id, t: number) => {
    let p = tasks[id].basePri;
    if (inheritance && holder === id) {
      for (const w of Object.values(tasks)) {
        if (w.id !== id && w.remaining > 0 && w.arrive <= t && w.needsLock && w.basePri > p) {
          p = w.basePri; // inherit the blocked waiter's priority
        }
      }
    }
    return p;
  };

  for (let t = 0; t < 40 && Object.values(tasks).some((k) => k.remaining > 0); t++) {
    const ready = Object.values(tasks).filter(
      (k) =>
        k.remaining > 0 &&
        k.arrive <= t &&
        (!k.needsLock || holder === null || holder === k.id),
    );
    if (ready.length === 0) {
      timeline.push(null);
      continue;
    }
    ready.sort((a, b) => effPri(b.id, t) - effPri(a.id, t));
    const run = ready[0];
    if (run.needsLock && holder === null) {
      holder = run.id;
      events.push(`t${t}: ${run.id} acquires lock`);
    }
    run.remaining -= 1;
    timeline.push(run.id);
    if (run.remaining === 0) {
      finish[run.id] = t + 1;
      if (holder === run.id) {
        holder = null;
        events.push(`t${t + 1}: ${run.id} releases lock`);
      }
    }
  }
  return { timeline, finish, events };
}

function Timeline({ result }: { result: Result }) {
  return (
    <Group gap={3} wrap="wrap">
      {result.timeline.map((id, t) => (
        <div
          key={t}
          title={`t${t}: ${id ?? 'idle'}`}
          style={{
            width: 22,
            height: 26,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: id ? '#fff' : 'var(--mantine-color-dimmed)',
            background: id
              ? `var(--mantine-color-${COLOR[id]}-6)`
              : 'var(--mantine-color-default-hover)',
            outline: id === 'H' ? '2px solid var(--mantine-color-indigo-3)' : 'none',
          }}
        >
          {id ?? '·'}
        </div>
      ))}
    </Group>
  );
}

export function Demo() {
  const inverted = useMemo(() => simulate(false), []);
  const fixed = useMemo(() => simulate(true), []);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Watch when H finishes in each schedule">
        Three tasks: <b>L</b> (low) grabs a lock and needs 5 units; <b>M</b> (medium) needs 8 units
        of CPU and no lock; <b>H</b> (high) arrives at t2 and needs the same lock for 2 units. Each
        tick the scheduler runs the highest-priority <i>ready</i> task. Compare H's finish time with
        and without <b>priority inheritance</b>.
      </Callout>

      <Group gap="lg">
        {(['L', 'M', 'H'] as Id[]).map((id) => (
          <Group key={id} gap={6}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: `var(--mantine-color-${COLOR[id]}-6)` }} />
            <Text size="xs">{LABEL[id]}</Text>
          </Group>
        ))}
      </Group>

      <DemoCard
        title="❌ Without priority inheritance — inversion"
        description="L holds the lock but is preempted by M (medium). H (high) is blocked on L the whole time M runs, so medium work effectively outranks high."
        right={<Badge color="red" variant="light">H finishes t{inverted.finish.H}</Badge>}
      >
        <Timeline result={inverted} />
      </DemoCard>

      <DemoCard
        title="✅ With priority inheritance — fixed"
        description="While H is blocked on the lock, L inherits H's priority, so it runs ahead of M, finishes its critical section, and releases. H proceeds immediately; M (correctly) waits."
        right={<Badge color="teal" variant="light">H finishes t{fixed.finish.H}</Badge>}
      >
        <Timeline result={fixed} />
      </DemoCard>

      <Text size="sm" c="dimmed">
        H is the highest-priority task, yet without inheritance it finishes at t{inverted.finish.H} —
        delayed by medium work it outranks. Inheritance boosts the lock holder so H finishes at t
        {fixed.finish.H}.
      </Text>
    </Stack>
  );
}
