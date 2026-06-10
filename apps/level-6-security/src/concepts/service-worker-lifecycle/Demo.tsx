import { useState } from 'react';
import { Badge, Button, Group, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

// A deterministic SIMULATION of the SW lifecycle (no real SW needed), so the
// "stuck in waiting" trap and the skipWaiting fix are reproducible.
export function Demo() {
  const { logs, log, clear } = useLogger();
  const [controlling, setControlling] = useState(1); // version controlling the page
  const [waiting, setWaiting] = useState<number | null>(null);
  const [activeCache, setActiveCache] = useState('app-v1');
  const [skipWaiting, setSkipWaiting] = useState(false);
  const [next, setNext] = useState(2);

  function deploy() {
    const v = next;
    log(`Deploy v${v}: browser detects a byte-different sw.js → download → install`, 'macro');
    log(`v${v} install event (precache app-v${v})`, 'sync');
    if (skipWaiting) {
      // skipWaiting() → activate immediately + claim
      log(`v${v} calls self.skipWaiting() → activate now`, 'success');
      activate(v);
    } else {
      // old SW still controls the open tab → new SW waits
      setWaiting(v);
      log(`v${v} INSTALLED but → waiting (v${controlling} still controls this tab). A reload will NOT activate it.`, 'error');
    }
    setNext(v + 1);
  }

  function activate(v: number) {
    setControlling(v);
    setWaiting(null);
    log(`v${v} activate event → clients.claim() takes control of open pages`, 'success');
    // cache cleanup in activate
    setActiveCache(`app-v${v}`);
    log(`activate: deleted old caches, now serving app-v${v}`, 'micro');
  }

  function reload() {
    log(`page reload — still controlled by v${controlling}${waiting ? ` (v${waiting} stays in waiting!)` : ''}`, waiting ? 'error' : 'sync');
  }

  function closeAllTabs() {
    if (waiting == null) {
      log('no waiting worker; nothing to activate', 'sync');
      return;
    }
    log(`all tabs for the old SW closed → old v${controlling} released`, 'sync');
    activate(waiting);
  }

  function userSkip() {
    if (waiting == null) {
      log('no update available to apply', 'sync');
      return;
    }
    log(`user clicks "Reload to update" → postMessage(SKIP_WAITING) to v${waiting}`, 'sync');
    activate(waiting);
    log('controllerchange fired → page reloads onto the new version', 'success');
  }

  function reset() {
    setControlling(1); setWaiting(null); setActiveCache('app-v1'); setNext(2); clear();
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Reproduce the 'stuck in waiting' trap">
        With <b>skipWaiting off</b>: Deploy a new version → it gets stuck in <b>waiting</b>, and
        clicking Reload does NOT activate it (the classic "I deployed but users see old code" bug).
        Only closing all tabs — or an explicit update — activates it. Turn <b>skipWaiting on</b> and
        deploy to see it activate immediately (at the risk of version skew in open tabs).
      </Callout>

      <Group justify="space-between">
        <Switch
          label="sw.js calls self.skipWaiting() on install"
          checked={skipWaiting}
          onChange={(e) => setSkipWaiting(e.currentTarget.checked)}
        />
        <Group gap="xs">
          <Badge color="teal" variant="filled">controlling: v{controlling}</Badge>
          <Badge color={waiting ? 'orange' : 'gray'} variant={waiting ? 'filled' : 'light'}>
            {waiting ? `waiting: v${waiting}` : 'no waiting SW'}
          </Badge>
          <Badge variant="light">cache: {activeCache}</Badge>
        </Group>
      </Group>

      <DemoCard title="Lifecycle controls">
        <Group>
          <Button onClick={deploy}>Deploy v{next}</Button>
          <Button variant="default" onClick={reload}>Reload page</Button>
          <Button variant="default" onClick={closeAllTabs} disabled={waiting == null}>Close all tabs</Button>
          <Button variant="light" color="grape" onClick={userSkip} disabled={waiting == null}>
            "Reload to update" (skip waiting)
          </Button>
          <Button variant="subtle" onClick={reset}>Reset</Button>
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          Sequence to feel the trap (skipWaiting off): Deploy → Reload (still old!) → "Reload to
          update" (now new). The safe production pattern is exactly that last button: detect the
          waiting worker, prompt the user, then skip + reload on <code>controllerchange</code>.
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={200} empty="Deploy a version, then try Reload vs the update button." />
    </Stack>
  );
}
