import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A config-driven Accordion. The rigid items={[...]} prop means you can't put
// custom markup in a header, reorder freely, or add an icon without growing the
// config schema (and prop-drilling openIndex everywhere).
function Accordion({ items, openIndex, onToggle }) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>
          <button onClick={() => onToggle(i)}>{item.title}</button>
          {openIndex === i && <div>{item.content}</div>}
        </div>
      ))}
    </div>
  );
}

// usage is locked to the schema:
<Accordion
  items={[{ title: 'A', content: <p>...</p> }, { title: 'B', content: <p>...</p> }]}
  openIndex={open}
  onToggle={setOpen}
/>`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: convert the config-prop Accordion into compound components"
        description="The items array forces a fixed shape and leaks open-state wiring to the consumer. Rebuild it as <Accordion>/<Accordion.Item>/<Accordion.Header>/<Accordion.Panel> sharing state via context."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Hold the open id in <code>&lt;Accordion&gt;</code> and share it via context. Each{' '}
        <code>Accordion.Item</code> provides its own id (a nested context); the header toggles, the
        panel reads whether it's open. The consumer composes arbitrary JSX — no schema, no external
        open-state wiring.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`const AccordionCtx = createContext(null);   // { openId, setOpenId }
const ItemCtx = createContext(null);        // the current item's id

function Accordion({ children, defaultOpen = null }) {
  const [openId, setOpenId] = useState(defaultOpen);
  return <AccordionCtx.Provider value={{ openId, setOpenId }}>{children}</AccordionCtx.Provider>;
}

Accordion.Item = function Item({ id, children }) {
  return <ItemCtx.Provider value={id}><div className="item">{children}</div></ItemCtx.Provider>;
};

Accordion.Header = function Header({ children }) {
  const { openId, setOpenId } = useContext(AccordionCtx);
  const id = useContext(ItemCtx);
  return (
    <button aria-expanded={openId === id} onClick={() => setOpenId(openId === id ? null : id)}>
      {children}
    </button>
  );
};

Accordion.Panel = function Panel({ children }) {
  const { openId } = useContext(AccordionCtx);
  const id = useContext(ItemCtx);
  return openId === id ? <div className="panel">{children}</div> : null;
};

// usage — arbitrary markup, no config schema, no external open-state:
<Accordion defaultOpen="shipping">
  <Accordion.Item id="shipping">
    <Accordion.Header>🚚 Shipping <Badge>free</Badge></Accordion.Header>
    <Accordion.Panel><CustomShippingTable /></Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item id="returns">
    <Accordion.Header>Returns</Accordion.Header>
    <Accordion.Panel><p>30 days…</p></Accordion.Panel>
  </Accordion.Item>
</Accordion>

// Why it's better: consumers compose any header/panel content (icons, badges,
// tables) without extending a config schema; the open-state is shared implicitly
// through context (no prop drilling); and you can add Accordion.* sub-parts later
// without breaking the API.`}
      />
    </Stack>
  );
}
