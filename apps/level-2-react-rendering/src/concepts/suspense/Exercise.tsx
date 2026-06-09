import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Two problems:
// (1) One boundary wraps everything, so the slow <Comments> hides the fast
//     <Profile> too — the whole page shows a skeleton until the slowest finishes.
// (2) Each child creates its promise on mount, and <Comments> only mounts after
//     <Profile> resolves -> a request WATERFALL.
function Page({ userId }) {
  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <Profile userId={userId} />       {/* fetches user (fast) */}
      <Comments userId={userId} />      {/* fetches comments (slow) */}
    </Suspense>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the boundary placement and the waterfall"
        description="Let the fast content show as soon as it's ready, and load the two requests in parallel instead of sequentially."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Give each independently-loadable region its own boundary so they reveal separately. To
        avoid the waterfall, start both requests before rendering (hoist them) so the promises are
        already in flight regardless of mount order.
      </Callout>

      <SolutionReveal
        code={`function Page({ userId }) {
  // Kick BOTH requests off now, in parallel — not on child mount.
  const userPromise = fetchUser(userId);
  const commentsPromise = fetchComments(userId);

  return (
    <>
      {/* Fast region reveals as soon as the user resolves */}
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile userPromise={userPromise} />
      </Suspense>

      {/* Slow region has its own boundary -> doesn't hold up Profile */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </>
  );
}

function Profile({ userPromise }) {
  const user = use(userPromise);       // suspends only this boundary
  return <h1>{user.name}</h1>;
}
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return <ul>{comments.map((c) => <li key={c.id}>{c.text}</li>)}</ul>;
}

// Both fetches were started together (parallel); each boundary reveals
// independently as its data arrives.`}
      />
    </Stack>
  );
}
