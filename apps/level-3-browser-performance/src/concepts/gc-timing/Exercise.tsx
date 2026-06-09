import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A canvas particle animation that stutters periodically (GC pauses). The hot
// rAF loop allocates a lot every frame. Cut the allocations to smooth it out.
function animate(ctx, particles) {
  // (1) new array + objects every frame
  const next = particles.map((p) => ({
    x: p.x + p.vx,
    y: p.y + p.vy,
    color: 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')', // (2) string built per particle per frame
  }));

  // (3) chained intermediates each frame
  const visible = next.filter((p) => p.x > 0 && p.x < 800).map((p) => p);

  ctx.clearRect(0, 0, 800, 600);
  visible.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 2, 2);
  });

  requestAnimationFrame(() => animate(ctx, next));
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: eliminate per-frame allocations in the hot loop"
        description="The loop allocates a new array of objects, builds strings, and creates filter/map intermediates every frame → GC churn → periodic stutter. Mutate particles in place and avoid per-frame garbage."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Mutate the existing particle objects instead of creating new ones; precompute/caches color
        strings (or use numeric fills); replace <code>filter().map()</code> with a single{' '}
        <code>for</code> loop and a visibility check inline. Hoist anything constant out of the loop.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// Precompute color strings ONCE (they don't change per frame).
function initParticles(particles) {
  for (const p of particles) p.color = \`rgb(\${p.r},\${p.g},\${p.b})\`;
}

function animate(ctx, particles) {
  ctx.clearRect(0, 0, 800, 600);

  // Single loop: mutate in place, no new array, no intermediates, no per-frame strings.
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x <= 0 || p.x >= 800) continue; // inline visibility check
    ctx.fillStyle = p.color;              // cached string
    ctx.fillRect(p.x, p.y, 2, 2);
  }

  requestAnimationFrame(() => animate(ctx, particles)); // reuse same array
}

// Result: ~zero allocation per frame -> the nursery isn't churned -> no periodic
// Minor-GC stutter. Verify in the Performance panel: the memory track goes flat
// and the GC events disappear from the hot section.`}
      />
    </Stack>
  );
}
