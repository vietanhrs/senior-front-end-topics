import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A note-taking app syncs offline edits. The current merge is whole-document
// last-write-wins by Date.now(). Users lose work: tags they added vanish, and
// concurrent edits silently overwrite each other. Improve the merge.

function mergeNote(local, remote) {
  // whole-document LWW
  return local.updatedAt > remote.updatedAt ? local : remote;   // ❌ the loser is gone entirely
}

// note shape:
// { id, title, body, tags: string[], likes: number, updatedAt: number }`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: replace whole-document LWW with per-field merge"
        description="Design a field-aware merge that preserves concurrent work: per-field LWW where it's safe, set-union for tags, op-based sum for likes, and conflict detection for the body. Note why Date.now() alone is insufficient."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Merge each field by its own semantics: title = per-field LWW; tags = union (OR-Set);
        likes = base + both deltas (op-based counter); body = detect concurrency (version vectors)
        and flag for manual resolution rather than overwrite. Wall-clock can't detect concurrent vs
        sequential — track a per-replica version.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// Track causality with a version vector: { [replicaId]: counter }.
// 'a dominates b' iff every component of a >= b (and at least one >). Otherwise concurrent.
function dominates(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let ge = true, gt = false;
  for (const k of keys) { const x = a[k] ?? 0, y = b[k] ?? 0; if (x < y) ge = false; if (x > y) gt = true; }
  return ge && gt;
}

function mergeNote(local, remote, base) {
  // Fast-forward if one causally dominates the other — no real conflict.
  if (dominates(local.vv, remote.vv)) return local;
  if (dominates(remote.vv, local.vv)) return remote;

  // Concurrent edits → merge per field by its own semantics.
  const merged = { id: local.id };

  // title: per-field LWW (timestamp the field, not the doc)
  merged.title = local.titleTs >= remote.titleTs ? local.title : remote.title;

  // tags: set union (OR-Set) — both users' additions survive
  merged.tags = [...new Set([...local.tags, ...remote.tags])];

  // likes: op-based counter — sum the deltas from the common base, don't pick one
  merged.likes = base.likes + (local.likes - base.likes) + (remote.likes - base.likes);

  // body: genuinely ambiguous prose → don't silently overwrite. Detect & surface.
  if (local.body !== remote.body && local.body !== base.body && remote.body !== base.body) {
    merged.body = local.body;                     // keep a default…
    merged.conflict = { field: 'body', local: local.body, remote: remote.body }; // …but flag for the user
  } else {
    merged.body = local.body !== base.body ? local.body : remote.body; // one side changed → take it
  }

  merged.vv = mergeVectors(local.vv, remote.vv);  // componentwise max
  return merged;
}

// Why:
//  - Whole-doc LWW threw away the loser entirely; per-field merge keeps each field's work.
//  - tags=union and likes=sum are CRDT semantics → concurrent edits converge with no loss.
//  - Date.now() can't distinguish concurrent from sequential and drifts; version vectors
//    detect true concurrency so you only prompt the user when you must (the body).
//  - Plumbing: queue mutations in IndexedDB with the base version + client id, replay via
//    Background Sync, and make server writes idempotent so retries don't double-apply.`}
      />
    </Stack>
  );
}
