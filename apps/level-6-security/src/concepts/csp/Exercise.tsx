import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `# This CSP looks strict but provides almost no XSS protection,
# and has two clickjacking/redirect gaps. Harden it.

Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:;
  style-src 'self' 'unsafe-inline';
  img-src *;
  # no object-src, no base-uri, no frame-ancestors
  # delivered via <meta http-equiv> in index.html`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: turn this into a real (strict) CSP"
        description="List why this policy fails to stop XSS, then rewrite it as a nonce-based strict CSP. Also close the base-tag, plugin, and clickjacking gaps — and note one delivery bug."
      >
        <CodeHighlight code={buggy} language="text" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>'unsafe-inline'</code> in <code>script-src</code> lets injected inline scripts run —
        that's the whole ballgame. Replace it with a per-response <code>'nonce-…'</code> +{' '}
        <code>'strict-dynamic'</code>. Add <code>object-src</code>, <code>base-uri</code>,{' '}
        <code>frame-ancestors</code>. And <code>frame-ancestors</code> is ignored in a{' '}
        <code>&lt;meta&gt;</code> CSP.
      </Callout>

      <SolutionReveal
        language="text"
        code={`# Problems:
#  1) script-src 'unsafe-inline' → injected <script> runs → CSP gives ~no XSS protection.
#  2) 'unsafe-eval' + data: in script-src → eval and data: URL scripts run (both XSS vectors).
#  3) https: as a script source = any HTTPS host is trusted (JSONP/open-redirect bypasses).
#  4) No object-src → legacy <object>/<embed> script execution.
#  5) No base-uri → <base href> injection hijacks all relative script URLs.
#  6) No frame-ancestors → clickjackable. AND it's in a <meta> tag, where frame-ancestors
#     is IGNORED — it must be a real response header.

# Strict CSP, sent as an HTTP RESPONSE HEADER (server injects a fresh nonce per response):
Content-Security-Policy:
  default-src 'self';
  script-src 'nonce-{{RANDOM_PER_RESPONSE}}' 'strict-dynamic' https: 'unsafe-eval';
      # ('https:' and 'unsafe-eval' are fallbacks IGNORED by browsers that honor strict-dynamic;
      #  drop 'unsafe-eval' entirely once no dependency needs it)
  style-src 'self';                 # remove 'unsafe-inline'; use classes / nonced styles
  img-src 'self' https: data:;
  connect-src 'self' https://api.example.com;
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  report-to csp-endpoint;

# Every legitimate <script> carries the matching nonce:
#   <script nonce="{{RANDOM_PER_RESPONSE}}" src="/app.js"></script>
# Roll out with Content-Security-Policy-Report-Only first, fix violations, then enforce.`}
      />
    </Stack>
  );
}
