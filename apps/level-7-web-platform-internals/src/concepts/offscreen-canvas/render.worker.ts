/// <reference lib="webworker" />

// Dedicated worker. Casting `self` gives worker-scope types without clashing
// with the DOM `Window` typings used elsewhere.
const ctx = self as unknown as DedicatedWorkerGlobalScope;

type InitMessage = { type: 'init'; canvas: OffscreenCanvas };
type StopMessage = { type: 'stop' };
type InMessage = InitMessage | StopMessage;

let raf = 0;
let frames = 0;
let lastFpsReport = 0;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
}

function makeBalls(count: number, w: number, h: number): Ball[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6,
    r: 6 + Math.random() * 10,
    hue: Math.floor(Math.random() * 360),
  }));
}

function start(canvas: OffscreenCanvas) {
  const g = canvas.getContext('2d');
  if (!g) return;
  const { width: w, height: h } = canvas;
  const balls = makeBalls(140, w, h);
  lastFpsReport = performance.now();
  frames = 0;

  const draw = () => {
    g.fillStyle = 'rgba(15,18,28,0.35)'; // trail fade
    g.fillRect(0, 0, w, h);
    for (const b of balls) {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < b.r || b.x > w - b.r) b.vx *= -1;
      if (b.y < b.r || b.y > h - b.r) b.vy *= -1;
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fillStyle = `hsl(${b.hue} 80% 60%)`;
      g.fill();
    }

    frames++;
    const now = performance.now();
    if (now - lastFpsReport >= 500) {
      ctx.postMessage({ type: 'fps', fps: Math.round((frames * 1000) / (now - lastFpsReport)) });
      frames = 0;
      lastFpsReport = now;
    }
    // requestAnimationFrame exists in worker scope ONLY because an OffscreenCanvas
    // is driven here — this loop runs entirely off the main thread.
    raf = ctx.requestAnimationFrame(draw);
  };
  raf = ctx.requestAnimationFrame(draw);
}

ctx.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  if (msg.type === 'init') {
    start(msg.canvas);
  } else if (msg.type === 'stop') {
    ctx.cancelAnimationFrame(raf);
  }
};
