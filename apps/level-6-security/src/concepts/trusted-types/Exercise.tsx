import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A widget renders server-provided HTML and loads a remote script.
// The team enabled "require-trusted-types-for 'script'" and the app now throws
// TypeErrors at these sinks. "Fix" it WITHOUT just disabling Trusted Types.
// (Bonus bug: the proposed quick-fix policy below is a pass-through.)

function renderBio(el, bioHtml) {
  el.innerHTML = bioHtml;                 // ❌ TypeError under Trusted Types
}

function loadPlugin(url) {
  const s = document.createElement('script');
  s.src = url;                            // ❌ TrustedScriptURL required
  document.head.appendChild(s);
}

// Someone's quick fix — what's wrong with it?
const policy = trustedTypes.createPolicy('default', {
  createHTML: (s) => s,                   // ❌ pass-through = no protection
  createScriptURL: (s) => s,
});`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: adopt Trusted Types correctly"
        description="Route the two sinks through real policies, put sanitization/validation inside them, and explain why the pass-through 'default' policy defeats the point."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Create named policies whose transforms actually sanitize (DOMPurify for HTML) and validate
        (allow-list of origins for script URLs). Avoid a permissive <code>default</code> policy; if
        you must have one, make it strict. Lock the allowed policy names in CSP.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// 1) Policies with REAL transforms — this is the single trust boundary.
const htmlPolicy = trustedTypes.createPolicy('sanitize-html', {
  createHTML: (s) => DOMPurify.sanitize(s),       // actual sanitization
});

const SCRIPT_ORIGINS = ['https://cdn.example.com'];
const urlPolicy = trustedTypes.createPolicy('script-url', {
  createScriptURL: (s) => {
    const u = new URL(s, location.origin);
    if (!SCRIPT_ORIGINS.includes(u.origin)) throw new Error('blocked script origin: ' + u.origin);
    return u.href;                                 // validated allow-list
  },
});

function renderBio(el, bioHtml) {
  el.innerHTML = htmlPolicy.createHTML(bioHtml);   // ✅ TrustedHTML accepted
}

function loadPlugin(url) {
  const s = document.createElement('script');
  s.src = urlPolicy.createScriptURL(url);          // ✅ TrustedScriptURL accepted
  document.head.appendChild(s);
}

// 2) Why the pass-through 'default' policy is wrong:
//    createHTML: (s) => s  applies to EVERY sink value app-wide and returns it
//    unchanged → it satisfies the type check while doing zero sanitization, so
//    DOM XSS is fully back. The policy IS the protection; an identity transform
//    removes it.

// 3) Lock the policy names in CSP so an attacker can't register a permissive one:
//    Content-Security-Policy:
//      require-trusted-types-for 'script';
//      trusted-types sanitize-html script-url;   // no 'default', explicit names only`}
      />
    </Stack>
  );
}
