import { Component, useState, type ErrorInfo, type ReactNode } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

class ErrorBoundary extends Component<
  { children: ReactNode; onError?: (msg: string) => void; fallback: (reset: () => void, error: Error) => ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(`${error.message} — at${info.componentStack?.split('\n')[1] ?? ''}`);
  }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) return this.props.fallback(this.reset, this.state.error);
    return this.props.children;
  }
}

// Throws DURING RENDER (the only thing a boundary catches) when explode is true.
function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error('Widget crashed while rendering!');
  return <Text size="sm" c="teal">✓ Widget rendered fine</Text>;
}

export function Demo() {
  const [explode, setExplode] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const [siblingClicks, setSiblingClicks] = useState(0);

  return (
    <Stack gap="md">
      <Callout kind="info" title="One widget crashes; the boundary contains it">
        The left widget throws <b>during render</b> when you press "Break". The error boundary catches
        it, logs the component stack, and shows a fallback with a <b>Reset</b> — while the sibling on
        the right keeps working. Without the boundary, this would blank the whole app.
      </Callout>

      <Group grow align="flex-start">
        <DemoCard title="Inside an ErrorBoundary">
          <Stack gap="xs">
            <ErrorBoundary
              onError={(msg) => setLog(msg)}
              fallback={(reset, error) => (
                <Stack gap={6}>
                  <Badge color="red" variant="light">caught: {error.message}</Badge>
                  <Button size="compact-xs" onClick={() => { setExplode(false); reset(); }}>Reset</Button>
                </Stack>
              )}
            >
              <Bomb explode={explode} />
            </ErrorBoundary>
            <Button size="compact-xs" color="red" variant="light" onClick={() => setExplode(true)} disabled={explode}>
              Break (throw in render)
            </Button>
          </Stack>
        </DemoCard>

        <DemoCard title="Sibling region (unaffected)">
          <Stack gap="xs">
            <Text size="sm">Still interactive while the other widget is down:</Text>
            <Button size="compact-xs" variant="light" onClick={() => setSiblingClicks((c) => c + 1)}>
              clicked {siblingClicks}×
            </Button>
          </Stack>
        </DemoCard>
      </Group>

      {log && (
        <Text size="xs" c="dimmed" ff="monospace">componentDidCatch → reported: {log}</Text>
      )}
      <Text size="sm" c="dimmed">
        Note: a boundary only catches <b>render/lifecycle</b> errors — a throw inside an{' '}
        <code>onClick</code> or a <code>setTimeout</code> would slip past it (use try/catch there).
      </Text>
    </Stack>
  );
}
