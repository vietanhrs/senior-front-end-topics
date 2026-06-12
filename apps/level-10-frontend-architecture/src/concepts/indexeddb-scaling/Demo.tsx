import { useEffect, useRef, useState } from 'react';
import { Button, Group, Stack } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const DB = 'sfe-l10-idb';
const STORE = 'items';
const CATS = ['books', 'music', 'film', 'games', 'tech'];
const supported = typeof indexedDB !== 'undefined';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        os.createIndex('by-category', 'category', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const txDone = (t: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });

const reqDone = <T,>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

export function Demo() {
  const { logs, log, clear } = useLogger();
  const dbRef = useRef<IDBDatabase | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const db = async () => {
    if (!dbRef.current) dbRef.current = await openDB();
    return dbRef.current;
  };

  const refreshCount = async () => {
    const d = await db();
    const n = await reqDone(d.transaction(STORE).objectStore(STORE).count());
    setCount(n);
  };

  useEffect(() => {
    if (supported) refreshCount().catch(() => {});
    return () => dbRef.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seedBulk = async (n: number) => {
    const d = await db();
    const t0 = performance.now();
    const t = d.transaction(STORE, 'readwrite');
    const os = t.objectStore(STORE);
    for (let i = 0; i < n; i++) os.add({ category: CATS[i % CATS.length], value: i, ts: Date.now() });
    await txDone(t); // single commit for all n adds
    log(`bulk: ${n} adds in ONE transaction → ${(performance.now() - t0).toFixed(0)}ms`, 'success');
    await refreshCount();
  };

  const seedSlow = async (n: number) => {
    const d = await db();
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      const t = d.transaction(STORE, 'readwrite'); // a NEW transaction per record
      t.objectStore(STORE).add({ category: CATS[i % CATS.length], value: i, ts: Date.now() });
      await txDone(t);
    }
    log(`slow: ${n} adds in ${n} separate transactions → ${(performance.now() - t0).toFixed(0)}ms (commit overhead × ${n})`, 'error');
    await refreshCount();
  };

  const queryIndex = async (cat: string) => {
    const d = await db();
    const t0 = performance.now();
    const rows = await reqDone(d.transaction(STORE).objectStore(STORE).index('by-category').getAll(cat));
    log(`index query "${cat}": ${rows.length} rows in ${(performance.now() - t0).toFixed(1)}ms (reads only matches)`, 'success');
  };

  const queryScan = async (cat: string) => {
    const d = await db();
    const t0 = performance.now();
    const all = await reqDone(d.transaction(STORE).objectStore(STORE).getAll());
    const rows = all.filter((r: { category: string }) => r.category === cat);
    log(`full scan + filter "${cat}": ${rows.length}/${all.length} in ${(performance.now() - t0).toFixed(1)}ms (deserialized EVERY record)`, 'error');
  };

  const reset = async () => {
    dbRef.current?.close();
    dbRef.current = null;
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
    setCount(0);
    log('database deleted', 'macro');
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="A real IndexedDB — measure the strategies that matter">
        Everything here hits a real IndexedDB. Seed records in <b>one transaction</b> vs{' '}
        <b>one-per-record</b> and compare; then query <b>by index</b> vs a <b>full scan + filter</b>.
        The differences are the whole game at scale.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="IndexedDB unavailable">
          No <code>indexedDB</code> in this engine. The strategies in the theory still apply.
        </Callout>
      )}

      <DemoCard title={`Store: ${count ?? '…'} records`}>
        <Stack gap="xs">
          <Group>
            <Button onClick={() => seedBulk(5000)} disabled={!supported}>Seed 5000 (1 transaction)</Button>
            <Button color="orange" onClick={() => seedSlow(1000)} disabled={!supported}>Seed 1000 (one tx each)</Button>
          </Group>
          <Group>
            <Button variant="light" color="teal" onClick={() => queryIndex('tech')} disabled={!supported}>Query by index "tech"</Button>
            <Button variant="light" color="red" onClick={() => queryScan('tech')} disabled={!supported}>Full scan + filter "tech"</Button>
            <Button variant="subtle" onClick={() => { reset(); clear(); }} disabled={!supported}>Reset DB</Button>
          </Group>
        </Stack>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Seed some records, then compare bulk vs slow and index vs scan." />
    </Stack>
  );
}
