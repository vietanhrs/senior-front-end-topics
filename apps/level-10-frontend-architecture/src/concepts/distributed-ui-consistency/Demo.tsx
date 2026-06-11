import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const CHANNEL = 'sfe-l10-consistency';
const supported = typeof BroadcastChannel !== 'undefined';

interface Msg {
  value: number;
  version: number;
  from: string;
}

function TabPanel({ name, color }: { name: string; color: string }) {
  const [value, setValue] = useState(0);
  const [version, setVersion] = useState(0);
  const [connected, setConnected] = useState(true);
  const [lastDropped, setLastDropped] = useState<number | null>(null);
  const chanRef = useRef<BroadcastChannel | null>(null);
  const connectedRef = useRef(true);
  const stateRef = useRef({ value: 0, version: 0 });

  useEffect(() => {
    stateRef.current = { value, version };
  }, [value, version]);
  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    if (!supported) return;
    const ch = new BroadcastChannel(CHANNEL);
    chanRef.current = ch;
    ch.onmessage = (e: MessageEvent<Msg>) => {
      if (!connectedRef.current) return; // partitioned: ignore inbound
      const msg = e.data;
      // monotonic reads: only accept a STRICTLY newer version; drop stale/out-of-order
      if (msg.version > stateRef.current.version) {
        setValue(msg.value);
        setVersion(msg.version);
      } else {
        setLastDropped(msg.version);
      }
    };
    return () => ch.close();
  }, []);

  const bump = () => {
    const nextVersion = version + 1;
    const nextValue = value + 1;
    setValue(nextValue);
    setVersion(nextVersion);
    if (connected) chanRef.current?.postMessage({ value: nextValue, version: nextVersion, from: name } as Msg);
  };

  const resync = () => {
    // on reconnect, broadcast current state so peers converge to the newest version
    chanRef.current?.postMessage({ value, version, from: name } as Msg);
  };

  return (
    <DemoCard title={`🗔 ${name}`}>
      <Stack gap="xs">
        <Group>
          <Badge size="lg" variant="light" color={color}>value {value}</Badge>
          <Badge size="sm" variant="outline">v{version}</Badge>
          {lastDropped !== null && <Badge size="xs" color="gray" variant="light">dropped stale v{lastDropped}</Badge>}
        </Group>
        <Group>
          <Button size="xs" color={color} onClick={bump}>increment</Button>
          <Switch size="xs" label={connected ? 'synced' : 'partitioned'} checked={connected} onChange={(e) => { setConnected(e.currentTarget.checked); if (e.currentTarget.checked) resync(); }} />
        </Group>
      </Stack>
    </DemoCard>
  );
}

export function Demo() {
  return (
    <Stack gap="md">
      <Callout kind="info" title="Two tabs, one origin — real cross-tab consistency">
        Each panel is a separate <code>BroadcastChannel</code> instance (like two browser tabs).
        Incrementing one broadcasts to the other → <b>eventual consistency</b>. Updates carry a{' '}
        <b>version</b>, and each tab only accepts a strictly-newer one (<b>monotonic reads</b> — stale/
        out-of-order messages are dropped). Flip a tab to <b>partitioned</b>, diverge them, then
        reconnect to watch them converge.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="BroadcastChannel unavailable">
          This engine has no <code>BroadcastChannel</code>; cross-tab sync can't run here. The models
          in the theory still apply.
        </Callout>
      )}

      <Group grow align="flex-start">
        <TabPanel name="Tab A" color="indigo" />
        <TabPanel name="Tab B" color="teal" />
      </Group>

      <Text size="sm" c="dimmed">
        Open this page in a second browser tab too — the channel is origin-wide, so a real third tab
        joins the same sync. Concurrent increments while partitioned can land on the same version;
        that tie is exactly where you'd reach for a CRDT or version vector (previous concept).
      </Text>
    </Stack>
  );
}
