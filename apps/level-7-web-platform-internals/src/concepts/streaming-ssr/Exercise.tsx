import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// SSR handler. TTFB is ~1.5s because the whole page awaits the slowest data
// (recommendations) before sending anything. Also: SEO tags depend on that slow
// call, and an error in recommendations 500s the entire page. Convert to
// streaming SSR with Suspense boundaries.

app.get('*', async (req, res) => {
  const [user, articles, recommendations] = await Promise.all([
    getUser(req),           // fast
    getArticles(req),       // fast
    getRecommendations(req) // SLOW (~1.5s)
  ]);
  const html = renderToString(
    <Page user={user} articles={articles} recommendations={recommendations} />
  );
  res.status(200).set('content-type', 'text/html').send(html);
});`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stream the shell, defer the slow section"
        description="Send the shell + fast content immediately and stream recommendations when ready. Keep SEO tags in the shell, and make a failure in recommendations not take down the page. Note what commits at first flush."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Wrap the slow region in <code>&lt;Suspense fallback&gt;</code> and fetch its data with a
        Suspense-enabled resource (so only that boundary waits). Use{' '}
        <code>renderToPipeableStream</code> with <code>onShellReady</code> to start streaming.
        Status/headers are sent at the shell flush — handle the slow section's errors inside its
        boundary; keep <code>&lt;head&gt;</code>/SEO in the shell.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// Page.jsx — only the slow part suspends; everything else is in the shell.
function Page({ user, articles, recsResource }) {
  return (
    <html>
      <head>
        {/* SEO/meta in the SHELL — must not depend on the slow data */}
        <title>{articles[0]?.title ?? 'Home'}</title>
      </head>
      <body>
        <Header user={user} />
        <Articles items={articles} />              {/* fast → in the shell */}
        <Suspense fallback={<RecsSkeleton />}>
          <ErrorBoundary fallback={<RecsUnavailable />}>
            <Recommendations resource={recsResource} />  {/* streams when ready */}
          </ErrorBoundary>
        </Suspense>
      </body>
    </html>
  );
}

// server: start the slow fetch but DON'T await it; let the boundary stream it.
app.get('*', async (req, res) => {
  const [user, articles] = await Promise.all([getUser(req), getArticles(req)]); // fast only
  const recsResource = wrapPromise(getRecommendations(req)); // suspends inside the boundary

  const { pipe, abort } = renderToPipeableStream(
    <Page user={user} articles={articles} recsResource={recsResource} />,
    {
      onShellReady() {
        // shell is renderable → commit status/headers and START streaming now
        res.status(200).set('content-type', 'text/html');
        pipe(res);                       // fast TTFB; recs stream later + swap script
      },
      onShellError(err) {
        // only fires if the SHELL itself failed (before first flush) → safe to 500
        res.status(500).send('<!doctype html>Something went wrong');
      },
      onError(err) { console.error(err); }, // boundary errors: logged; UI handled by ErrorBoundary
    },
  );
  // optional: setTimeout(abort, 10000) to cap total streaming time
});

// Key points:
//  - TTFB ≈ time to render the shell; recommendations no longer block it.
//  - Once onShellReady pipes, status/headers are COMMITTED — you can't 500 later,
//    so the slow section's failure is shown via its ErrorBoundary fallback, streamed in.
//  - SEO/head lives in the shell; a buffering proxy/compression must not buffer the stream.`}
      />
    </Stack>
  );
}
