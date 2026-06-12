import { createContext, useContext, useState, type ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface TabsCtxValue {
  value: string;
  setValue: (v: string) => void;
}
const TabsCtx = createContext<TabsCtxValue | null>(null);
const useTabs = () => {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
};

function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
}
function TabsList({ children }: { children: ReactNode }) {
  return <div role="tablist" style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--mantine-color-default-border)' }}>{children}</div>;
}
function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { value: active, setValue } = useTabs();
  const selected = active === value;
  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={() => setValue(value)}
      style={{
        padding: '6px 12px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontWeight: selected ? 700 : 400,
        borderBottom: selected ? '2px solid var(--mantine-color-indigo-6)' : '2px solid transparent',
        color: selected ? 'var(--mantine-color-indigo-6)' : 'inherit',
      }}
    >
      {children}
    </button>
  );
}
function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { value: active } = useTabs();
  return active === value ? <div role="tabpanel" style={{ paddingTop: 12 }}>{children}</div> : null;
}
Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export function Demo() {
  return (
    <Stack gap="md">
      <Callout kind="info" title="Compose the pieces — state is shared implicitly via context">
        This <code>&lt;Tabs&gt;</code> is a real compound component. You arrange{' '}
        <code>Tabs.List</code>/<code>Tabs.Tab</code>/<code>Tabs.Panel</code> however you like; the
        active tab lives in <code>&lt;Tabs&gt;</code> and flows through context — no{' '}
        <code>activeTab</code>/<code>onChange</code> wiring between them.
      </Callout>

      <DemoCard title="Live compound component">
        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="api">API</Tabs.Tab>
            <Tabs.Tab value="examples">Examples</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="overview"><Text size="sm">The parent holds the active value; tabs and panels read it from context.</Text></Tabs.Panel>
          <Tabs.Panel value="api"><Text size="sm">Add a <code>Tabs.Badge</code> or reorder freely — the public API doesn't change.</Text></Tabs.Panel>
          <Tabs.Panel value="examples"><Text size="sm">Markup reads like the UI. No prop drilling, any nesting depth works.</Text></Tabs.Panel>
        </Tabs>
      </DemoCard>

      <Text size="sm" c="dimmed">
        Using <code>Tabs.Tab</code> outside <code>&lt;Tabs&gt;</code> throws a clear error (the context
        guard) — a small but important part of the pattern.
      </Text>
    </Stack>
  );
}
