import { useEffect, useMemo, useRef, useState } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { Badge, Button, Group, Stack, Switch } from '@mantine/core';
import { IconBolt, IconRefresh } from '@tabler/icons-react';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

function HydratedCounter({ token }: { token: number }) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ fontFamily: 'inherit' }}>
      <p style={{ margin: '0 0 8px' }}>
        Rendered by the server — token: <b>#{token}</b>
      </p>
      <button
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid #ccc',
          background: '#f1f3f5',
        }}
        onClick={() => setCount((c) => c + 1)}
      >
        Count: {count} {count === 0 ? '(not interactive yet)' : '(now interactive)'}
      </button>
    </div>
  );
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [hydrated, setHydrated] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [serverHtml, setServerHtml] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  // A value baked into the "server HTML". With mismatch mode on, this is a
  // non-deterministic value the client would NOT reproduce.
  const serverValue = useMemo(() => (mismatch ? Math.floor(Math.random() * 1000) : 42), [mismatch]);

  useEffect(() => {
    let cancelled = false;
    import('react-dom/server').then(({ renderToString }) => {
      if (!cancelled) {
        setServerHtml(renderToString(<HydratedCounter token={serverValue} />));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [serverValue]);

  useEffect(() => {
    if (!hydrated && containerRef.current) {
      containerRef.current.innerHTML = serverHtml;
    }
  }, [hydrated, serverHtml]);

  useEffect(() => () => rootRef.current?.unmount(), []);

  function hydrate() {
    if (!containerRef.current || rootRef.current || !serverHtml) return;
    log('Browser paints the static server HTML (FCP) ✔', 'success');
    log('Downloading & parsing the client JS bundle…', 'sync');
    const clientValue = mismatch ? Math.floor(Math.random() * 1000) : 42;
    log(`Calling hydrateRoot(container, <HydratedCounter token={${clientValue}} />)`, 'sync');
    if (mismatch && clientValue !== serverValue) {
      log(
        `⚠ Hydration mismatch: server="#${serverValue}" ≠ client="#${clientValue}". React must patch the DOM.`,
        'error',
      );
    }
    rootRef.current = hydrateRoot(containerRef.current, <HydratedCounter token={clientValue} />);
    log('React adopted the existing DOM and attached event listeners → UI is interactive ✔', 'success');
    setHydrated(true);
  }

  function reset() {
    rootRef.current?.unmount();
    rootRef.current = null;
    setHydrated(false);
    clear();
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="How to read this demo">
        This demo uses React's real <code>hydrateRoot</code> API against static HTML generated in
        the browser. Before hydration, the button is inert. After hydration, React adopts that DOM
        and wires the click handler. A production SSR server would generate the same HTML before it
        reaches the browser.
      </Callout>

      <DemoCard
        title="SSR → Hydration lifecycle"
        right={
          <Badge color={hydrated ? 'teal' : 'orange'} variant="filled">
            {hydrated ? 'Hydrated (interactive)' : 'Static HTML (inert)'}
          </Badge>
        }
      >
        <Stack gap="md">
          <Switch
            label="Mismatch mode (render the token with a random value)"
            checked={mismatch}
            onChange={(e) => setMismatch(e.currentTarget.checked)}
            disabled={hydrated}
          />

          <div className="rounded-lg border border-dashed p-4">
            <div ref={containerRef} />
          </div>

          <Group>
            <Button
              color="grape"
              leftSection={<IconBolt size={16} />}
              onClick={hydrate}
              disabled={hydrated || !serverHtml}
            >
              Hydrate
            </Button>
            <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={reset}>
              Reset
            </Button>
          </Group>

          <LogConsole logs={logs} height={180} />
        </Stack>
      </DemoCard>
    </Stack>
  );
}
