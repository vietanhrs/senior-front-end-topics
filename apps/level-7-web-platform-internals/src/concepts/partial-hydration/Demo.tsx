import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { Callout, LogConsole, useLogger } from '@sfe/workbook';

type Trigger = 'eager' | 'idle' | 'visible' | 'interaction';

const WIDGETS: { id: string; trigger: Trigger; label: string }[] = [
  { id: 'hero-cta', trigger: 'eager', label: 'Hero CTA (above the fold)' },
  { id: 'newsletter', trigger: 'idle', label: 'Newsletter signup' },
  { id: 'comments', trigger: 'visible', label: 'Comments (below the fold)' },
  { id: 'share-menu', trigger: 'interaction', label: 'Share menu (rarely used)' },
];

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [run, setRun] = useState(0); // remount key to replay
  const [hydratedIds, setHydratedIds] = useState<Set<string>>(new Set());
  const t0Ref = useRef(performance.now());

  function markHydrated(id: string, trigger: Trigger) {
    setHydratedIds((prev) => {
      if (prev.has(id)) return prev;
      const ms = Math.round(performance.now() - t0Ref.current);
      log(`hydrated "${id}" via ${trigger} trigger (+${ms}ms, chunk loaded on demand)`, 'success');
      return new Set(prev).add(id);
    });
  }

  function restart() {
    clear();
    setHydratedIds(new Set());
    t0Ref.current = performance.now();
    setRun((r) => r + 1);
    log('page loaded — only eager widgets hydrate now; others wait for their trigger', 'sync');
  }

  useEffect(() => {
    t0Ref.current = performance.now();
    log('page loaded — only eager widgets hydrate now; others wait for their trigger', 'sync');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Watch each widget hydrate on its own trigger">
        On "page load" only the <b>eager</b> widget hydrates. The <b>idle</b> one hydrates at the
        next idle moment, <b>comments</b> hydrate when you scroll them into view, and the <b>share
        menu</b> hydrates only when you first hover/focus it. Each logs the moment (and would load
        its JS chunk) on demand. Press Restart to replay.
      </Callout>

      <Group>
        <Button size="xs" onClick={restart}>
          Restart (simulate page load)
        </Button>
        <Badge variant="light">{hydratedIds.size} / {WIDGETS.length} hydrated</Badge>
      </Group>

      {/* tall scroll area so "visible" widgets start off-screen */}
      <Paper withBorder radius="md" p="sm">
        <div className="h-72 overflow-auto" key={run}>
          <Text size="xs" c="dimmed" mb="sm">
            ↓ scroll down to bring the Comments widget into view ↓
          </Text>
          <Stack gap={120}>
            {WIDGETS.map((w) => (
              <WidgetSlot key={w.id} widget={w} hydrated={hydratedIds.has(w.id)} onHydrate={() => markHydrated(w.id, w.trigger)} />
            ))}
            <Text size="xs" c="dimmed">end of page</Text>
          </Stack>
        </div>
      </Paper>

      <LogConsole logs={logs} height={170} empty="Restart to see hydration order by trigger." />
    </Stack>
  );
}

function WidgetSlot({
  widget,
  hydrated,
  onHydrate,
}: {
  widget: { id: string; trigger: Trigger; label: string };
  hydrated: boolean;
  onHydrate: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (widget.trigger === 'eager') {
      onHydrate();
      return;
    }
    if (widget.trigger === 'idle') {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      const id = ric ? ric(onHydrate) : window.setTimeout(onHydrate, 200);
      return () => {
        const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
        if (ric && cic) cic(id as number);
        else clearTimeout(id as number);
      };
    }
    if (widget.trigger === 'visible') {
      const el = ref.current;
      if (!el) return;
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          onHydrate();
        }
      });
      io.observe(el);
      return () => io.disconnect();
    }
    // interaction: handled via DOM listeners below
    const el = ref.current;
    if (!el) return;
    const fire = () => onHydrate();
    el.addEventListener('pointerover', fire, { once: true });
    el.addEventListener('focusin', fire, { once: true });
    return () => {
      el.removeEventListener('pointerover', fire);
      el.removeEventListener('focusin', fire);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.trigger]);

  return (
    <Paper ref={ref} withBorder radius="md" p="sm" tabIndex={0} style={{ outline: 'none' }}>
      <Group justify="space-between">
        <div>
          <Text size="sm" fw={600}>
            {widget.label}
          </Text>
          <Text size="xs" c="dimmed">
            client:{widget.trigger}
          </Text>
        </div>
        <Badge color={hydrated ? 'teal' : 'gray'} variant={hydrated ? 'filled' : 'light'}>
          {hydrated ? 'interactive' : 'inert (SSR HTML)'}
        </Badge>
      </Group>
      {hydrated && <Counter />}
    </Paper>
  );
}

function Counter() {
  const [n, setN] = useState(0);
  return (
    <Button size="xs" variant="light" mt="xs" onClick={() => setN((c) => c + 1)}>
      clicked {n}
    </Button>
  );
}
