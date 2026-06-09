import { useMemo, useState } from 'react';
import { Alert, Badge, Chip, Code, Group, Select, Stack, Switch, Text } from '@mantine/core';
import { IconCheck, IconExclamationCircle } from '@tabler/icons-react';
import { Callout, DemoCard } from '@sfe/workbook';
import { evaluatePreflight } from './preflight';

const CONTENT_TYPES = [
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'application/json',
];
const HEADER_CHOICES = ['Authorization', 'X-Token', 'Content-Type', 'Accept'];

export function Demo() {
  const [method, setMethod] = useState('GET');
  const [contentType, setContentType] = useState('text/plain');
  const [customHeaders, setCustomHeaders] = useState<string[]>([]);
  const [credentials, setCredentials] = useState(false);

  const verdict = useMemo(
    () => evaluatePreflight({ method, contentType, customHeaders, credentials }),
    [method, contentType, customHeaders, credentials],
  );

  const origin = 'https://app.example';

  return (
    <Stack gap="md">
      <Callout kind="info" title="Preflight decision simulator">
        Tweak the request below and see whether the browser must send an <code>OPTIONS</code>
        first, with the reasons and a simulated wire trace.
      </Callout>

      <DemoCard title="Configure a cross-origin request">
        <Stack gap="md">
          <Group grow>
            <Select
              label="Method"
              value={method}
              onChange={(v) => setMethod(v ?? 'GET')}
              data={['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE']}
            />
            <Select
              label="Content-Type"
              value={contentType}
              onChange={(v) => setContentType(v ?? 'text/plain')}
              data={CONTENT_TYPES}
            />
          </Group>

          <div>
            <Text size="sm" fw={500} mb={4}>
              Author-set request headers
            </Text>
            <Chip.Group multiple value={customHeaders} onChange={setCustomHeaders}>
              <Group gap="xs">
                {HEADER_CHOICES.map((h) => (
                  <Chip key={h} value={h} size="sm">
                    {h}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </div>

          <Switch
            label="credentials: 'include' (send cookies)"
            checked={credentials}
            onChange={(e) => setCredentials(e.currentTarget.checked)}
          />
        </Stack>
      </DemoCard>

      <Alert
        variant="light"
        color={verdict.needsPreflight ? 'orange' : 'teal'}
        icon={verdict.needsPreflight ? <IconExclamationCircle size={18} /> : <IconCheck size={18} />}
        title={
          verdict.needsPreflight
            ? 'PREFLIGHT — the browser sends OPTIONS first'
            : 'Simple request — NO preflight'
        }
      >
        {verdict.needsPreflight ? (
          <Stack gap={4}>
            <Text size="sm">Reasons:</Text>
            <ul className="ml-4 list-disc">
              {verdict.reasons.map((r) => (
                <li key={r}>
                  <Text size="sm">{r}</Text>
                </li>
              ))}
            </ul>
          </Stack>
        ) : (
          <Text size="sm">Satisfies all simple-request conditions → sent directly with an Origin header.</Text>
        )}
      </Alert>

      <DemoCard title="Wire trace (simulated)">
        <Stack gap="xs">
          {verdict.needsPreflight && (
            <Code block>
              {`▶ OPTIONS /api  (preflight — sent by the browser)
   Origin: ${origin}
   Access-Control-Request-Method: ${method}
   Access-Control-Request-Headers: ${[contentType !== 'text/plain' ? 'content-type' : '', ...customHeaders.map((h) => h.toLowerCase())]
     .filter(Boolean)
     .join(', ') || '(none)'}

◀ 204  Access-Control-Allow-Origin: ${credentials ? origin : '*'}
       Access-Control-Allow-Methods: ${method}
       Access-Control-Allow-Headers: ...
       ${credentials ? 'Access-Control-Allow-Credentials: true' : ''}
       Access-Control-Max-Age: 600`}
            </Code>
          )}
          <Code block>
            {`▶ ${method} /api  (the REAL request)
   Origin: ${origin}${credentials ? '\n   Cookie: session=…' : ''}${contentType !== 'text/plain' ? `\n   Content-Type: ${contentType}` : ''}

◀ 200  Access-Control-Allow-Origin: ${credentials ? origin : '*'}${credentials ? '\n       Access-Control-Allow-Credentials: true' : ''}`}
          </Code>
          {credentials && (
            <Badge color="red" variant="light">
              With credentials=include: Allow-Origin must NOT be "*", it must be {origin}
            </Badge>
          )}
        </Stack>
      </DemoCard>
    </Stack>
  );
}
