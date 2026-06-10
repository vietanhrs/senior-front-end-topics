import { useRef, useState } from 'react';
import { Badge, Button, Code, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const MAX_AGE_MS = 6000;
const BODY_KB = 480; // pretend payload size

interface CacheEntry {
  body: string;
  etag: string;
  storedAt: number;
}

function makeServer() {
  let version = 1;
  return {
    get etag() {
      return `"v${version}"`;
    },
    get body() {
      return `product list v${version} (~${BODY_KB}KB)`;
    },
    edit() {
      version += 1;
    },
  };
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const serverRef = useRef(makeServer());
  const entryRef = useRef<CacheEntry | null>(null);
  const [bytes, setBytes] = useState(0);
  const [, force] = useState(0);

  function request() {
    const server = serverRef.current;
    const entry = entryRef.current;
    const now = Date.now();

    if (entry && now - entry.storedAt < MAX_AGE_MS) {
      log(`FRESH (within max-age) → served from cache, 0 round trips, 0 bytes`, 'success');
      return;
    }
    if (entry) {
      // Expired -> conditional request with If-None-Match.
      log(`stale → GET + If-None-Match: ${entry.etag}`, 'macro');
      if (entry.etag === server.etag) {
        entryRef.current = { ...entry, storedAt: now }; // 304 refreshes freshness
        log(`← 304 Not Modified — empty body, ~0.3KB headers. Reused cached ${BODY_KB}KB.`, 'success');
        setBytes((b) => b + 0.3);
      } else {
        entryRef.current = { body: server.body, etag: server.etag, storedAt: now };
        log(`← 200 OK — content changed, full ${BODY_KB}KB transferred, new ETag ${server.etag}`, 'sync');
        setBytes((b) => b + BODY_KB);
      }
    } else {
      entryRef.current = { body: server.body, etag: server.etag, storedAt: now };
      log(`cold MISS → 200 OK, ${BODY_KB}KB transferred, ETag ${server.etag}, max-age=${MAX_AGE_MS / 1000}s`, 'macro');
      setBytes((b) => b + BODY_KB);
    }
    force((x) => x + 1);
  }

  function edit() {
    serverRef.current.edit();
    log(`server content edited → ETag is now ${serverRef.current.etag}`, 'sync');
  }

  function reset() {
    serverRef.current = makeServer();
    entryRef.current = null;
    setBytes(0);
    clear();
  }

  const entry = entryRef.current;
  const fresh = entry && Date.now() - entry.storedAt < MAX_AGE_MS;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Three regimes, one resource">
        Request repeatedly: within {MAX_AGE_MS / 1000}s you're <b>fresh</b> (cache, zero network).
        After expiry the browser revalidates with <code>If-None-Match</code>: unchanged →{' '}
        <b>304</b> (~0.3KB instead of {BODY_KB}KB). Click "Edit on server" first and the
        revalidation becomes a full <b>200</b>. Watch the transferred-bytes counter.
      </Callout>

      <DemoCard
        title={`GET /api/products  (Cache-Control: max-age=${MAX_AGE_MS / 1000}, ETag)`}
        right={
          <Group gap="xs">
            <Badge color={!entry ? 'gray' : fresh ? 'teal' : 'yellow'} variant="filled">
              {!entry ? 'no cache' : fresh ? 'fresh' : 'stale (will revalidate)'}
            </Badge>
            <Badge variant="light">total transferred: {bytes.toFixed(1)}KB</Badge>
          </Group>
        }
      >
        <Group mb="md">
          <Button onClick={request}>Request</Button>
          <Button variant="light" color="orange" onClick={edit}>
            Edit on server
          </Button>
          <Button variant="default" onClick={reset}>
            Reset
          </Button>
        </Group>
        {entry && (
          <Code block>
            {`cached: ${entry.body}
ETag:   ${entry.etag}
age:    ${((Date.now() - entry.storedAt) / 1000).toFixed(1)}s / ${MAX_AGE_MS / 1000}s`}
          </Code>
        )}
        <Text size="xs" c="dimmed" mt="sm">
          Note what 304 saves: the body transfer, not the round trip. Freshness (max-age) saves the
          round trip; validation (ETag) makes the unavoidable round trips nearly free.
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={190} empty="Request, wait for expiry, request again; edit and repeat." />
    </Stack>
  );
}
