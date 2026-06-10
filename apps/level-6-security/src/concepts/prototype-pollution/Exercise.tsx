import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A query-string-to-object parser + a settings deep-merge. An attacker visits
//   ?__proto__[isAdmin]=true&__proto__[theme][allowEval]=1
// and pollutes every object. Fix BOTH the parser and the merge.

function parseQuery(search) {
  const out = {};
  for (const [rawKey, value] of new URLSearchParams(search)) {
    // supports nested keys like "a[b][c]"
    const keys = rawKey.replace(/\\]/g, '').split('[');
    let cur = out;
    for (let i = 0; i < keys.length - 1; i++) {
      cur = cur[keys[i]] ??= {};        // ❌ no key filtering
    }
    cur[keys.at(-1)] = value;
  }
  return out;
}

function deepMerge(target, source) {
  for (const key in source) {           // ❌ also walks inherited keys
    if (source[key] && typeof source[key] === 'object') {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];        // ❌ key may be __proto__
    }
  }
  return target;
}

const settings = deepMerge({ ...defaults }, parseQuery(location.search));`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stop prototype pollution in the parser + merge"
        description="Reject dangerous keys, only copy own properties, and choose a structure that can't be polluted for untrusted key→value data. Then note the strongest global mitigation."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Block <code>__proto__</code>/<code>constructor</code>/<code>prototype</code> in both walks,
        use <code>Object.hasOwn</code> (not <code>for…in</code>), and prefer{' '}
        <code>Object.create(null)</code> / <code>Map</code> for untrusted dictionaries. Validating
        to a schema avoids blind merge entirely.
      </Callout>

      <SolutionReveal
        language="js"
        code={`const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const safeKey = (k) => !FORBIDDEN.has(k);

function parseQuery(search) {
  const out = Object.create(null);                 // no prototype to pollute
  for (const [rawKey, value] of new URLSearchParams(search)) {
    const keys = rawKey.replace(/\\]/g, '').split('[');
    if (!keys.every(safeKey)) continue;            // drop dangerous paths entirely
    let cur = out;
    for (let i = 0; i < keys.length - 1; i++) {
      if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = Object.create(null);
      cur = cur[keys[i]];
    }
    cur[keys.at(-1)] = value;
  }
  return out;
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {          // OWN, enumerable keys only
    if (!safeKey(key)) continue;                    // never write __proto__ etc.
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      target[key] = deepMerge(Object.hasOwn(target, key) ? target[key] : {}, val);
    } else {
      target[key] = val;
    }
  }
  return target;
}

// Best of all: don't blind-merge untrusted input — validate to a known schema.
const settings = SettingsSchema.parse(parseQuery(location.search)); // zod/valibot
// drops unknown/dangerous keys and yields a typed, shape-checked object.

// Strongest global backstop (test compatibility): freeze the prototype.
//   Object.freeze(Object.prototype);   // pollution writes now throw in strict mode`}
      />
    </Stack>
  );
}
