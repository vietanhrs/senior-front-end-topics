import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// An export feature with several cancellation bugs:
//  (1) no way to cancel the slow request; navigating away leaks it,
//  (2) no timeout — a hung server hangs the UI forever,
//  (3) AbortError lands in the same catch as real errors → shows a failure toast
//      when the USER cancelled,
//  (4) the helper ignores cancellation entirely between its steps.
async function exportReport(filters) {
  try {
    const res = await fetch('/api/export?' + qs(filters));   // (1)(2)
    const blob = await res.blob();
    await postProcess(blob);                                  // (4) not cancelable
    download(blob);
  } catch (e) {
    toast.error('Export failed!');                            // (3) fires on cancel too
  }
}

async function postProcess(blob) {
  for (const page of splitPages(blob)) {
    await renderPage(page);     // long; never checks for cancellation
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the export fully cancelable"
        description="Add user cancellation + a 15s timeout (combined with AbortSignal.any), propagate the signal into postProcess, and only toast on REAL failures."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        New controller per attempt; <code>AbortSignal.any([ctrl.signal,
        AbortSignal.timeout(15000)])</code>; pass <code>signal</code> to fetch AND to{' '}
        <code>postProcess</code> (check <code>signal.throwIfAborted()</code> between pages); branch
        the catch on <code>e.name</code>.
      </Callout>

      <SolutionReveal
        language="js"
        code={`let currentExport = null;   // so the UI's Cancel button can reach it

async function exportReport(filters) {
  currentExport?.abort();                       // cancel a previous attempt
  const ctrl = new AbortController();
  currentExport = ctrl;
  const signal = AbortSignal.any([ctrl.signal, AbortSignal.timeout(15_000)]); // (2)

  try {
    const res = await fetch('/api/export?' + qs(filters), { signal });  // (1)
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();              // also aborts mid-download
    await postProcess(blob, { signal });        // (4) propagated
    download(blob);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return;                                   // (3) user cancelled — silent
    }
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      toast.error('Export timed out — please retry.');
      return;
    }
    toast.error('Export failed!');              // only REAL failures
  } finally {
    if (currentExport === ctrl) currentExport = null;
  }
}

async function postProcess(blob, { signal }) {
  for (const page of splitPages(blob)) {
    signal?.throwIfAborted();                   // (4) bail between units of work
    await renderPage(page, { signal });         // and pass it further down
  }
}

function cancelExport() { currentExport?.abort(); }  // wire to the Cancel button`}
      />
    </Stack>
  );
}
