import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Frontend (app.example) calls the API with a JWT and a trace header, with
// cookies. It works in Postman but the browser blocks it. The Express CORS
// config has FOUR bugs. Find and fix them.

app.use(cors({
  origin: '*',                                  // (1)
  methods: ['GET', 'POST'],                     // (2) the app also does PATCH/DELETE
  // (3) allowedHeaders not set
  credentials: true,                            // combined with origin '*' …
  // (4) no maxAge → preflight on every call
}));

// auth middleware runs BEFORE cors and 401s the OPTIONS request:
app.use(requireAuth);                            // (bonus) OPTIONS has no auth header

// client
fetch('https://api.example.com/orders/42', {
  method: 'PATCH',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt, 'X-Trace-Id': id },
  body: JSON.stringify(patch),
});`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the CORS config so the browser stops blocking it"
        description="Walk the preflight: which check fails first? Fix origin/credentials, methods, headers, caching, and the middleware ordering bug. Explain each."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Credentialed requests forbid <code>origin: '*'</code> and ignore <code>*</code> for
        methods/headers — echo the exact origin and list everything. <code>PATCH</code> and the
        custom/Authorization headers must be in the allow-lists. Add <code>maxAge</code>. And CORS
        (esp. OPTIONS) must be handled <i>before</i> auth.
      </Callout>

      <SolutionReveal
        language="js"
        code={`const ALLOWED_ORIGINS = ['https://app.example'];

app.use(cors({
  // (1) credentials require the EXACT origin, never '*'. Reflect from an allow-list.
  origin: (origin, cb) => cb(null, ALLOWED_ORIGINS.includes(origin)),  // sets Allow-Origin + Vary: Origin
  // (2) include every method the app uses (and OPTIONS for the preflight itself)
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  // (3) every NON-safelisted request header must be listed (content-type counts here
  //     because the value is application/json; plus Authorization + X-Trace-Id)
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
  credentials: true,                 // sends Access-Control-Allow-Credentials: true
  // (4) cache the preflight so it isn't sent before every PATCH
  maxAge: 600,
  // expose any response headers the client must READ (also no '*' with credentials):
  exposedHeaders: ['X-Request-Id'],
}));

// (bonus) Handle CORS/preflight BEFORE auth — the OPTIONS request carries no
// Authorization header, so requireAuth would 401 it and the preflight fails.
// cors() above short-circuits OPTIONS with 204; ensure it's mounted before:
app.use(requireAuth);

// Why each fix:
//  (1) browser discards a credentialed response whose Allow-Origin is '*'.
//  (2) PATCH wasn't in Allow-Methods → preflight fails on the method check.
//  (3) Authorization/X-Trace-Id/content-type weren't allowed → header check fails;
//      '*' wouldn't help because the request is credentialed.
//  (4) without Max-Age every PATCH pays an extra OPTIONS round trip.
//  (bonus) auth-before-CORS turns the unauthenticated OPTIONS into a 401 → blocked.
// Don't forget Vary: Origin so shared caches don't serve the wrong Allow-Origin.`}
      />
    </Stack>
  );
}
