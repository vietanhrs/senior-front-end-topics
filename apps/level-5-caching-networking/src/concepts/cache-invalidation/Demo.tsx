import { useRef, useState } from 'react';
import { Badge, Button, Code, Group, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type Strategy = 'ttl' | 'keyed' | 'clear-all';

interface Entry {
  key: string;
  value: string;
  storedAt: number;
}

const TTL_MS = 5000;
// A tiny "server": versions bump on every mutation.
function makeServer() {
  let todosVersion = 1;
  let userVersion = 1;
  return {
    fetch(key: string): string {
      if (key === 'todos') return `todos v${todosVersion}`;
      if (key === 'user') return `user v${userVersion}`;
      return '?';
    },
    mutateTodos() {
      todosVersion += 1;
    },
    get versions() {
      return { todos: todosVersion, user: userVersion };
    },
  };
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const serverRef = useRef(makeServer());
  const [strategy, setStrategy] = useState<Strategy>('ttl');
  const [cache, setCache] = useState<Map<string, Entry>>(new Map());
  const [storageStatus, setStorageStatus] = useState<string>('not touched');
  const [, force] = useState(0);

  function read(key: string) {
    const entry = cache.get(key);
    const now = Date.now();
    const fresh = entry && (strategy !== 'ttl' || now - entry.storedAt < TTL_MS);
    if (entry && fresh) {
      const stale = entry.value !== serverRef.current.fetch(key);
      log(`READ ${key}: cache HIT → "${entry.value}"${stale ? '  ⚠ STALE (server has newer)' : ''}`, stale ? 'error' : 'success');
      return;
    }
    const value = serverRef.current.fetch(key);
    log(`READ ${key}: cache MISS${entry ? ' (expired)' : ''} → fetched "${value}"`, 'macro');
    setCache((c) => new Map(c).set(key, { key, value, storedAt: now }));
  }

  function mutate() {
    serverRef.current.mutateTodos();
    log(`MUTATION: POST /todos (server now has todos v${serverRef.current.versions.todos})`, 'sync');
    if (strategy === 'keyed') {
      setCache((c) => {
        const next = new Map(c);
        next.delete('todos'); // invalidate exactly the affected key
        return next;
      });
      log('→ keyed invalidation: dropped cache["todos"] only (user untouched)', 'success');
    } else if (strategy === 'clear-all') {
      setCache(new Map());
      log('→ cleared the ENTIRE cache (user entry nuked too — wasted hits)', 'error');
    } else {
      log(`→ TTL strategy does nothing now; "todos" stays stale up to ${TTL_MS / 1000}s`, 'error');
    }
    force((x) => x + 1);
  }

  async function writeRealCache() {
    if (!('caches' in window)) {
      setStorageStatus('Cache Storage unsupported');
      log('Cache Storage API is not available in this browser/context.', 'error');
      return;
    }

    const cacheStorage = await caches.open('sfe-cache-demo-v1');
    const response = new Response(JSON.stringify({ todos: serverRef.current.versions.todos }), {
      headers: { 'content-type': 'application/json' },
    });
    await cacheStorage.put('/demo-api/todos', response);
    const match = await cacheStorage.match('/demo-api/todos');
    setStorageStatus(match ? `stored real Response (${match.headers.get('content-type')})` : 'missing');
    log('CacheStorage.put("/demo-api/todos", Response) wrote a real browser cache entry.', 'success');
  }

  async function invalidateRealCache() {
    if (!('caches' in window)) return;
    const cacheStorage = await caches.open('sfe-cache-demo-v1');
    const deleted = await cacheStorage.delete('/demo-api/todos');
    setStorageStatus(deleted ? 'deleted /demo-api/todos' : 'entry was already missing');
    log(`CacheStorage.delete("/demo-api/todos") → ${deleted}`, deleted ? 'success' : 'macro');
  }

  const rows = ['todos', 'user'].map((key) => {
    const entry = cache.get(key);
    const serverValue = serverRef.current.fetch(key);
    const expired = entry && strategy === 'ttl' && Date.now() - entry.storedAt >= TTL_MS;
    return { key, entry, serverValue, expired };
  });

  return (
    <Stack gap="md">
      <Callout kind="info" title="One mutation, three strategies">
        Read both keys to fill the cache, then run the mutation and read again. <b>TTL</b>: "todos"
        stays stale until it expires ({TTL_MS / 1000}s). <b>Keyed</b>: the mutation invalidates only{' '}
        <code>todos</code> — precise, "user" keeps its hit. <b>Clear-all</b>: fixes staleness by
        destroying every entry, including unrelated ones.
      </Callout>

      <SegmentedControl
        value={strategy}
        onChange={(v) => setStrategy(v as Strategy)}
        fullWidth
        data={[
          { label: `TTL (${TTL_MS / 1000}s)`, value: 'ttl' },
          { label: 'Keyed invalidation', value: 'keyed' },
          { label: 'Clear everything', value: 'clear-all' },
        ]}
      />

      <DemoCard
        title="Cache vs server"
        right={
          <Group gap="xs">
            <Button size="xs" onClick={() => read('todos')}>
              Read todos
            </Button>
            <Button size="xs" onClick={() => read('user')}>
              Read user
            </Button>
            <Button size="xs" color="orange" onClick={mutate}>
              Mutate todos
            </Button>
            <Button size="xs" variant="default" onClick={() => { setCache(new Map()); clear(); }}>
              Reset
            </Button>
          </Group>
        }
      >
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>key</Table.Th>
              <Table.Th>cached value</Table.Th>
              <Table.Th>server value</Table.Th>
              <Table.Th>status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map(({ key, entry, serverValue, expired }) => {
              const stale = entry && !expired && entry.value !== serverValue;
              return (
                <Table.Tr key={key}>
                  <Table.Td>
                    <Text ff="monospace" size="sm">{key}</Text>
                  </Table.Td>
                  <Table.Td>{entry ? entry.value : <Text c="dimmed" size="sm">(empty)</Text>}</Table.Td>
                  <Table.Td>{serverValue}</Table.Td>
                  <Table.Td>
                    {!entry ? (
                      <Badge color="gray" variant="light">miss</Badge>
                    ) : expired ? (
                      <Badge color="yellow" variant="light">expired</Badge>
                    ) : stale ? (
                      <Badge color="red" variant="filled">STALE</Badge>
                    ) : (
                      <Badge color="teal" variant="light">fresh</Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </DemoCard>

      <DemoCard
        title="Real Cache Storage API"
        description={
          <>
            The table above is an in-memory model. These buttons also write and invalidate a real{' '}
            <Code>Response</Code> in the browser's Cache Storage.
          </>
        }
        right={<Badge variant="light">{storageStatus}</Badge>}
      >
        <Group>
          <Button size="xs" onClick={writeRealCache}>
            Write browser cache entry
          </Button>
          <Button size="xs" color="orange" variant="light" onClick={invalidateRealCache}>
            Delete browser cache entry
          </Button>
        </Group>
      </DemoCard>

      <LogConsole logs={logs} height={180} empty="Read keys, mutate, read again — compare strategies." />
    </Stack>
  );
}
