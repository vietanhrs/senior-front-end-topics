import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Search results + a save toast. Screen-reader users hear nothing useful: the
// live region is injected with its content, the count reads as a bare number,
// every keystroke floods announcements, and the urgent error is only "polite".
function SearchUI() {
  function onResults(items) {
    // region created AND filled at the same time → many SRs won't announce it
    const el = document.createElement('div');
    el.setAttribute('aria-live', 'polite');
    el.textContent = items.length;            // reads "5", not "5 results"
    document.body.appendChild(el);
  }

  function onKeystroke(q) {
    statusEl.textContent = search(q).length + ' results'; // fires every keystroke
  }

  function onSaveError() {
    statusEl.textContent = 'Could not save';   // urgent, but polite → may wait
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the live-region announcements"
        description="Four bugs: the region is created together with its content, the count isn't atomic, keystrokes flood the region, and an urgent error uses polite. Make announcements reliable, meaningful, calm, and appropriately urgent."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Render the live regions <b>empty up front</b> (then write into them). Use{' '}
        <code>aria-atomic="true"</code> (or <code>role="status"</code>) so the whole "N results" is
        read. <b>Debounce</b> the keystroke updates. Route urgent errors to an{' '}
        <code>role="alert"</code> (assertive) region, not the polite one.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`function SearchUI() {
  return (
    <>
      {/* (1) regions exist from first render, EMPTY → SR registers them */}
      {/* (2) role="status" ⇒ polite + atomic, so it reads the whole text */}
      <div role="status" className="sr-only">{statusMessage}</div>
      {/* (4) separate assertive channel for urgent errors */}
      <div role="alert" className="sr-only">{errorMessage}</div>
      {/* inputs/results … */}
    </>
  );
}

// (3) debounce keystroke updates so the SR isn't flooded — one calm announcement
const announceResults = debounce((count) => {
  setStatusMessage(\`\${count} results\`);   // atomic region → "5 results"
}, 400);

function onKeystroke(q) {
  const count = search(q).length;
  renderResults(count);          // visual update can be immediate
  announceResults(count);        // announcement is debounced
}

function onSaveError() {
  setErrorMessage('Could not save your changes'); // → assertive alert region
}

/* .sr-only keeps the region in the a11y tree but off-screen (NOT display:none):
.sr-only {
  position:absolute; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
} */

// Why it works: regions are parsed empty so updates are announced; role="status"
// makes the count atomic ("5 results"); debouncing prevents flooding/coalescing;
// and genuinely urgent errors interrupt via a dedicated assertive region — while
// neither region steals focus.`}
      />
    </Stack>
  );
}
