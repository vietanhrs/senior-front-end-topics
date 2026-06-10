import { useMemo, useState } from 'react';
import { Alert, Badge, Group, Select, Stack, Table, Text } from '@mantine/core';
import { IconCookie } from '@tabler/icons-react';
import { Callout, DemoCard } from '@sfe/workbook';

type Mode = 'Strict' | 'Lax' | 'None';

interface Scenario {
  id: string;
  label: string;
  crossSite: boolean;
  topLevelGet: boolean;
  note?: string;
}

const SCENARIOS: Scenario[] = [
  { id: 'same-fetch', label: 'app.example.com → fetch api.example.com (same site, cross-origin)', crossSite: false, topLevelGet: false, note: 'Same SITE (example.com) — SameSite never blocks; CORS still applies.' },
  { id: 'link', label: 'Click a link on news.com → example.com (top-level GET)', crossSite: true, topLevelGet: true },
  { id: 'post', label: 'evil.com auto-submits <form method=POST> to example.com', crossSite: true, topLevelGet: false },
  { id: 'img', label: 'evil.com embeds <img src="example.com/transfer">', crossSite: true, topLevelGet: false },
  { id: 'iframe', label: 'partner.com iframes a widget from example.com', crossSite: true, topLevelGet: false },
  { id: 'pages', label: 'foo.github.io → fetch bar.github.io', crossSite: true, topLevelGet: false, note: 'github.io is on the Public Suffix List → DIFFERENT sites!' },
];

function isSent(mode: Mode, s: Scenario): boolean {
  if (!s.crossSite) return true;
  if (mode === 'None') return true; // (requires Secure)
  if (mode === 'Strict') return false;
  return s.topLevelGet; // Lax: only top-level GET navigations
}

export function Demo() {
  const [mode, setMode] = useState<Mode>('Lax');
  const rows = useMemo(() => SCENARIOS.map((s) => ({ ...s, sent: isSent(mode, s) })), [mode]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="The full decision table, live">
        Pick a SameSite mode and see which requests carry the session cookie. Pay attention to the
        two tricky rows: same-site-but-cross-origin (SameSite doesn't block it) and the github.io
        pair (Public Suffix List makes sibling subdomains <i>different</i> sites).
      </Callout>

      <Group>
        <Select
          label="Set-Cookie: session=…; SameSite="
          value={mode}
          onChange={(v) => setMode((v as Mode) ?? 'Lax')}
          data={['Strict', 'Lax', 'None']}
          w={220}
        />
        {mode === 'None' && (
          <Badge color="orange" variant="light" mt={24}>
            None requires Secure (HTTPS) — and faces 3rd-party-cookie phase-outs in iframes
          </Badge>
        )}
      </Group>

      <DemoCard title="Will the cookie be attached?">
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Request</Table.Th>
              <Table.Th w={140}>Cookie sent?</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Text size="sm">{r.label}</Text>
                  {r.note && (
                    <Text size="xs" c="dimmed">
                      {r.note}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Badge color={r.sent ? (r.crossSite ? 'orange' : 'teal') : 'gray'} variant={r.sent ? 'filled' : 'light'} leftSection={<IconCookie size={12} />}>
                    {r.sent ? 'sent' : 'withheld'}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </DemoCard>

      {mode === 'Strict' && (
        <Alert color="yellow" variant="light" title="The Strict UX trap">
          Notice the link-click row: a user following a link from another site arrives WITHOUT their
          session cookie — they look logged out until they navigate again. This is why session
          cookies are usually Lax, with Strict reserved for a separate high-security token.
        </Alert>
      )}
      {mode === 'Lax' && (
        <Alert color="teal" variant="light" title="Why Lax is the default">
          Cross-site POST/img/iframe carry no cookie (classic CSRF dies), but top-level GET links
          keep working. Pair with CSRF tokens for state-changing endpoints — defense in depth.
        </Alert>
      )}
      {mode === 'None' && (
        <Alert color="orange" variant="light" title="None = opt back into cross-site">
          Required for embedded widgets / cross-site SSO with credentials. But you've re-opened the
          CSRF surface (use tokens + Origin checks!) and depend on third-party cookies surviving the
          browser's privacy policies (see CHIPS / Storage Access API).
        </Alert>
      )}
    </Stack>
  );
}
