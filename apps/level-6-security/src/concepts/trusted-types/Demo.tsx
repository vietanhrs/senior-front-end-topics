import { useMemo, useState } from 'react';
import { Badge, Button, Code, Group, Stack, Switch, Text, Textarea } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const DEFAULT_PAYLOAD = `<img src=x onerror="steal(document.cookie)"> <b>hello</b>`;

// Teaching-grade sanitizer (use DOMPurify in production). Strips scripts + on* handlers.
function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
}

// Branded type to simulate TrustedHTML when the real API is unavailable.
type Trustedish = { __trusted: true; value: string };

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [enforced, setEnforced] = useState(true);
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [rendered, setRendered] = useState('');

  const ttSupported = typeof window !== 'undefined' && 'trustedTypes' in window;

  // A real policy if the browser supports Trusted Types; otherwise a simulated one.
  const policy = useMemo(() => {
    if (ttSupported) {
      try {
        // Unique name avoids "policy already exists" on hot reload.
        return (window as unknown as { trustedTypes: { createPolicy: (n: string, r: unknown) => unknown } }).trustedTypes.createPolicy(
          `sfe-demo-${Math.random().toString(36).slice(2)}`,
          { createHTML: (s: string) => sanitize(s) },
        );
      } catch {
        return null;
      }
    }
    return null;
  }, [ttSupported]);

  function createHTML(input: string): Trustedish | unknown {
    if (policy) return (policy as { createHTML: (s: string) => unknown }).createHTML(input);
    return { __trusted: true, value: sanitize(input) } satisfies Trustedish;
  }

  // Simulated sink: under enforcement it REJECTS plain strings, mirroring
  // `require-trusted-types-for 'script'`.
  function assignToSink(value: unknown) {
    const isTrusted =
      (policy && typeof value === 'object') || (value as Trustedish)?.__trusted === true;
    if (enforced && typeof value === 'string') {
      log('TypeError: Failed to set innerHTML — this requires a TrustedHTML, not a string.', 'error');
      return;
    }
    const html = typeof value === 'string' ? value : ((value as Trustedish).value ?? String(value));
    setRendered(html);
    log(isTrusted ? 'Assigned TrustedHTML from policy (sanitized) ✔' : 'Assigned raw string (enforcement off ⚠)', isTrusted ? 'success' : 'macro');
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="The sink rejects raw strings under enforcement">
        With <code>require-trusted-types-for 'script'</code> on, assigning a plain string to{' '}
        <code>innerHTML</code> throws. Only a <code>TrustedHTML</code> produced by a policy is
        accepted — and the policy is where sanitization happens. Toggle enforcement and compare the
        two assignment paths. Trusted Types is {ttSupported ? 'supported here (real policy used)' : 'not supported here (policy simulated)'}.
      </Callout>

      <Group justify="space-between">
        <Switch label="require-trusted-types-for 'script' (enforce)" checked={enforced} onChange={(e) => setEnforced(e.currentTarget.checked)} />
        <Badge variant="light" color={ttSupported ? 'teal' : 'gray'}>
          window.trustedTypes: {ttSupported ? 'available' : 'unavailable'}
        </Badge>
      </Group>

      <DemoCard title="Attacker-controlled value reaching a DOM sink">
        <Textarea autosize minRows={2} value={payload} onChange={(e) => setPayload(e.currentTarget.value)} mb="md" />
        <Group>
          <Button color="red" onClick={() => assignToSink(payload)}>
            el.innerHTML = rawString
          </Button>
          <Button color="teal" onClick={() => assignToSink(createHTML(payload))}>
            el.innerHTML = policy.createHTML(payload)
          </Button>
          <Button variant="default" onClick={() => { setRendered(''); clear(); }}>
            Clear
          </Button>
        </Group>

        <Text size="sm" fw={600} mt="md" mb={4}>
          Rendered output (sanitized HTML shown as text, not executed):
        </Text>
        <Code block>{rendered || '(nothing assigned)'}</Code>
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Try both assignment paths with enforcement on and off." />
    </Stack>
  );
}
