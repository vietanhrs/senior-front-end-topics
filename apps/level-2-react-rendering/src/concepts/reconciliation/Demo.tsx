import { useEffect, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

/** A small stateful component whose mount/unmount we log, so we can SEE when
 *  reconciliation preserves vs recreates the instance. */
function Counter({ label, onLog }: { label: string; onLog: (m: string, tone?: 'success' | 'error') => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    onLog(`MOUNT ${label} (state reset to 0)`, 'error');
    return () => onLog(`UNMOUNT ${label}`, 'success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Group gap="xs">
      <Badge variant="light">{label}</Badge>
      <Button size="xs" onClick={() => setCount((c) => c + 1)}>
        count: {count}
      </Button>
      <TextInput size="xs" placeholder="uncontrolled note…" />
    </Group>
  );
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [wide, setWide] = useState(false);
  const [variant, setVariant] = useState<'same-parent' | 'diff-parent' | 'keyed'>('same-parent');

  return (
    <Stack gap="md">
      <Callout kind="info" title="How to observe">
        Increment the counter and type a note, then flip the switch. Watch the console: in some
        modes the instance is <b>preserved</b> (state stays), in others it <b>remounts</b> (state
        resets to 0, note cleared). The only difference is the tree structure / key.
      </Callout>

      <SegmentedControl
        value={variant}
        onChange={(v) => {
          setVariant(v as typeof variant);
          clear();
        }}
        fullWidth
        data={[
          { label: 'Same parent (✔ preserved)', value: 'same-parent' },
          { label: 'Different parent (✗ remount)', value: 'diff-parent' },
          { label: 'key={wide} (✗ intentional reset)', value: 'keyed' },
        ]}
      />

      <DemoCard
        title="Toggle the layout"
        right={
          <Switch
            label={wide ? 'wide' : 'narrow'}
            checked={wide}
            onChange={(e) => setWide(e.currentTarget.checked)}
          />
        }
      >
        <div className={wide ? 'rounded-lg border p-4' : 'rounded-lg border border-dashed p-2'}>
          {variant === 'same-parent' && (
            // Same type & position; only the outer className changes -> state preserved.
            <div>
              <Counter label="A" onLog={log} />
            </div>
          )}

          {variant === 'diff-parent' &&
            (wide ? (
              <div className="wide">
                <Counter label="A" onLog={log} />
              </div>
            ) : (
              <section className="narrow">
                <Counter label="A" onLog={log} />
              </section>
            ))}

          {variant === 'keyed' && <Counter key={String(wide)} label="A" onLog={log} />}
        </div>
        <Text size="xs" c="dimmed" mt="sm">
          {variant === 'same-parent' && 'Same type at the same position → React keeps the instance.'}
          {variant === 'diff-parent' && 'div vs section = different position → unmount + mount.'}
          {variant === 'keyed' && 'Changing key forces a fresh instance every toggle.'}
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={160} empty="Mount/unmount events will appear here." />
    </Stack>
  );
}
