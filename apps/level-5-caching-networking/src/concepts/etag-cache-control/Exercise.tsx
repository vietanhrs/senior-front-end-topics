import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `# A web app's caching config. Every line has a problem. Fix the headers.

/index.html
  Cache-Control: max-age=31536000        # (1) users keep an old HTML for a YEAR
                                          #     → it references deleted hashed bundles

/assets/app.3f9c2b.js                     # content-hashed bundle
  Cache-Control: no-store                 # (2) re-downloaded on EVERY page view

/api/profile                              # personal data
  Cache-Control: public, max-age=3600     # (3) cached by CDNs/proxies for everyone!

/api/products                             # large, changes a few times a day
  Cache-Control: no-cache                 # (4) revalidates, but there's no ETag →
  (no validator)                          #     every revalidation is a full 200 body`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the caching headers"
        description="Four resources, four misconfigurations: a year-cached HTML entry point, a never-cached immutable bundle, publicly cached personal data, and validator-less revalidation. Write the correct headers."
      >
        <CodeHighlight code={buggy} language="text" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        HTML references hashed assets → it must revalidate every time (cheaply). Hashed assets
        never change at their URL → cache forever. Personal data must stay out of shared caches.
        no-cache without a validator forfeits 304s.
      </Callout>

      <SolutionReveal
        language="text"
        code={`/index.html
  Cache-Control: no-cache              # store, but revalidate on every use
  ETag: "<content-hash>"               # → usually a tiny 304, never a stale entry point
  # (1) fixed: users always get HTML that references the CURRENT hashed bundles

/assets/app.3f9c2b.js
  Cache-Control: public, max-age=31536000, immutable
  # (2) fixed: the hash IS the version — cache a year, skip even reload revalidation;
  #     deploys change the URL, not the content at this URL

/api/profile
  Cache-Control: private, no-store     # personal → never in shared caches;
  # (3) fixed: no-store if truly sensitive, or "private, no-cache" + ETag if
  #     browser-only caching with revalidation is acceptable

/api/products
  Cache-Control: max-age=60, stale-while-revalidate=600
  ETag: "<collection-version>"
  # (4) fixed: short freshness window + SWR for instant UX, and an ETag so the
  #     background revalidations are ~free 304s instead of full bodies`}
      />
    </Stack>
  );
}
