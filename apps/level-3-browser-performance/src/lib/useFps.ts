import { useEffect, useRef, useState } from 'react';

/**
 * A requestAnimationFrame-based FPS meter. It samples frame deltas and reports a
 * smoothed frames-per-second value ~4x/second. Because rAF callbacks only fire
 * when the main thread is free, a janky page shows a visibly lower FPS here.
 */
export function useFps(active = true) {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      frames.current += 1;
      const now = performance.now();
      const elapsed = now - last.current;
      if (elapsed >= 250) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return fps;
}
