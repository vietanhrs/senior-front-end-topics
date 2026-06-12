import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Sync merge for a profile record edited on two devices. It blindly
// last-write-wins the WHOLE record by wall-clock time, so concurrent edits to
// unrelated fields clobber each other and there's no way to detect a real conflict.
function mergeProfile(local, remote) {
  // clock skew makes this even worse across devices
  return local.updatedAt > remote.updatedAt ? local : remote;
  // whoever has the later clock wins everything; the other device's edits vanish
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: replace whole-record LWW with per-field resolution"
        description="Whole-record LWW by timestamp loses concurrent edits and can't tell a real conflict from a fast-forward. Detect concurrency with version vectors, then resolve per field by intent — auto-merging what's safe and flagging only true conflicts."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        First <b>detect</b>: compare <b>version vectors</b> — if one dominates, fast-forward (no
        conflict). If concurrent, <b>resolve per field by intent</b>: union sets (interests), sum/max
        counters, LWW cosmetic flags, and <b>flag</b> genuinely conflicting free-text for the user
        rather than dropping it.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// 1) DETECT with version vectors (per-replica counters), not wall clocks.
function compare(a, b) {            // returns 'a-newer' | 'b-newer' | 'concurrent'
  let aDom = false, bDom = false;
  for (const r of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if ((a[r] ?? 0) > (b[r] ?? 0)) aDom = true;
    if ((b[r] ?? 0) > (a[r] ?? 0)) bDom = true;
  }
  return aDom && bDom ? 'concurrent' : bDom ? 'b-newer' : 'a-newer';
}

function mergeProfile(local, remote, base) {
  const rel = compare(local.vv, remote.vv);
  if (rel === 'a-newer') return local;     // fast-forward: no conflict
  if (rel === 'b-newer') return remote;
  // 2) CONCURRENT → resolve PER FIELD by intent
  const conflicts = [];
  const merged = {
    // set semantics: union (nobody loses an interest)
    interests: [...new Set([...local.interests, ...remote.interests])],
    // counter: apply both deltas relative to the base (PN-counter)
    points: base.points + (local.points - base.points) + (remote.points - base.points),
    // cosmetic flag: LWW is fine
    theme: local.updatedAt > remote.updatedAt ? local.theme : remote.theme,
    // high-stakes free text: don't guess — surface both for the user
    bio: local.bio === remote.bio ? local.bio : undefined,
  };
  if (merged.bio === undefined) conflicts.push({ field: 'bio', local: local.bio, remote: remote.bio });

  // merge the version vectors (element-wise max) for the resulting version
  merged.vv = mergeVectors(local.vv, remote.vv);
  return { merged, conflicts };            // caller prompts the user for conflicts[]
}

// Why it's better: version vectors distinguish a true concurrent conflict from a
// stale device (no needless prompts, no clock-skew bugs). Resolution is per field
// by intent — sets union, counters sum, flags LWW — so unrelated edits never
// clobber each other, and only genuinely ambiguous fields (bio) are surfaced to
// the user instead of being silently lost.`}
      />
    </Stack>
  );
}
