import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Every interactive widget hydrates eagerly at load, so a content page ships and
// executes all widget JS up front — including a heavy comments thread and a
// rarely-opened share menu far below the fold. Make hydration lazy per widget,
// and don't lose the user's first click on the lazy ones.

mountWidget('#hero-cta', HeroCta);       // above the fold — fine to be eager
mountWidget('#newsletter', Newsletter);  // not urgent
mountWidget('#comments', Comments);      // heavy, below the fold
mountWidget('#share', ShareMenu);        // rarely used

function mountWidget(sel, Comp) {
  hydrateRoot(document.querySelector(sel), <Comp />);  // all eager, all chunks loaded now
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: defer hydration per widget by trigger"
        description="Keep the hero eager, hydrate the newsletter on idle, comments on visible, and the share menu on first interaction — code-splitting each chunk so it loads on its trigger. Handle the inert-until-hydrated first click."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Pick the trigger per widget: eager / <code>requestIdleCallback</code> /{' '}
        <code>IntersectionObserver</code> / first <code>pointerover|focusin|click</code>. Dynamically
        <code>import()</code> the component inside the trigger so its chunk loads on demand. For the
        interaction trigger, capture and <b>replay</b> the triggering event after hydration.
      </Callout>

      <SolutionReveal
        code={`const HYDRATE = {
  '#hero-cta':   { load: () => import('./HeroCta'),     on: 'eager' },
  '#newsletter': { load: () => import('./Newsletter'),  on: 'idle' },
  '#comments':   { load: () => import('./Comments'),    on: 'visible' },
  '#share':      { load: () => import('./ShareMenu'),   on: 'interaction' },
};

for (const [sel, { load, on }] of Object.entries(HYDRATE)) {
  const el = document.querySelector(sel);
  if (!el) continue;
  hydrateOn(on, el, () => load().then(({ default: Comp }) => hydrateRoot(el, <Comp />)));
}

function hydrateOn(trigger, el, mount) {
  if (trigger === 'eager') return mount();

  if (trigger === 'idle')
    return (window.requestIdleCallback ?? ((cb) => setTimeout(cb, 200)))(mount);

  if (trigger === 'visible') {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); mount(); }
    });
    return io.observe(el);            // chunk loads only when scrolled into view
  }

  // interaction: hydrate on first intent — and REPLAY the event so the click isn't lost
  const events = ['pointerover', 'focusin', 'click'];
  const onFirst = (e) => {
    events.forEach((ev) => el.removeEventListener(ev, onFirst, true));
    mount();
    if (e.type === 'click') {
      // after hydration, re-dispatch so the freshly-wired handler sees the click
      queueMicrotask(() => e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    }
  };
  events.forEach((ev) => el.addEventListener(ev, onFirst, { capture: true, once: false }));
}

// Result: initial JS shrinks (only hero's chunk loads up front); comments &
// share never cost anything unless reached; the first click on the share menu
// is replayed so it "just works". Ensure each widget's SSR HTML matches its
// first client render to avoid hydration mismatch / layout shift.`}
      />
    </Stack>
  );
}
