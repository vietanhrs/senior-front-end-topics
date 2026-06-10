import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const before = `// Dashboard page. The render waterfall is:
//   HTML -> app.js (download+parse+exec) -> hydrate -> fetch(/api/me)
//        -> fetch(/api/widgets) -> render.
// Nothing on the screen until that whole serial chain finishes (~1.5s).

export default function App() {
  const [me, setMe] = useState(null);
  const [widgets, setWidgets] = useState(null);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then(setMe);            // starts after hydrate
  }, []);
  useEffect(() => {
    if (!me) return;
    fetch('/api/widgets?org=' + me.orgId).then((r) => r.json()).then(setWidgets); // waits for /me
  }, [me]);

  if (!me || !widgets) return <Spinner />;
  return <Dashboard me={me} widgets={widgets} />;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: flatten the render waterfall"
        description="Two problems: (1) data only starts after the JS bundle downloads, parses, and hydrates; (2) /widgets is chained behind /me. Start the data earlier and parallelize what you can. List the techniques."
      >
        <CodeHighlight code={before} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Start the requests before/independent of the bundle (preload <code>as="fetch"</code>,
        preconnect the API origin, or SSR/inline the data). Remove the <code>/me → /widgets</code>
        dependency if <code>orgId</code> is known up front, and fire independent requests in parallel.
      </Callout>

      <SolutionReveal
        code={`// 1) Start the API connection + critical request as early as possible, from the HTML
//    head — so it overlaps the bundle download instead of waiting for it:
//    <link rel="preconnect" href="https://api.example.com" crossorigin />
//    <link rel="preload" href="/api/me" as="fetch" crossorigin />

// 2) Don't chain /widgets behind /me. If orgId is known (cookie/JWT/SSR), fetch
//    both in parallel. Otherwise pass it from the server.
export default function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Parallel, not sequential. (Reuses the preloaded /api/me response.)
    Promise.all([
      fetch('/api/me').then((r) => r.json()),
      fetch('/api/widgets').then((r) => r.json()), // server scopes by session, no orgId dep
    ]).then(([me, widgets]) => setData({ me, widgets }));
  }, []);

  if (!data) return <Spinner />;
  return <Dashboard me={data.me} widgets={data.widgets} />;
}

// 3) Best: render on the server (RSC/SSR) or inline the initial data into the HTML,
//    eliminating the "bundle -> hydrate -> fetch" hops entirely. The data arrives
//    with the document, so the chain becomes HTML -> paint.`}
      />
    </Stack>
  );
}
