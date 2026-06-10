import { useMemo, useState } from 'react';
import { Alert, Badge, Chip, Code, Group, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Callout, DemoCard } from '@sfe/workbook';

const ORIGIN = 'https://app.example';
const SAFELISTED_CT = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
const SIMPLE_METHODS = ['GET', 'HEAD', 'POST'];

export function Demo() {
  // Request config
  const [method, setMethod] = useState('PATCH');
  const [contentType, setContentType] = useState('application/json');
  const [customHeaders, setCustomHeaders] = useState<string[]>(['X-Trace-Id']);
  const [credentials, setCredentials] = useState(false);

  // Server policy config
  const [allowOrigin, setAllowOrigin] = useState(ORIGIN);
  const [allowMethods, setAllowMethods] = useState('GET, POST, PATCH');
  const [allowHeaders, setAllowHeaders] = useState('content-type, x-trace-id');
  const [allowCreds, setAllowCreds] = useState(false);
  const [maxAge, setMaxAge] = useState('600');

  const requestedHeaders = useMemo(() => {
    const hs = customHeaders.map((h) => h.toLowerCase());
    if (!SAFELISTED_CT.includes(contentType)) hs.push('content-type');
    return [...new Set(hs)].sort();
  }, [customHeaders, contentType]);

  const needsPreflight = useMemo(
    () => !SIMPLE_METHODS.includes(method) || !SAFELISTED_CT.includes(contentType) || customHeaders.length > 0,
    [method, contentType, customHeaders],
  );

  const checks = useMemo(() => {
    const methodsList = allowMethods.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const headersList = allowHeaders.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const result: { label: string; ok: boolean; detail: string }[] = [];

    // Allow-Origin
    const originOk = credentials ? allowOrigin === ORIGIN : allowOrigin === ORIGIN || allowOrigin === '*';
    result.push({
      label: 'Access-Control-Allow-Origin',
      ok: originOk,
      detail: credentials && allowOrigin === '*' ? "'*' is invalid with credentials — must echo the exact origin" : `"${allowOrigin}" vs Origin ${ORIGIN}`,
    });

    // Allow-Methods
    const methodOk = methodsList.includes(method.toLowerCase()) || (allowMethods.includes('*') && !credentials);
    result.push({ label: 'Access-Control-Allow-Methods', ok: methodOk, detail: methodOk ? `${method} permitted` : `${method} not in [${allowMethods}]` });

    // Allow-Headers — every requested header must be present
    const wildcardHeaders = allowHeaders.trim() === '*' && !credentials;
    const missing = requestedHeaders.filter((h) => !headersList.includes(h));
    const headersOk = wildcardHeaders || missing.length === 0;
    result.push({
      label: 'Access-Control-Allow-Headers',
      ok: headersOk,
      detail: headersOk ? `all of [${requestedHeaders.join(', ') || 'none'}] allowed` : `missing: ${missing.join(', ')}${allowHeaders.trim() === '*' && credentials ? " ('*' ignored with credentials)" : ''}`,
    });

    // Credentials
    if (credentials) {
      result.push({ label: 'Access-Control-Allow-Credentials', ok: allowCreds, detail: allowCreds ? 'true' : 'must be true for credentialed requests' });
    }
    return result;
  }, [allowOrigin, allowMethods, allowHeaders, allowCreds, method, requestedHeaders, credentials]);

  const preflightPasses = checks.every((c) => c.ok);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Drive the OPTIONS exchange">
        Configure the request and the server's CORS response, then watch the browser's validation.
        If any check fails, the <b>real</b> request is never sent. Document origin is{' '}
        <Code>{ORIGIN}</Code>.
      </Callout>

      <Group grow align="flex-start">
        <DemoCard title="Request (browser)">
          <Stack gap="sm">
            <Select label="Method" value={method} onChange={(v) => setMethod(v ?? 'GET')} data={['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE']} />
            <Select label="Content-Type" value={contentType} onChange={(v) => setContentType(v ?? 'text/plain')} data={[...SAFELISTED_CT, 'application/json']} />
            <div>
              <Text size="sm" fw={500} mb={4}>Custom headers</Text>
              <Chip.Group multiple value={customHeaders} onChange={setCustomHeaders}>
                <Group gap="xs">
                  {['Authorization', 'X-Trace-Id', 'X-Api-Key'].map((h) => (
                    <Chip key={h} value={h} size="sm">{h}</Chip>
                  ))}
                </Group>
              </Chip.Group>
            </div>
            <Switch label="credentials: 'include'" checked={credentials} onChange={(e) => setCredentials(e.currentTarget.checked)} />
          </Stack>
        </DemoCard>

        <DemoCard title="Server CORS response">
          <Stack gap="sm">
            <TextInput label="Access-Control-Allow-Origin" value={allowOrigin} onChange={(e) => setAllowOrigin(e.currentTarget.value)} />
            <TextInput label="Access-Control-Allow-Methods" value={allowMethods} onChange={(e) => setAllowMethods(e.currentTarget.value)} />
            <TextInput label="Access-Control-Allow-Headers" value={allowHeaders} onChange={(e) => setAllowHeaders(e.currentTarget.value)} />
            <Group grow>
              <Switch label="Allow-Credentials" checked={allowCreds} onChange={(e) => setAllowCreds(e.currentTarget.checked)} mt={24} />
              <TextInput label="Max-Age (s)" value={maxAge} onChange={(e) => setMaxAge(e.currentTarget.value)} />
            </Group>
          </Stack>
        </DemoCard>
      </Group>

      <DemoCard
        title={needsPreflight ? 'Preflight exchange' : 'Simple request — no preflight'}
        right={
          needsPreflight && (
            <Badge size="lg" color={preflightPasses ? 'teal' : 'red'} variant="filled">
              {preflightPasses ? 'real request proceeds' : 'BLOCKED — real request never sent'}
            </Badge>
          )
        }
      >
        {!needsPreflight ? (
          <Text size="sm" c="dimmed">
            This request is "simple" (method ∈ GET/HEAD/POST, safelisted Content-Type, no custom
            headers), so the browser skips OPTIONS and sends it directly — the server still needs{' '}
            <Code>Access-Control-Allow-Origin</Code> on the response for JS to read it.
          </Text>
        ) : (
          <Stack gap="sm">
            <Code block>
              {`▶ OPTIONS /api  (browser-generated)
   Origin: ${ORIGIN}
   Access-Control-Request-Method: ${method}
   Access-Control-Request-Headers: ${requestedHeaders.join(', ') || '(none)'}

◀ 204
   Access-Control-Allow-Origin: ${allowOrigin}
   Access-Control-Allow-Methods: ${allowMethods}
   Access-Control-Allow-Headers: ${allowHeaders}${credentials ? `\n   Access-Control-Allow-Credentials: ${allowCreds}` : ''}
   Access-Control-Max-Age: ${maxAge}`}
            </Code>
            <Stack gap={4}>
              {checks.map((c) => (
                <Group key={c.label} gap="xs" wrap="nowrap">
                  {c.ok ? <IconCheck size={16} color="var(--mantine-color-teal-6)" /> : <IconX size={16} color="var(--mantine-color-red-6)" />}
                  <Text size="sm" fw={500} w={290}>{c.label}</Text>
                  <Text size="xs" c="dimmed">{c.detail}</Text>
                </Group>
              ))}
            </Stack>
            {!preflightPasses && (
              <Alert color="red" variant="light">
                The browser rejects the preflight, so it never sends the actual {method}. In DevTools
                you'd see the OPTIONS (often 200/204) and a console CORS error — but no real request.
              </Alert>
            )}
            {preflightPasses && Number(maxAge) > 0 && (
              <Alert color="teal" variant="light">
                Preflight cached for {maxAge}s (key = origin + method + headers). Subsequent identical
                requests skip OPTIONS until it expires.
              </Alert>
            )}
          </Stack>
        )}
      </DemoCard>
    </Stack>
  );
}
