import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Infinite-scroll + lazy images, but it janks and misbehaves:
// (1) reads layout in a scroll handler on every scroll event,
// (2) creates a NEW observer per image,
// (3) keeps firing after an image has loaded,
// (4) never disconnects → leaks,
// (5) loads images only once fully on screen (too late, visible blank).
function setupFeed(container, images, loadMore) {
  container.addEventListener('scroll', () => {
    for (const img of images) {
      const r = img.getBoundingClientRect();          // (1) forced layout per scroll
      if (r.top < window.innerHeight) img.src = img.dataset.src;  // (3)(5)
    }
    const last = images[images.length - 1].getBoundingClientRect();
    if (last.bottom < window.innerHeight) loadMore();
  });
  images.forEach((img) => new IntersectionObserver(() => {}).observe(img)); // (2)(4)
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: rebuild it on IntersectionObserver correctly"
        description="Replace the scroll-handler layout reads with one shared observer, preload images slightly before they enter the viewport, unobserve each after loading, watch a sentinel for infinite scroll, and clean up."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        One observer for all images with <code>rootMargin</code> to preload ahead;{' '}
        <code>unobserve</code> each image once loaded; a separate observer on a sentinel element at
        the end triggers <code>loadMore</code>; return a cleanup that <code>disconnect()</code>s both.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function setupFeed(container, images, sentinel, loadMore) {
  // (1)(2) ONE shared observer; no scroll handler, no getBoundingClientRect.
  // (5) rootMargin preloads images ~300px before they enter the viewport.
  const imgObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const img = e.target;
        img.src = img.dataset.src;
        imgObserver.unobserve(img);     // (3) load once, then stop watching it
      }
    },
    { root: null, rootMargin: '0px 0px 300px 0px', threshold: 0 },
  );
  images.forEach((img) => imgObserver.observe(img));

  // separate observer on a sentinel at the end → infinite scroll
  const sentinelObserver = new IntersectionObserver(
    (entries) => { if (entries.some((e) => e.isIntersecting)) loadMore(); },
    { root: null, rootMargin: '0px 0px 600px 0px' },
  );
  sentinelObserver.observe(sentinel);

  // (4) cleanup: disconnect both (call on unmount / disconnectedCallback)
  return () => { imgObserver.disconnect(); sentinelObserver.disconnect(); };
}

// When you add newly-loaded images from loadMore(), observe() them too.
// Why it's better: zero forced layout (IO measures off the critical path),
// one observer instead of N, images preload before they're visible, each stops
// firing after load, and everything is disconnected on teardown.
// (Bonus: native lazy-loading <img loading="lazy"> covers many cases without JS.)`}
      />
    </Stack>
  );
}
