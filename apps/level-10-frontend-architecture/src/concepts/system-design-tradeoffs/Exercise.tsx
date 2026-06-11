import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Architecture proposal for a NEW internal analytics dashboard.
// Context: one team of 4, ~50 internal users, behind SSO (no SEO), data refreshes
// every few minutes, always online on the corp network.
const architecture = {
  rendering: 'edge SSR on every request',     // global POPs for 50 same-office users
  topology: 'micro-frontends (5 remotes)',    // one team of 4 people
  federation: 'Module Federation across the 5 remotes',
  data: 'offline-first + CRDTs for the charts',// always-online internal tool
  compute: 'WASM module for client-side aggregation', // a few thousand rows
  state: 'custom distributed store synced over WebRTC between tabs',
};
// "It uses everything we read about this year." Ship it?`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: right-size this architecture"
        description="This proposal applies every advanced technique from the level to a small, internal, always-online dashboard built by one team. Identify which choices are speculative complexity and propose a right-sized architecture — naming the trade-offs."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Map each choice back to a <i>requirement</i>. No SEO + internal + few users → no need for edge
        SSR. One team → no micro-frontends/federation. Always online → no offline-first/CRDT. Small
        data → no WASM. Every abstraction has a carrying cost; keep only what a real constraint
        justifies, and state what you're trading away.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// Right-sized for the ACTUAL constraints (1 team, ~50 internal users, SSO/no SEO,
// minutes-fresh data, always online, small datasets):
const architecture = {
  // No SEO + internal + small audience → SSR/edge buys nothing. A CSR SPA (or a
  // prerendered shell) is simplest and cheapest to run.
  rendering: 'CSR SPA behind SSO (prerender the shell only if first paint matters)',

  // One team of 4 → a modular monolith. Micro-frontends + federation would add
  // orchestration, shared-singleton management, and consistency work for ZERO
  // team-autonomy benefit. Split later IF multiple teams ever own parts.
  topology: 'modular monolith, single deploy',

  // Always online on the corp network → offline-first + CRDTs are pure overhead
  // (tombstones, sync, conflict UX). Just fetch.
  data: 'server-cache library (TanStack Query/SWR) with periodic revalidation',

  // A few thousand rows aggregates in well under a frame in plain JS; the JS↔WASM
  // boundary + build complexity isn't worth it. Revisit only if profiling shows a
  // real CPU bottleneck on big datasets.
  compute: 'plain JS aggregation (move to a Worker only if it ever janks)',

  // Cross-tab sync, if needed at all, is BroadcastChannel — not a custom WebRTC store.
  state: 'local state + BroadcastChannel for the rare cross-tab case',
};

// Trade-offs accepted (say them out loud):
//  • CSR: slightly slower first paint than SSR — irrelevant for an authenticated
//    internal tool with returning users.
//  • Monolith: the whole app deploys together — fine for one team; revisit at multi-team scale.
//  • Fetch + revalidate (eventual freshness): data can be up to the revalidation
//    window stale — acceptable for "every few minutes" analytics.
//
// The senior point: each advanced technique (edge, MFEs, federation, offline/CRDT,
// WASM) is justified by a SPECIFIC binding constraint. None of those constraints
// exist here, so adopting them is speculative complexity — cost with no payoff.
// Choose the boring option, keep decisions reversible, and upgrade when (if) a real
// constraint shows up.`}
      />
    </Stack>
  );
}
