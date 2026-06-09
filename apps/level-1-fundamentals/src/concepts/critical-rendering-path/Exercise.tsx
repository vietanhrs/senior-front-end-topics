import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const before = `<!doctype html>
<html>
  <head>
    <!-- analytics blocks the parser even though it's not needed for first paint -->
    <script src="/analytics.js"></script>

    <!-- all CSS is render-blocking, including below-the-fold styles -->
    <link rel="stylesheet" href="/all.css" />

    <!-- heavy app bundle, synchronous, at the very top -->
    <script src="/app.bundle.js"></script>
  </head>
  <body>
    <main>...</main>
  </body>
</html>`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: optimize the <head> for the Critical Rendering Path"
        description="The <head> below makes FCP very slow. Identify the 3 problems and rewrite it so first paint is as fast as possible without changing behavior."
      >
        <CodeHighlight code={before} language="html" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint — answer these before revealing the solution">
        (1) Does analytics need to run before first paint? (2) Is ALL of the CSS truly
        render-blocking-critical? (3) What does a synchronous app bundle in{' '}
        <code>&lt;head&gt;</code> do to the parser?
      </Callout>

      <SolutionReveal
        language="html"
        notes="Key idea: split out critical CSS, use defer/async in the right places, and don't let an independent script block the parser."
        code={`<!doctype html>
<html>
  <head>
    <!-- 1) Inline critical CSS for above-the-fold -> paint early -->
    <style>/* small critical css */</style>

    <!-- 2) The rest of the CSS: load without blocking render
            (preload + onload swaps it to a stylesheet) -->
    <link rel="preload" href="/rest.css" as="style"
          onload="this.rel='stylesheet'" />

    <!-- 3) App bundle: defer -> doesn't block the parser, keeps order,
            runs before DOMContentLoaded -->
    <script src="/app.bundle.js" defer></script>

    <!-- 4) Independent analytics, no ordering, no DOM needed:
            async -> fetch/run any time, never blocks -->
    <script src="/analytics.js" async></script>
  </head>
  <body>
    <main>...</main>
  </body>
</html>`}
      />
    </Stack>
  );
}
