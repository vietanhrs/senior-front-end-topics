import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A shared "tags" set for a collaborative doc. Replicas add/remove tags offline,
// then sync. But merges lose data and aren't idempotent or order-independent.
function createTagSet() {
  return { tags: [] };
}
function add(set, tag)    { set.tags.push(tag); }          // dupes on re-add
function remove(set, tag) { set.tags = set.tags.filter((t) => t !== tag); }

// merge just concatenates and de-dupes — but a concurrent add+remove of the same
// tag resolves differently depending on merge ORDER, and re-merging changes state.
function merge(a, b) {
  return { tags: [...new Set([...a.tags, ...b.tags])] };
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: turn this into a real CRDT (OR-Set)"
        description="This set isn't conflict-free: a concurrent add and remove of the same tag depends on merge order, and merge isn't idempotent. Implement an Observed-Remove Set whose merge is commutative, associative, and idempotent."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Give every <i>add</i> a unique tag (id). An element is present if it has at least one add-tag
        not cancelled by a remove. <b>Remove</b> only cancels the add-tags it has <i>observed</i> — so
        a concurrent add (new tag) survives (<b>add-wins</b>). Merge = union of adds ∪ union of
        removes; presence = adds minus removes. Union is commutative/associative/idempotent.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// OR-Set: track add-tags and remove-tags (tombstones) as sets of unique ids.
let counter = 0;
const uid = (replica) => \`\${replica}:\${++counter}\`;

function createTagSet() {
  return { adds: new Map(), removes: new Set() }; // adds: tag -> Set<uid>; removes: Set<uid>
}

function add(set, tag, replica) {
  if (!set.adds.has(tag)) set.adds.set(tag, new Set());
  set.adds.get(tag).add(uid(replica));            // each add gets a fresh unique id
}

function remove(set, tag) {
  // remove only the add-ids we have OBSERVED so far (tombstone them)
  for (const id of set.adds.get(tag) ?? []) set.removes.add(id);
}

function has(set, tag) {
  const ids = set.adds.get(tag);
  if (!ids) return false;
  for (const id of ids) if (!set.removes.has(id)) return true; // a live (non-tombstoned) add exists
  return false;
}

function merge(a, b) {
  const adds = new Map();
  for (const src of [a.adds, b.adds]) {
    for (const [tag, ids] of src) {
      if (!adds.has(tag)) adds.set(tag, new Set());
      for (const id of ids) adds.get(tag).add(id);  // union of add-ids
    }
  }
  const removes = new Set([...a.removes, ...b.removes]); // union of tombstones
  return { adds, removes };
}

function values(set) {
  return [...set.adds.keys()].filter((tag) => has(set, tag));
}

// Why it's conflict-free:
// • merge is set UNION on both adds and removes → commutative, associative, AND
//   idempotent (re-merging the same state changes nothing).
// • A concurrent add creates a NEW uid the other replica's remove never observed,
//   so it survives → deterministic ADD-WINS, independent of merge order.
// (Tombstones grow over time — production CRDTs compact them with version vectors.)`}
      />
    </Stack>
  );
}
