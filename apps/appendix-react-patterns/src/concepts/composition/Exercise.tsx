import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A Modal configured entirely through props. It already has 12 of them and still
// can't render a custom header badge or a third footer button without adding more.
function Modal({
  open, title, showCloseButton, headerIcon, bodyText, bodyHtml,
  showFooter, primaryLabel, onPrimary, secondaryLabel, onSecondary, danger,
}) {
  if (!open) return null;
  return (
    <div className="modal">
      <header>
        {headerIcon && <Icon name={headerIcon} />}
        <h3>{title}</h3>
        {showCloseButton && <button>×</button>}
      </header>
      <div>{bodyHtml ? <div dangerouslySetInnerHTML={{ __html: bodyHtml }} /> : <p>{bodyText}</p>}</div>
      {showFooter && (
        <footer>
          {secondaryLabel && <button onClick={onSecondary}>{secondaryLabel}</button>}
          <button className={danger ? 'danger' : ''} onClick={onPrimary}>{primaryLabel}</button>
        </footer>
      )}
    </div>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: replace the prop explosion with composition"
        description="This Modal can't express arbitrary content and grows a prop for every need (including a dangerouslySetInnerHTML escape hatch). Refactor to slots/children so consumers pass real JSX, then specialize via wrapping."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Keep <b>behavior</b> props (<code>open</code>, <code>onClose</code>) but turn <b>content</b>
        into slots: <code>header</code>/<code>footer</code> as <code>ReactNode</code> and the body as{' '}
        <code>children</code>. Build <code>ConfirmModal</code> by <i>wrapping</i> <code>Modal</code>{' '}
        with fixed footer buttons — no inheritance, no <code>dangerouslySetInnerHTML</code>.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// Structure + behavior only; content comes from the consumer as JSX.
function Modal({ open, onClose, header, footer, children }) {
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <header>
        {header}
        <button aria-label="Close" onClick={onClose}>×</button>
      </header>
      <div className="body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  );
}

// Specialize by COMPOSITION (the React replacement for subclassing):
function ConfirmModal({ open, onClose, onConfirm, danger, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      header={<h3>Confirm</h3>}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className={danger ? 'danger' : ''} onClick={onConfirm}>Confirm</button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

// usage — arbitrary content, no escape hatches, no flag soup:
<Modal open={open} onClose={close} header={<Group><Icon name="bell" /><h3>Updates</h3><Badge>new</Badge></Group>}>
  <CustomReleaseNotes />
</Modal>

<ConfirmModal open={open} onClose={close} onConfirm={remove} danger>
  <p>Delete this item?</p>
</ConfirmModal>

// Why it's better: the prop surface shrinks to behavior (open/onClose) + slots;
// consumers render any header/footer/body markup (badges, icons, custom tables)
// without new props or dangerouslySetInnerHTML; and specializations are just thin
// wrappers — composition instead of an unbounded config schema or inheritance.`}
      />
    </Stack>
  );
}
