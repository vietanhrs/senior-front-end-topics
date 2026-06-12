import { useMemo, useState } from 'react';
import { Badge, Group, SegmentedControl, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const VERSIONS = ['17.0.2', '18.2.0', '18.3.1', '19.0.0'];
const REACT_KB = 130; // react + react-dom, rough

interface Result {
  copies: number;
  resolved: string | null;
  kb: number;
  status: 'ok' | 'risky' | 'error' | 'broken';
  message: string;
}

function major(v: string) {
  return Number(v.split('.')[0]);
}

function negotiate(host: string, a: string, b: string, singleton: boolean, strict: boolean): Result {
  const all = [host, a, b];
  if (!singleton) {
    const distinct = new Set(all).size;
    return {
      copies: distinct,
      resolved: null,
      kb: distinct * REACT_KB,
      status: 'broken',
      message: `${distinct} separate React instances loaded → "Invalid hook call", dead Context, duplicated reconcilers. Add singleton: true.`,
    };
  }
  // singleton: one instance, highest version wins — but check major compatibility
  const majors = new Set(all.map(major));
  const highest = [...all].sort((x, y) => (x < y ? 1 : -1))[0];
  if (majors.size > 1) {
    if (strict) {
      return {
        copies: 0,
        resolved: null,
        kb: 0,
        status: 'error',
        message: `strictVersion error: a remote requires React ${[...majors].sort().map((m) => m + '.x').join(' / ')}; no single version satisfies all. Build fails.`,
      };
    }
    return {
      copies: 1,
      resolved: highest,
      kb: REACT_KB,
      status: 'risky',
      message: `One instance (v${highest}) loaded, but a consumer built for React ${Math.min(...majors)}.x runs against ${major(highest)}.x — API skew can break it at runtime. Align majors.`,
    };
  }
  return {
    copies: 1,
    resolved: highest,
    kb: REACT_KB,
    status: 'ok',
    message: `Single shared instance: React ${highest} satisfies every requiredVersion. Hooks + Context work, ${REACT_KB}KB once.`,
  };
}

const STATUS_COLOR = { ok: 'teal', risky: 'orange', error: 'red', broken: 'red' } as const;

export function Demo() {
  const [host, setHost] = useState('18.2.0');
  const [a, setA] = useState('18.3.1');
  const [b, setB] = useState('18.2.0');
  const [singleton, setSingleton] = useState(true);
  const [strict, setStrict] = useState(false);

  const result = useMemo(() => negotiate(host, a, b, singleton, strict), [host, a, b, singleton, strict]);

  const picker = (label: string, value: string, set: (v: string) => void) => (
    <div>
      <Text size="sm" fw={500} mb={4}>{label}</Text>
      <SegmentedControl size="xs" fullWidth value={value} onChange={set} data={VERSIONS} />
    </div>
  );

  return (
    <Stack gap="md">
      <Callout kind="info" title="Negotiate the shared scope — and see when React breaks">
        Set the React version each app (host + two remotes) was built against, and the{' '}
        <code>shared</code> options. The runtime negotiates a single version when{' '}
        <code>singleton</code> is on — but a major mismatch or a missing singleton means multiple
        React copies (broken hooks) or a hard version error.
      </Callout>

      <Stack gap="xs">
        {picker('host (shell) react', host, setHost)}
        {picker('remote: catalog react', a, setA)}
        {picker('remote: recs react', b, setB)}
      </Stack>

      <Group>
        <Switch label="shared singleton: true" checked={singleton} onChange={(e) => setSingleton(e.currentTarget.checked)} />
        <Switch label="strictVersion" checked={strict} onChange={(e) => setStrict(e.currentTarget.checked)} disabled={!singleton} />
      </Group>

      <DemoCard title="Resolved shared scope">
        <Stack gap="sm">
          <Group>
            <Badge variant="light" color={STATUS_COLOR[result.status]} size="lg">
              {result.status === 'ok' ? '✓ works' : result.status === 'risky' ? '⚠ risky' : result.status === 'error' ? '✕ build error' : '✕ broken at runtime'}
            </Badge>
            <Badge variant="light">React copies loaded: {result.copies}</Badge>
            {result.resolved && <Badge variant="light" color="indigo">resolved: v{result.resolved}</Badge>}
            <Badge variant="light" color={result.kb > REACT_KB ? 'red' : 'gray'}>~{result.kb}KB</Badge>
          </Group>
          <Text size="sm" c={result.status === 'ok' ? undefined : STATUS_COLOR[result.status]}>{result.message}</Text>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
