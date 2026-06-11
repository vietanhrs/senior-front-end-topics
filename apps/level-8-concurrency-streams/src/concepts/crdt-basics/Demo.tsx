import { useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

type Id = 'A' | 'B' | 'C';
const IDS: Id[] = ['A', 'B', 'C'];
type Vec = Record<Id, number>;

const zeroVec = (): Vec => ({ A: 0, B: 0, C: 0 });
const sum = (v: Vec) => v.A + v.B + v.C;

interface LWW {
  value: number;
  ts: number;
}

const COLOR: Record<Id, string> = { A: 'indigo', B: 'teal', C: 'grape' };

export function Demo() {
  // CRDT G-Counters: one per replica, each holding a per-replica count vector.
  const [crdt, setCrdt] = useState<Record<Id, Vec>>({ A: zeroVec(), B: zeroVec(), C: zeroVec() });
  // Naive last-write-wins registers, for contrast.
  const [naive, setNaive] = useState<Record<Id, LWW>>({
    A: { value: 0, ts: 0 },
    B: { value: 0, ts: 0 },
    C: { value: 0, ts: 0 },
  });
  const [increments, setIncrements] = useState(0);
  const clock = useRef(0);

  const inc = (id: Id) => {
    clock.current += 1;
    const ts = clock.current;
    setCrdt((s) => ({ ...s, [id]: { ...s[id], [id]: s[id][id] + 1 } }));
    setNaive((s) => ({ ...s, [id]: { value: s[id].value + 1, ts } }));
    setIncrements((n) => n + 1);
  };

  const mergeAll = () => {
    // CRDT: element-wise max across all replicas (commutative/associative/idempotent).
    setCrdt((s) => {
      const merged: Vec = zeroVec();
      for (const k of IDS) for (const r of IDS) merged[k] = Math.max(merged[k], s[r][k]);
      return { A: { ...merged }, B: { ...merged }, C: { ...merged } };
    });
    // Naive LWW: the register with the latest timestamp wins; others' increments are LOST.
    setNaive((s) => {
      const winner = IDS.reduce((best, k) => (s[k].ts > s[best].ts ? k : best), 'A' as Id);
      const w = s[winner];
      return { A: { ...w }, B: { ...w }, C: { ...w } };
    });
  };

  const reset = () => {
    setCrdt({ A: zeroVec(), B: zeroVec(), C: zeroVec() });
    setNaive({ A: { value: 0, ts: 0 }, B: { value: 0, ts: 0 }, C: { value: 0, ts: 0 } });
    setIncrements(0);
    clock.current = 0;
  };

  const crdtConverged = new Set(IDS.map((k) => sum(crdt[k]))).size === 1;
  const naiveConverged = new Set(IDS.map((k) => naive[k].value)).size === 1;
  const crdtValue = sum(crdt.A);
  const naiveValue = naive.A.value;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Increment replicas offline, then merge — who converges correctly?">
        Each replica increments <b>independently</b> (as if offline). Press <b>Merge all</b> to
        reconcile. The <b>CRDT G-Counter</b> merges by per-slot <code>max</code> and converges to the
        true total. The <b>naive LWW</b> register keeps only the latest writer's value — losing every
        concurrent increment on the other replicas.
      </Callout>

      <Group>
        {IDS.map((id) => (
          <Button key={id} color={COLOR[id]} variant="light" onClick={() => inc(id)}>
            Replica {id} +1
          </Button>
        ))}
        <Button onClick={mergeAll}>Merge all</Button>
        <Button variant="subtle" onClick={reset}>Reset</Button>
        <Badge size="lg" variant="light">increments performed: {increments}</Badge>
      </Group>

      <DemoCard
        title="✅ CRDT G-Counter (per-replica vector, merge = element-wise max)"
        right={
          <Badge color={crdtConverged ? 'teal' : 'gray'} variant="light">
            {crdtConverged ? `converged = ${crdtValue}` : 'diverged (pre-merge)'}
          </Badge>
        }
      >
        <Group>
          {IDS.map((id) => (
            <div key={id} className="rounded-md border p-2" style={{ flex: 1 }}>
              <Text size="sm" fw={600} c={COLOR[id]}>Replica {id} — value {sum(crdt[id])}</Text>
              <Text size="xs" c="dimmed" ff="monospace">
                {`{A:${crdt[id].A}, B:${crdt[id].B}, C:${crdt[id].C}}`}
              </Text>
            </div>
          ))}
        </Group>
      </DemoCard>

      <DemoCard
        title="❌ Naive last-write-wins register"
        right={
          <Badge color={naiveConverged ? (naiveValue === crdtValue ? 'teal' : 'red') : 'gray'} variant="light">
            {naiveConverged ? `converged = ${naiveValue}` : 'diverged (pre-merge)'}
          </Badge>
        }
      >
        <Group>
          {IDS.map((id) => (
            <div key={id} className="rounded-md border p-2" style={{ flex: 1 }}>
              <Text size="sm" fw={600}>Replica {id} — value {naive[id].value}</Text>
              <Text size="xs" c="dimmed" ff="monospace">ts {naive[id].ts}</Text>
            </div>
          ))}
        </Group>
      </DemoCard>

      {naiveConverged && naiveValue < crdtValue && (
        <Text size="sm" c="red">
          LWW lost {crdtValue - naiveValue} increment(s): it kept only the latest writer's value. The
          CRDT kept all {crdtValue}.
        </Text>
      )}
    </Stack>
  );
}
