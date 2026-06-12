import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface ThemeCtx {
  theme: 'light' | 'dark';
  toggle: () => void;
}
const ThemeContext = createContext<ThemeCtx | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  // memoized value → consumers don't re-render unless theme actually changes
  const value = useMemo<ThemeCtx>(
    () => ({ theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }),
    [theme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

// deeply nested — none of these layers forward a theme prop
function DeepLeaf() {
  const { theme } = useTheme();
  return (
    <div
      className="rounded-md border p-3"
      style={{
        background: theme === 'dark' ? '#1f2433' : '#fff',
        color: theme === 'dark' ? '#e8ecf5' : '#1f2433',
        transition: 'all .15s',
      }}
    >
      <Text size="sm">I'm 4 levels deep and read the theme directly via <code>useTheme()</code> — current: <b>{theme}</b></Text>
    </div>
  );
}
const Level3 = () => <DeepLeaf />;
const Level2 = () => <Level3 />;
const Level1 = () => <Level2 />;

function Toolbar() {
  const { theme, toggle } = useTheme();
  return (
    <Group>
      <Button size="compact-sm" onClick={toggle}>Toggle theme</Button>
      <Badge variant="light">{theme}</Badge>
    </Group>
  );
}

export function Demo() {
  return (
    <Stack gap="md">
      <Callout kind="info" title="Toggle at the top, consumed 4 levels down — no prop drilling">
        <code>ThemeProvider</code> holds the theme and shares a <b>memoized</b> value. The toolbar and
        a leaf nested through <code>Level1 → Level2 → Level3</code> both read it via{' '}
        <code>useTheme()</code> — none of the intermediate components pass a single theme prop.
      </Callout>

      <ThemeProvider>
        <DemoCard title="Subtree under one provider">
          <Stack>
            <Toolbar />
            <Level1 />
          </Stack>
        </DemoCard>
      </ThemeProvider>

      <Text size="sm" c="dimmed">
        The value is wrapped in <code>useMemo</code> so consumers re-render only when{' '}
        <code>theme</code> changes — not every time the provider re-renders. Calling{' '}
        <code>useTheme()</code> outside the provider throws a clear error.
      </Text>
    </Stack>
  );
}
