import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A comment system sanitizes HTML by stripping <script> and on* handlers, then
// renders it. Elsewhere, app code reads "globals". An attacker posts a comment
// containing only <a>/<form> with id/name — no script — and escalates.
// Find the clobbering vectors and harden the code (not just the sanitizer).

// 1) feature flags read from a global the page "might" define
function isFeatureOn(name) {
  return !!window[name];                       // attacker: <div id="featureBetaPay"></div>
}

// 2) config with a fallback
const config = window.appConfig || { uploadUrl: '/upload', maxMb: 5 };
fetch(config.uploadUrl, { method: 'POST', body: file });

// 3) nested lookup used to build an API URL
const base = document.api.base;                // <form id=api><a id=base href=//evil></a></form>
fetch(base + '/me');

// sanitizer config (allow-list of tags only)
const clean = DOMPurify.sanitize(commentHtml, { ALLOWED_TAGS: ['a', 'b', 'i', 'p', 'form', 'input'] });`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: defeat the DOM-clobbering escalation"
        description="Harden the three lookups so injected HTML can't steer them, and fix the sanitizer so it can't seed clobbering. Explain why each change works."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        A clobbered value is always a DOM node — type-check against <code>Node</code>/<code>Element</code>.
        Don't source config from <code>window</code>/<code>document</code> named access at all. And
        strip <code>id</code>/<code>name</code> in the sanitizer (DOMPurify{' '}
        <code>SANITIZE_NAMED_PROPS</code>), since allow-listing tags still permits the attribute that
        creates the global.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// 0) Stop the sanitizer from SEEDING clobbering: drop id/name (and use DOM hardening).
const clean = DOMPurify.sanitize(commentHtml, {
  ALLOWED_TAGS: ['a', 'b', 'i', 'p'],     // (dropping form/input also removes nested-access vectors)
  SANITIZE_NAMED_PROPS: true,             // namespaces/strips id & name → no window.x / form.y access
  SANITIZE_DOM: true,
});

// 1) Don't trust window[name] for flags. Read from a real, app-owned source.
const FEATURES = Object.freeze({ betaPay: false });   // real module constant
function isFeatureOn(name) {
  return FEATURES[name] === true;          // not window[name]
}

// 2) Config comes from a module/const (or JSON in a known element you parse),
//    never a clobberable global. If you must read a global, type-check it:
import { appConfig as configFromModule } from './config';
function safeObject(v, fallback) {
  return v && typeof v === 'object' && !(v instanceof Node) ? v : fallback;
}
const config = safeObject(configFromModule, { uploadUrl: '/upload', maxMb: 5 });

// 3) Build URLs from trusted constants, not document.<id>.<name> lookups.
const API_BASE = 'https://api.example.com';   // const shadows any clobbered global
fetch(API_BASE + '/me');

// Why it works:
//  - SANITIZE_NAMED_PROPS removes the id/name attributes that create the
//    window/document/collection properties → the vectors never exist.
//  - Reading config from modules/consts (which shadow named-access globals) and
//    type-checking against Node means injected elements can't satisfy the checks.
//  - No script runs in any of this, so CSP/Trusted Types wouldn't have helped —
//    it's purely lookup-integrity.`}
      />
    </Stack>
  );
}
