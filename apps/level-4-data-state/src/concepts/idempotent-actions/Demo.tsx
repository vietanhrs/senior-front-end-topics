import { useRef, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

// Simulated server: dedupes by Idempotency-Key.
function makeServer() {
  const seen = new Map<string, number>(); // key -> chargeId
  let charges = 0;
  return {
    charge(key?: string): Promise<{ chargeId: number; deduped: boolean }> {
      return new Promise((resolve) =>
        setTimeout(() => {
          if (key && seen.has(key)) {
            resolve({ chargeId: seen.get(key)!, deduped: true }); // repeat → original result, no new charge
          } else {
            charges += 1;
            if (key) seen.set(key, charges);
            resolve({ chargeId: charges, deduped: false });
          }
        }, 500),
      );
    },
    get total() {
      return charges;
    },
  };
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const serverRef = useRef(makeServer());
  const [mode, setMode] = useState<'naive' | 'idempotent'>('naive');
  const [, force] = useState(0);
  // One key per intended payment; reused across retries/double-clicks of THAT payment.
  const keyRef = useRef(crypto.randomUUID());

  function send(label: string) {
    const key = mode === 'idempotent' ? keyRef.current : undefined;
    log(`${label}: POST /charge ${key ? `(Idempotency-Key: ${key.slice(0, 8)}…)` : '(no key)'}`, 'macro');
    serverRef.current.charge(key).then((r) => {
      log(
        r.deduped
          ? `→ deduped: returned existing charge #${r.chargeId}, NO new charge`
          : `→ created charge #${r.chargeId}`,
        r.deduped ? 'success' : mode === 'naive' ? 'error' : 'sync',
      );
      force((x) => x + 1);
    });
  }

  function doubleClick() {
    log('User double-clicks (2 rapid requests for the SAME payment)…', 'sync');
    send('click 1');
    send('click 2');
  }

  function newPayment() {
    keyRef.current = crypto.randomUUID(); // a genuinely new logical operation gets a new key
    log('Started a new payment (new idempotency key).', 'sync');
    force((x) => x + 1);
  }

  function reset() {
    serverRef.current = makeServer();
    keyRef.current = crypto.randomUUID();
    clear();
    force((x) => x + 1);
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Double-click a payment in each mode">
        "Double-click" fires two rapid requests for the <i>same</i> payment. In <b>naive</b> mode
        (no key) the server creates <b>two charges</b>. In <b>idempotent</b> mode both requests
        carry the same Idempotency-Key, so the server dedupes and there's exactly <b>one</b> charge —
        which is also what protects you against lost-response retries.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Naive (no idempotency key)', value: 'naive' },
          { label: 'Idempotency key per payment', value: 'idempotent' },
        ]}
      />

      <DemoCard
        title="Charge the customer $20"
        right={
          <Badge size="lg" color={serverRef.current.total > 1 ? 'red' : 'teal'} variant="filled">
            charges on server: {serverRef.current.total}
          </Badge>
        }
      >
        <Group>
          <Button color="red" onClick={doubleClick}>
            Double-click "Pay"
          </Button>
          <Button variant="default" onClick={() => send('single click')}>
            Pay once
          </Button>
          <Button variant="light" onClick={newPayment}>
            New payment (rotate key)
          </Button>
          <Button variant="subtle" onClick={reset}>
            Reset server
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          Note: disabling the button on submit would stop the double-click here — but only an
          idempotency key also protects against a retry after a lost response (where the charge
          already happened). Use both.
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Try double-clicking 'Pay' in each mode." />
    </Stack>
  );
}
