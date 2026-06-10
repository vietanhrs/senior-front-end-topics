import { useState } from 'react';
import { Badge, Button, Code, Group, Stack, Switch, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const PROBE_KEY = 'pollutedByDemo'; // namespaced; we clean it up immediately

// ❌ Vulnerable: walks the path creating intermediate objects, no key filtering.
function setByPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
// ✔ Safe: reject dangerous keys.
function setByPathSafe(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  for (const k of keys) if (FORBIDDEN.has(k)) throw new Error(`blocked key: ${k}`);
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}

export function Demo() {
  const { logs, log } = useLogger();
  const [safe, setSafe] = useState(false);
  const [path, setPath] = useState(`__proto__.${PROBE_KEY}`);
  const [value, setValue] = useState('pwned');
  const [polluted, setPolluted] = useState(false);

  function run() {
    // Probe BEFORE: a brand-new empty object.
    const before = ({} as Record<string, unknown>)[PROBE_KEY];
    log(`before: ({}).${PROBE_KEY} = ${JSON.stringify(before)}`, 'sync');

    const target: Record<string, unknown> = {}; // attacker writes into this
    try {
      (safe ? setByPathSafe : setByPath)(target, path, value);
      log(`${safe ? 'setByPathSafe' : 'setByPath'}(target, "${path}", "${value}") ran`, 'macro');
    } catch (e) {
      log(`blocked: ${(e as Error).message}`, 'success');
    }

    try {
      // Probe AFTER on a DIFFERENT fresh object — proves the shared prototype changed.
      const probe = ({} as Record<string, unknown>)[PROBE_KEY];
      const isPolluted = probe !== undefined;
      setPolluted(isPolluted);
      log(
        `after:  ({}).${PROBE_KEY} = ${JSON.stringify(probe)}  ${isPolluted ? '← Object.prototype POLLUTED (every object inherits it)' : '← clean'}`,
        isPolluted ? 'error' : 'success',
      );
      if (isPolluted) {
        // Gadget illustration: an auth check on an empty options object.
        const opts: Record<string, unknown> = {};
        log(`gadget: function hasAccess(opts){return !!opts.${PROBE_KEY}} → ${!!opts[PROBE_KEY]} (opts is {} !)`, 'error');
      }
    } finally {
      // CLEAN UP immediately so the rest of the app is unaffected.
      delete (Object.prototype as Record<string, unknown>)[PROBE_KEY];
    }
  }

  return (
    <Stack gap="md">
      <Callout kind="warning" title="Real pollution, immediately cleaned up">
        This performs an actual <code>Object.prototype</code> write with a namespaced key
        (<Code>{PROBE_KEY}</Code>) and deletes it synchronously right after, so the workbook isn't
        affected. The "after" probe reads a <b>different, brand-new</b> <code>{'{}'}</code> to prove
        the shared prototype — not just the target — was mutated.
      </Callout>

      <Group justify="space-between">
        <Switch
          label={safe ? 'Using setByPathSafe (rejects __proto__/constructor/prototype)' : 'Using vulnerable setByPath'}
          checked={safe}
          onChange={(e) => setSafe(e.currentTarget.checked)}
        />
        <Badge color={polluted ? 'red' : 'teal'} variant="filled">
          {polluted ? 'prototype was polluted' : 'prototype clean'}
        </Badge>
      </Group>

      <DemoCard
        title="Path + value (attacker-controlled)"
        right={
          <Button size="xs" onClick={run}>
            Run merge
          </Button>
        }
      >
        <Group grow>
          <TextInput label="path" value={path} onChange={(e) => setPath(e.currentTarget.value)} styles={{ input: { fontFamily: 'monospace' } }} />
          <TextInput label="value" value={value} onChange={(e) => setValue(e.currentTarget.value)} />
        </Group>
        <Text size="xs" c="dimmed" mt="xs">
          Try the vulnerable mode with <Code>__proto__.{PROBE_KEY}</Code>, then flip to safe mode and
          run the same payload.
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={190} empty="Run the merge to see before/after prototype probes." />
    </Stack>
  );
}
