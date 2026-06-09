import { useMemo, useState } from 'react';
import { Alert, Badge, Chip, Code, Group, Select, Stack, Switch, Text } from '@mantine/core';
import { IconCheck, IconExclamationCircle } from '@tabler/icons-react';
import { Callout, DemoCard } from '../../workbook/ui';
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
      <Callout kind="info" title="Bộ mô phỏng quyết định preflight">
        Chỉnh request bên dưới và xem trình duyệt có phải gửi <code>OPTIONS</code> trước hay
        không, kèm lý do và "wire trace" mô phỏng.
      </Callout>

      <DemoCard title="Cấu hình request cross-origin">
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
              Header tác giả tự set
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
            label="credentials: 'include' (gửi cookie)"
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
            ? 'CÓ preflight — trình duyệt gửi OPTIONS trước'
            : 'Simple request — KHÔNG preflight'
        }
      >
        {verdict.needsPreflight ? (
          <Stack gap={4}>
            <Text size="sm">Lý do:</Text>
            <ul className="ml-4 list-disc">
              {verdict.reasons.map((r) => (
                <li key={r}>
                  <Text size="sm">{r}</Text>
                </li>
              ))}
            </ul>
          </Stack>
        ) : (
          <Text size="sm">Thoả mọi điều kiện simple request → gửi thẳng kèm header Origin.</Text>
        )}
      </Alert>

      <DemoCard title="Wire trace (mô phỏng)">
        <Stack gap="xs">
          {verdict.needsPreflight && (
            <Code block>
              {`▶ OPTIONS /api  (preflight — trình duyệt tự gửi)
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
            {`▶ ${method} /api  (request THẬT)
   Origin: ${origin}${credentials ? '\n   Cookie: session=…' : ''}${contentType !== 'text/plain' ? `\n   Content-Type: ${contentType}` : ''}

◀ 200  Access-Control-Allow-Origin: ${credentials ? origin : '*'}${credentials ? '\n       Access-Control-Allow-Credentials: true' : ''}`}
          </Code>
          {credentials && (
            <Badge color="red" variant="light">
              Khi credentials=include: Allow-Origin KHÔNG được là "*", phải là {origin}
            </Badge>
          )}
        </Stack>
      </DemoCard>
    </Stack>
  );
}
