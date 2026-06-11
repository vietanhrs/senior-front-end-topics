import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A toolbar. It looks fine but is broken in the accessibility tree: controls with
// no role, icon buttons with no name, and a focusable element hidden from AT.
function Toolbar() {
  return (
    <div className="toolbar">
      {/* not a button in the a11y tree: generic, not focusable, no keyboard */}
      <div className="btn" onClick={save}>💾</div>

      {/* a real button, but announced only as "button" — the ✕ has no meaning */}
      <button onClick={close}>✕</button>

      {/* focusable, but removed from the a11y tree → a nameless "ghost" stop */}
      <a href="/help" aria-hidden="true">?</a>

      {/* decorative icon is announced as "image" with a meaningless filename */}
      <img src="/divider.png" />
    </div>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the accessibility tree"
        description="Each control is wrong in the a11y tree: a div pretending to be a button, an icon button with no name, a focusable link hidden from assistive tech, and a decorative image announced by filename. Make every node expose the right role + name (or be correctly pruned)."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Use the semantic element (<code>&lt;button&gt;</code>) so the role + keyboard come for free.
        Give icon-only controls an <code>aria-label</code>. Never put <code>aria-hidden</code> on a
        focusable element — if it shouldn't be reachable, also remove it from tab order. Mark truly
        decorative images <code>alt=""</code>.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`function Toolbar() {
  return (
    <div className="toolbar" role="toolbar" aria-label="Editor actions">
      {/* real <button> → role=button, focusable, Enter/Space for free;
          aria-label gives the icon a meaningful name */}
      <button onClick={save} aria-label="Save">
        <span aria-hidden="true">💾</span>      {/* icon hidden from AT, label carries meaning */}
      </button>

      <button onClick={close} aria-label="Close">
        <span aria-hidden="true">✕</span>
      </button>

      {/* if Help SHOULD be reachable: keep it in the tree with a name */}
      <a href="/help" aria-label="Help">
        <span aria-hidden="true">?</span>
      </a>
      {/* if it genuinely shouldn't be available, remove it entirely or also
          take it out of tab order: <a href="/help" hidden> — never aria-hidden + focusable */}

      {/* decorative → empty alt → correctly pruned from the a11y tree */}
      <img src="/divider.png" alt="" />
    </div>
  );
}

// Resulting accessibility tree:
//   toolbar "Editor actions"
//     ├─ button "Save"
//     ├─ button "Close"
//     └─ link   "Help"
//   (divider image is omitted — decorative)

// Why it's correct: semantic elements give the right roles + keyboard behavior;
// every interactive node has an accessible name; the icon glyphs are hidden from
// AT (so they're not announced as "multiplication x"); and there are no focusable
// nodes missing from the tree. Verify in DevTools → Accessibility pane / axe.`}
      />
    </Stack>
  );
}
