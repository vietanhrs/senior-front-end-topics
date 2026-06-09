import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// SSR page. Everything hydrates as one monolithic unit, so a slow/heavy
// <Comments> widget delays interactivity for the whole page — clicking the
// search box does nothing until ALL of it hydrates. Enable selective hydration.
function App() {
  return (
    <Shell>
      <SearchBar />     {/* users interact with this first */}
      <Article />
      <Comments />      {/* heavy, slow chunk */}
      <Recommendations />
    </Shell>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: let regions hydrate independently"
        description="Restructure so that an early click on the search box is handled without waiting for the heavy Comments widget to hydrate. Note what else (beyond JSX) has to be true."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Wrap independently-interactive regions in their own <code>&lt;Suspense&gt;</code>
        boundaries, and code-split the heavy ones so their JS arrives separately. Boundaries are
        the unit of selective hydration.
      </Callout>

      <SolutionReveal
        code={`const Comments = lazy(() => import('./Comments'));          // separate chunk
const Recommendations = lazy(() => import('./Recommendations'));

function App() {
  return (
    <Shell>
      {/* Its own boundary -> hydrates independently; an early click here
          makes React prioritize and hydrate THIS boundary first, then
          replay the event. */}
      <Suspense fallback={<SearchSkeleton />}>
        <SearchBar />
      </Suspense>

      <Suspense fallback={<ArticleSkeleton />}>
        <Article />
      </Suspense>

      {/* Heavy widget isolated: its slow hydration no longer blocks the rest */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>

      <Suspense fallback={<RecsSkeleton />}>
        <Recommendations />
      </Suspense>
    </Shell>
  );
}

// Requirements beyond JSX:
//  - Streaming SSR (renderToPipeableStream) + hydrateRoot on the client.
//  - Code-splitting along the boundaries so each region's JS is independent.
//  - A concurrent root (createRoot/hydrateRoot), not legacy ReactDOM.render.`}
      />
    </Stack>
  );
}
