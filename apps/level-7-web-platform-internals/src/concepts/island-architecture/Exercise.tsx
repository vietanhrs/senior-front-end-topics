import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A content site was built as a SPA: one root hydrates the entire page, shipping
// 240KB even though only the search box and cart badge are interactive. Two
// "islands" also need to talk (adding to cart updates the badge), and the dev
// reached for React context across them. Re-architect as islands.

// app entry — one root for everything
hydrateRoot(document.getElementById('app'), <WholePage />);

// they tried to share state via context spanning both interactive widgets:
<CartContext.Provider value={cart}>
  <Header />     {/* static, but now inside the app → ships + hydrates */}
  <Article />    {/* static */}
  <SearchBox />  {/* interactive */}
  <CartBadge />  {/* interactive */}
  <Footer />     {/* static */}
</CartContext.Provider>`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: convert the SPA to islands"
        description="Render the page as static HTML, hydrate only the two interactive regions as independent roots, and make them communicate WITHOUT a shared React tree. Explain the trade-offs you're accepting."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Server-render everything to HTML; on the client, <code>createRoot</code>/<code>hydrateRoot</code>
        only the <code>#search</code> and <code>#cart</code> containers. Islands can't share React
        context — use a framework-agnostic store read via <code>useSyncExternalStore</code> (or
        custom events / <code>BroadcastChannel</code>).
      </Callout>

      <SolutionReveal
        code={`// 1) The page is static HTML (from the server). No app-wide root.
//    Each island is its own root, mounted into its marker element:
import { hydrateRoot } from 'react-dom/client';

const islands = [
  ['#search', () => import('./islands/SearchBox')],
  ['#cart',   () => import('./islands/CartBadge')],
];
for (const [selector, load] of islands) {
  const el = document.querySelector(selector);
  if (el) load().then(({ default: Comp }) => hydrateRoot(el, <Comp />));
}
// Header/Article/Footer are never hydrated → they ship 0 JS.

// 2) Cross-island state via a framework-agnostic external store (no shared tree):
const cartStore = (() => {
  let count = 0; const subs = new Set<() => void>();
  return {
    add() { count++; subs.forEach((f) => f()); },
    get: () => count,
    subscribe(f: () => void) { subs.add(f); return () => subs.delete(f); },
  };
})();

// both islands read the SAME store with useSyncExternalStore (tearing-safe):
function useCartCount() {
  return useSyncExternalStore(cartStore.subscribe, cartStore.get);
}
// SearchBox/CartBadge import cartStore; adding from one updates the other,
// even though they live in separate roots. (Custom events or BroadcastChannel
// across tabs are alternatives.)

// Trade-offs accepted:
//  - no shared React context/tree across islands → coordinate via store/events;
//  - props passed to an island must be serializable (static→island boundary);
//  - ensure the framework runtime is a shared chunk, not bundled per island;
//  - great for this mostly-static content site; wouldn't help a fully-interactive app.`}
      />
    </Stack>
  );
}
