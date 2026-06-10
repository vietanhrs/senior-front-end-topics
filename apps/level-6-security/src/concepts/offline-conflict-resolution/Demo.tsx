import { useState } from 'react';
import { Badge, Button, Code, Group, Paper, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Doc {
  title: string;
  titleClock: number; // logical clock for the title field (per-field LWW)
  tags: string[];
  count: number;
}

const BASE: Doc = { title: 'Draft', titleClock: 0, tags: ['draft'], count: 0 };

type Strategy = 'lww' | 'crdt';

function clone(d: Doc): Doc {
  return { ...d, tags: [...d.tags] };
}

export function Demo() {
  const [a, setA] = useState<Doc>(() => clone(BASE));
  const [b, setB] = useState<Doc>(() => clone(BASE));
  const [clock, setClock] = useState(1); // shared logical clock to order title edits
  const [strategy, setStrategy] = useState<Strategy>('lww');
  const [merged, setMerged] = useState<Doc | null>(null);
  const [tagInput, setTagInput] = useState({ a: '', b: '' });

  function editTitle(which: 'a' | 'b', value: string) {
    const c = clock + 1;
    setClock(c);
    (which === 'a' ? setA : setB)((d) => ({ ...d, title: value, titleClock: c }));
    setMerged(null);
  }
  function addTag(which: 'a' | 'b') {
    const t = tagInput[which].trim();
    if (!t) return;
    (which === 'a' ? setA : setB)((d) => ({ ...d, tags: [...new Set([...d.tags, t])] }));
    setTagInput((s) => ({ ...s, [which]: '' }));
    setMerged(null);
  }
  function inc(which: 'a' | 'b') {
    (which === 'a' ? setA : setB)((d) => ({ ...d, count: d.count + 1 }));
    setMerged(null);
  }

  function sync() {
    if (strategy === 'lww') {
      // Per-field LWW: title by clock; tags & count = whichever replica wrote later overall.
      const aLater = a.titleClock >= b.titleClock;
      setMerged({
        title: aLater ? a.title : b.title,
        titleClock: Math.max(a.titleClock, b.titleClock),
        tags: aLater ? [...a.tags] : [...b.tags], // LWW replaces the whole field → loses the other's adds
        count: aLater ? a.count : b.count, // loses the other's increments
      });
    } else {
      // CRDT-style merge: title LWW; tags = union; count = base + both deltas.
      setMerged({
        title: a.titleClock >= b.titleClock ? a.title : b.title,
        titleClock: Math.max(a.titleClock, b.titleClock),
        tags: [...new Set([...a.tags, ...b.tags])],
        count: BASE.count + (a.count - BASE.count) + (b.count - BASE.count),
      });
    }
  }

  function reset() {
    setA(clone(BASE)); setB(clone(BASE)); setClock(1); setMerged(null);
  }

  const titleConflict = a.title !== b.title && a.title !== BASE.title && b.title !== BASE.title;
  const tagsLost = strategy === 'lww' && merged ? [...a.tags, ...b.tags].filter((t) => !merged.tags.includes(t)) : [];
  const countLost = strategy === 'lww' && merged ? a.count - BASE.count + (b.count - BASE.count) - (merged.count - BASE.count) : 0;

  const replica = (which: 'a' | 'b', d: Doc) => (
    <Paper withBorder radius="md" p="md">
      <Badge mb="sm" color={which === 'a' ? 'indigo' : 'grape'}>Replica {which.toUpperCase()} (offline)</Badge>
      <Stack gap="xs">
        <TextInput size="xs" label="title (LWW field)" value={d.title} onChange={(e) => editTitle(which, e.currentTarget.value)} />
        <Group gap="xs" align="flex-end">
          <TextInput size="xs" label="add tag" value={tagInput[which]} onChange={(e) => setTagInput((s) => ({ ...s, [which]: e.currentTarget.value }))} style={{ flex: 1 }} />
          <Button size="xs" variant="light" onClick={() => addTag(which)}>+ tag</Button>
        </Group>
        <Text size="xs">tags: {d.tags.map((t) => <Code key={t}>{t}</Code>)}</Text>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={() => inc(which)}>count +1</Button>
          <Text size="sm">count: <b>{d.count}</b></Text>
        </Group>
      </Stack>
    </Paper>
  );

  return (
    <Stack gap="md">
      <Callout kind="info" title="Edit both replicas offline, then sync">
        Both replicas start from the same base. Edit each independently (different title, different
        tags, both increment the counter), then Sync. <b>LWW</b> keeps only one replica's tags/count
        — the other's work is <b>lost</b>. <b>CRDT merge</b> unions the tags and sums the counter, so
        nothing is lost (title still needs a tiebreak rule).
      </Callout>

      <SegmentedControl
        value={strategy}
        onChange={(v) => { setStrategy(v as Strategy); setMerged(null); }}
        fullWidth
        data={[
          { label: 'Last-Write-Wins', value: 'lww' },
          { label: 'CRDT merge (counter=sum, tags=union)', value: 'crdt' },
        ]}
      />

      <Group grow align="flex-start">
        {replica('a', a)}
        {replica('b', b)}
      </Group>

      <Group>
        <Button onClick={sync}>Sync replicas</Button>
        <Button variant="subtle" onClick={reset}>Reset</Button>
      </Group>

      {merged && (
        <DemoCard
          title="Merged result"
          right={
            <Badge color={strategy === 'crdt' || (tagsLost.length === 0 && countLost === 0) ? 'teal' : 'red'} variant="filled">
              {strategy === 'lww' && (tagsLost.length > 0 || countLost > 0) ? 'data lost' : 'no data lost'}
            </Badge>
          }
        >
          <Code block>
            {`title: ${JSON.stringify(merged.title)}   (clock ${merged.titleClock})
tags:  [${merged.tags.join(', ')}]
count: ${merged.count}`}
          </Code>
          {titleConflict && (
            <Text size="xs" c="orange" mt="xs">
              ⚠ Both replicas changed the title concurrently — LWW/clock picked one. A real app might
              flag this for manual resolution (version vectors detect the concurrency).
            </Text>
          )}
          {strategy === 'lww' && (tagsLost.length > 0 || countLost > 0) && (
            <Text size="xs" c="red" mt="xs">
              Lost by LWW: {tagsLost.length > 0 && `tags [${tagsLost.join(', ')}]`}{tagsLost.length > 0 && countLost > 0 ? ', ' : ''}
              {countLost > 0 && `${countLost} increment(s)`}. CRDT merge would have preserved them.
            </Text>
          )}
        </DemoCard>
      )}
    </Stack>
  );
}
