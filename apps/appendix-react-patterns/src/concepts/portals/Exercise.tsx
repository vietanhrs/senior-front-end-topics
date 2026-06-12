import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A dropdown rendered inline inside a scrolling, transformed card. It gets clipped
// by overflow, sits behind other UI because of a stacking context, and has no
// keyboard/focus handling.
function Card() {
  return (
    <div style={{ overflow: 'auto', transform: 'translateZ(0)', position: 'relative' }}>
      <Menu />
    </div>
  );
}

function Menu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen((o) => !o)}>Options ▾</button>
      {open && (
        // rendered here in the DOM → clipped by the card's overflow, trapped in its
        // stacking context (transform), z-index can't save it
        <ul style={{ position: 'absolute', zIndex: 9999 }}>
          <li>Edit</li><li>Delete</li>
        </ul>
      )}
    </>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: portal the dropdown out and make it usable"
        description="The menu is clipped by the card's overflow and trapped behind it by the transform's stacking context — z-index won't help. Render it through a portal to document.body, and add Escape + outside-click to close."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>createPortal</code> the menu into <code>document.body</code> so it escapes the card's{' '}
        <code>overflow</code> and stacking context. Position it from the trigger's{' '}
        <code>getBoundingClientRect()</code>. Close on <code>Escape</code> and on outside click —
        remembering portal content is <i>outside</i> the trigger in the DOM.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { createPortal } from 'react-dom';

function Menu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const openMenu = () => {
    const r = triggerRef.current.getBoundingClientRect();   // anchor to the trigger
    setPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => {
      // outside-click: the menu is in a portal, so check BOTH it and the trigger
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} aria-haspopup="menu" aria-expanded={open} onClick={() => (open ? setOpen(false) : openMenu())}>
        Options ▾
      </button>
      {open &&
        createPortal(
          <ul
            ref={menuRef}
            role="menu"
            style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 1000 }}
          >
            <li role="menuitem">Edit</li>
            <li role="menuitem">Delete</li>
          </ul>,
          document.body,    // escapes the card's overflow + transform stacking context
        )}
    </>
  );
}

// Why it's fixed: rendering into document.body frees the menu from the card's
// overflow clipping and its transform-created stacking context, so it shows above
// everything (no z-index hacks). It's positioned from the trigger's rect, closes on
// Escape, and the outside-click check accounts for the menu living in a portal
// (outside the trigger in the DOM). For production, add focus management or use a
// library / the <dialog> popover APIs.`}
      />
    </Stack>
  );
}
