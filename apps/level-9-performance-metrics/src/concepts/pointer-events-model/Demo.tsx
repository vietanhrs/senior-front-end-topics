import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const W = 600;
const H = 220;

interface Info {
  pointerType: string;
  pressure: number;
  isPrimary: boolean;
  pointerId: number;
  coalesced: number;
}

export function Demo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    g.fillStyle = '#0f121c';
    g.fillRect(0, 0, W, H);
  }, []);

  const toCanvas = (clientX: number, clientY: number) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * H };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId); // capture: keep tracking outside the canvas
    setCaptured(true);
    drawing.current = true;
    last.current = toCanvas(e.clientX, e.clientY);
    setInfo({
      pointerType: e.pointerType,
      pressure: e.pressure,
      isPrimary: e.isPrimary,
      pointerId: e.pointerId,
      coalesced: 1,
    });
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const g = canvasRef.current!.getContext('2d')!;
    // Draw through ALL coalesced samples for a smooth line, not just the latest point.
    const native = e.nativeEvent;
    const samples =
      typeof native.getCoalescedEvents === 'function' && native.getCoalescedEvents().length
        ? native.getCoalescedEvents()
        : [native];
    for (const s of samples) {
      const p = toCanvas(s.clientX, s.clientY);
      if (last.current) {
        const pressure = (s as PointerEvent).pressure || 0.5;
        g.strokeStyle = `hsl(${200 + pressure * 120} 80% 60%)`;
        g.lineWidth = 1 + pressure * 6;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(last.current.x, last.current.y);
        g.lineTo(p.x, p.y);
        g.stroke();
      }
      last.current = p;
    }
    setInfo({
      pointerType: e.pointerType,
      pressure: e.pressure,
      isPrimary: e.isPrimary,
      pointerId: e.pointerId,
      coalesced: samples.length,
    });
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    last.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setCaptured(false);
  };

  const clear = () => {
    const g = canvasRef.current!.getContext('2d')!;
    g.fillStyle = '#0f121c';
    g.fillRect(0, 0, W, H);
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="Draw with any device — one set of handlers">
        Draw on the surface with a mouse, finger, or pen. The same <code>pointerdown/move/up</code>{' '}
        handlers work for all; <code>setPointerCapture</code> keeps tracking even if you drag outside
        the box; line width follows <code>pressure</code> (pen/touch); and each move is drawn through
        all its <code>getCoalescedEvents()</code> samples. <code>touch-action: none</code> stops the
        page scrolling so touch draws instead.
      </Callout>

      <DemoCard title="Pointer surface">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="w-full rounded-md border"
          style={{ touchAction: 'none', cursor: 'crosshair' }}
        />
      </DemoCard>

      <Group>
        <Badge variant="light" color={captured ? 'teal' : 'gray'}>{captured ? 'pointer captured' : 'idle'}</Badge>
        {info && (
          <>
            <Badge variant="light" color="indigo">type: {info.pointerType}</Badge>
            <Badge variant="light" color="grape">pressure: {info.pressure.toFixed(2)}</Badge>
            <Badge variant="light">isPrimary: {String(info.isPrimary)}</Badge>
            <Badge variant="light">pointerId: {info.pointerId}</Badge>
            <Badge variant="light" color="orange">coalesced: {info.coalesced}</Badge>
          </>
        )}
        <Button variant="subtle" onClick={clear}>Clear</Button>
      </Group>

      {!info && <Text size="sm" c="dimmed">Press and drag on the surface to see live pointer properties.</Text>}
    </Stack>
  );
}
