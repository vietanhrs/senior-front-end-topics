import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// This predicate decides whether a request needs a preflight.
// It has 3 bugs that misclassify requests. Find and fix them.
function isSimpleRequest({ method, contentType, headers }) {
  const simpleMethods = ['GET', 'POST'];            // (1)
  const safelistCT = ['application/json'];          // (2)
  const safeHeaders = ['accept', 'content-type'];

  if (!simpleMethods.includes(method)) return false;
  if (!safelistCT.includes(contentType)) return false;
  // (3) case-sensitive comparison
  if (headers.some((h) => !safeHeaders.includes(h))) return false;
  return true;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the simple-vs-preflight predicate"
        description="The function below has 3 bugs that misclassify requests (especially application/json and HEAD). Find and fix them."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        (1) Which method is missing from the simple group? (2) Is <code>application/json</code>
        really safelisted? (3) HTTP header names are case-insensitive.
      </Callout>

      <SolutionReveal
        language="js"
        notes="Three bugs: HEAD is missing; application/json is NOT safelisted (the list's meaning was inverted); the comparison must be lowercased."
        code={`function isSimpleRequest({ method, contentType, headers }) {
  const simpleMethods = ['GET', 'HEAD', 'POST'];          // (1) add HEAD

  // (2) these are the SAFELISTED Content-Types; json is NOT one of them
  const safelistCT = [
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ];
  const safeHeaders = ['accept', 'accept-language', 'content-language',
                       'content-type', 'range'];

  if (!simpleMethods.includes(method.toUpperCase())) return false;
  if (!safelistCT.includes(contentType)) return false;

  // (3) normalize to lowercase before comparing
  if (headers.some((h) => !safeHeaders.includes(h.toLowerCase()))) return false;

  return true;
}

// Consequence: fetch(PUT|DELETE), or POST with Content-Type: application/json,
// or an Authorization header -> all NEED a preflight.`}
      />
    </Stack>
  );
}
