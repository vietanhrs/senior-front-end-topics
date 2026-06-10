import { useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

// A module-level cache that (in leaky mode) retains detached nodes forever.
const leakedNodes: HTMLElement[] = [];

const SUBTREE_SIZE = 500; // children per created node, to make retention "heavy"

function buildHeavyNode(tag: number): HTMLElement {
  const root = document.createElement('div');
  for (let i = 0; i < SUBTREE_SIZE; i++) {
    const child = document.createElement('span');
    child.textContent = `node ${tag} · child ${i} · ${'x'.repeat(20)}`;
    root.appendChild(child);
  }
  return root;
}

function heapMb(): string {
  // performance.memory is Chrome-only & non-standard.
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'n/a (open in Chrome)';
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const hostRef = useRef<HTMLDivElement>(null);
  const [retained, setRetained] = useState(0);
  const [, force] = useState(0);

  function leak() {
    const host = hostRef.current!;
    for (let i = 0; i < 5; i++) {
      const node = buildHeavyNode(leakedNodes.length + i);
      host.appendChild(node); // attach
      host.removeChild(node); // ...then detach from the DOM
      leakedNodes.push(node); // ❌ but keep a JS reference → DETACHED + retained
    }
    setRetained(leakedNodes.length);
    log(`Leaked 5 nodes (×${SUBTREE_SIZE} children). Retained detached nodes: ${leakedNodes.length}. Heap: ${heapMb()}`, 'error');
  }

  function clean() {
    const host = hostRef.current!;
    for (let i = 0; i < 5; i++) {
      const node = buildHeavyNode(i);
      host.appendChild(node);
      host.removeChild(node); // no reference kept → eligible for GC immediately
    }
    log(`Created + removed 5 nodes WITHOUT retaining them → collectable. Heap: ${heapMb()}`, 'success');
  }

  function release() {
    leakedNodes.length = 0; // drop references → now collectable on next GC
    setRetained(0);
    log('Released all references (leakedNodes.length = 0). Take a heap snapshot before/after to confirm.', 'sync');
  }

  return (
    <Stack gap="md">
      <Callout kind="warning" title="Use the Memory panel to make this concrete">
        Click "Leak" several times, then DevTools → Memory → take a heap snapshot and filter by
        <b> "Detached"</b> — you'll see the retained <code>Detached HTMLDivElement</code>s and their
        Retainers path (the <code>leakedNodes</code> array). "Release" then snapshot again: they're
        gone. The counter and (Chrome-only) heap reading below hint at the trend.
      </Callout>

      <DemoCard
        title="Leak vs clean lifecycle"
        right={
          <Group gap="xs">
            <Badge color={retained > 0 ? 'red' : 'teal'} variant="filled">
              retained: {retained}
            </Badge>
            <Badge variant="light" onClick={() => force((x) => x + 1)} style={{ cursor: 'pointer' }}>
              heap: {heapMb()}
            </Badge>
          </Group>
        }
      >
        <Group>
          <Button color="red" onClick={leak}>
            Leak 5 nodes (retain refs)
          </Button>
          <Button color="teal" onClick={clean}>
            Create + remove (no refs)
          </Button>
          <Button variant="default" onClick={release}>
            Release references
          </Button>
          <Button variant="subtle" onClick={clear}>
            Clear log
          </Button>
        </Group>
        {/* Off-screen host we attach/detach through. */}
        <div ref={hostRef} style={{ display: 'none' }} />
        <Text size="xs" c="dimmed" mt="sm">
          The "Leak" path mirrors a real bug: render a node, remove it from the DOM, but keep it in a
          cache/closure/store — it stays in memory with its entire subtree.
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Leak/clean to see the retained count and heap trend." />
    </Stack>
  );
}
