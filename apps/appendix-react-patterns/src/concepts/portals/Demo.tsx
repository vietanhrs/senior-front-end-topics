import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--mantine-color-body)', borderRadius: 12, padding: 20, minWidth: 280, boxShadow: '0 10px 40px rgba(0,0,0,.3)' }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Demo() {
  const { logs, log } = useLogger();
  const [open, setOpen] = useState(false);
  const [showPopover, setShowPopover] = useState<'inline' | 'portal' | null>(null);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Render outside the parent's DOM — escape clipping & stacking">
        The popover demo shows how an ancestor's <code>overflow: hidden</code> clips an inline child
        but not a portaled one. The modal is rendered into <code>document.body</code> via{' '}
        <code>createPortal</code>, so it overlays everything regardless of where it's declared.
      </Callout>

      <DemoCard title="overflow:hidden parent — inline gets clipped, portal escapes">
        {/* This box clips its overflow on purpose */}
        <div style={{ height: 90, overflow: 'hidden', border: '1px dashed var(--mantine-color-default-border)', borderRadius: 8, padding: 12, position: 'relative' }}>
          <Group>
            <Button size="compact-xs" variant="light" onClick={() => setShowPopover('inline')}>show inline popover</Button>
            <Button size="compact-xs" onClick={() => setShowPopover('portal')}>show portal popover</Button>
            <Text size="xs" c="dimmed">(this box has overflow:hidden)</Text>
          </Group>

          {showPopover === 'inline' && (
            <div style={{ position: 'absolute', top: 50, left: 12, width: 240, padding: 10, borderRadius: 8, background: 'var(--mantine-color-indigo-light)' }}>
              <Text size="xs">Inline popover — the bottom is clipped by the parent's overflow:hidden ✂</Text>
            </div>
          )}
        </div>
      </DemoCard>

      {showPopover === 'portal' &&
        createPortal(
          <div style={{ position: 'fixed', bottom: 24, right: 24, width: 260, padding: 12, borderRadius: 10, background: 'var(--mantine-color-teal-light)', zIndex: 1000, boxShadow: '0 8px 30px rgba(0,0,0,.25)' }}>
            <Group justify="space-between">
              <Text size="sm" fw={600}>Portal popover</Text>
              <Button size="compact-xs" variant="subtle" onClick={() => setShowPopover(null)}>×</Button>
            </Group>
            <Text size="xs" mt={4}>Rendered into document.body — not clipped by the overflow:hidden parent.</Text>
          </div>,
          document.body,
        )}

      <Group>
        <Button onClick={() => { setShowPopover(null); setOpen(true); }}>Open modal (portal)</Button>
      </Group>

      <Modal open={open} onClose={() => { setOpen(false); log('modal closed (Escape or backdrop)', 'sync'); }}>
        <Stack gap="sm">
          <Text fw={600}>Portaled modal</Text>
          <Text size="sm">In document.body, escaping all ancestor overflow/z-index. Esc or click the backdrop to close.</Text>
          <Button
            size="compact-sm"
            onClick={() => {
              log('button inside the portal clicked — event bubbles through the REACT tree to here', 'macro');
            }}
          >
            click me (logs via React-tree bubbling)
          </Button>
          <Button size="compact-xs" variant="subtle" onClick={() => setOpen(false)}>Close</Button>
        </Stack>
      </Modal>

      <LogConsole logs={logs} height={120} empty="Open the modal and click inside — note events bubble through the React tree." />
      <Text size="sm" c="dimmed">
        A portal moves the DOM position, not the React position — so handlers on this Demo still
        receive events from inside the modal. Production overlays also need focus trap, scroll lock,
        and <code>aria-modal</code> (use <code>&lt;dialog&gt;</code> or a library).
      </Text>
    </Stack>
  );
}
