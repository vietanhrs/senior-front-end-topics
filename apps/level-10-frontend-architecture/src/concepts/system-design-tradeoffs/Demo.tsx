import { useMemo, useState } from 'react';
import { Badge, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

type Freshness = 'static' | 'periodic' | 'per-request' | 'realtime';
type Interactivity = 'content' | 'app';
type Team = 'one' | 'many';

interface Reqs {
  seo: boolean;
  freshness: Freshness;
  personalized: boolean;
  interactivity: Interactivity;
  team: Team;
  offline: boolean;
}

interface Rec {
  rendering: string;
  architecture: string;
  tradeoffs: string[];
  warnings: string[];
}

function recommend(r: Reqs): Rec {
  let rendering: string;
  const tradeoffs: string[] = [];
  const warnings: string[] = [];

  if (r.freshness === 'static' && !r.personalized) {
    rendering = r.seo ? 'SSG (prerender at build)' : 'SSG, or CSR if SEO truly irrelevant';
    tradeoffs.push('content is fixed until the next build — fast + cacheable, but not live');
  } else if (r.freshness === 'periodic' && !r.personalized) {
    rendering = 'ISR / SSG + revalidate';
    tradeoffs.push('readers may see content up to the revalidation window old');
  } else if (r.freshness === 'realtime') {
    rendering = r.seo ? 'Streamed shell (SSR/RSC) + realtime client layer (WS/SSE)' : 'CSR SPA + realtime client layer';
    tradeoffs.push('realtime layer adds a socket + reconnection/consistency handling');
  } else {
    // per-request or personalized
    if (r.interactivity === 'content') {
      rendering = 'RSC + streaming (client islands for the interactive bits)';
      tradeoffs.push('needs an RSC-capable framework; serialization boundary discipline');
    } else {
      rendering = r.seo ? 'SSR (edge SSR if global + data co-located) + hydration' : 'CSR SPA (prerender the shell if first paint matters)';
      tradeoffs.push('SSR/edge adds server cost; mind data gravity if rendering at the edge');
    }
  }

  if (r.interactivity === 'app' && rendering.startsWith('SSG')) {
    warnings.push('A highly interactive app on pure SSG ships a big hydration bundle — consider RSC/SSR + islands.');
  }
  if (r.personalized && (rendering.startsWith('SSG') || rendering.startsWith('ISR'))) {
    warnings.push('Personalized content can’t be globally cached — personalize on the client or use SSR/edge for the per-user parts.');
  }

  const architecture = r.team === 'many'
    ? 'Micro-frontends (per-team independent deploy) + shared design system'
    : 'Modular monolith (single deploy)';
  if (r.team === 'many') {
    tradeoffs.push('MFEs add orchestration, shared-dep (singleton) management, and consistency work');
  } else {
    tradeoffs.push('one deploy unit — simplest; split only when team autonomy becomes the bottleneck');
  }
  if (r.team === 'one') {
    warnings.push('With one team, do NOT adopt micro-frontends — you’d pay all the cost for none of the autonomy.');
  }

  if (r.offline) {
    tradeoffs.push('offline-first: local store as source of truth + outbox + conflict resolution (real but heavy)');
  }

  return { rendering, architecture, tradeoffs, warnings };
}

function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div>
      <Text size="sm" fw={500} mb={4}>{label}</Text>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <Badge
            key={o.v}
            variant={value === o.v ? 'filled' : 'outline'}
            color={value === o.v ? 'indigo' : 'gray'}
            style={{ cursor: 'pointer' }}
            onClick={() => onChange(o.v)}
          >
            {o.l}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function Demo() {
  const [reqs, setReqs] = useState<Reqs>({
    seo: true,
    freshness: 'per-request',
    personalized: true,
    interactivity: 'app',
    team: 'one',
    offline: false,
  });
  const set = <K extends keyof Reqs>(k: K, v: Reqs[K]) => setReqs((r) => ({ ...r, [k]: v }));
  const rec = useMemo(() => recommend(reqs), [reqs]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Pick the constraints — get an architecture + the trade-offs">
        There's no universally best architecture, only fit. Set the requirements and see a recommended
        rendering strategy and topology, the trade-offs it accepts, and warnings for combinations that
        fight each other. It's a heuristic starting point, not a law.
      </Callout>

      <DemoCard title="Requirements">
        <Stack gap="sm">
          <Choice label="SEO / fast first load matters?" value={reqs.seo ? 'yes' : 'no'} onChange={(v) => set('seo', v === 'yes')} options={[{ v: 'yes', l: 'yes' }, { v: 'no', l: 'no' }]} />
          <Choice label="Content freshness" value={reqs.freshness} onChange={(v) => set('freshness', v)} options={[{ v: 'static', l: 'static' }, { v: 'periodic', l: 'periodic' }, { v: 'per-request', l: 'per-request' }, { v: 'realtime', l: 'realtime' }]} />
          <Choice label="Personalized per user?" value={reqs.personalized ? 'yes' : 'no'} onChange={(v) => set('personalized', v === 'yes')} options={[{ v: 'yes', l: 'yes' }, { v: 'no', l: 'no' }]} />
          <Choice label="Interactivity" value={reqs.interactivity} onChange={(v) => set('interactivity', v)} options={[{ v: 'content', l: 'content page' }, { v: 'app', l: 'rich app' }]} />
          <Choice label="Org scale" value={reqs.team} onChange={(v) => set('team', v)} options={[{ v: 'one', l: 'one team' }, { v: 'many', l: 'many teams' }]} />
          <Choice label="Offline-capable?" value={reqs.offline ? 'yes' : 'no'} onChange={(v) => set('offline', v === 'yes')} options={[{ v: 'yes', l: 'yes' }, { v: 'no', l: 'no' }]} />
        </Stack>
      </DemoCard>

      <DemoCard title="Recommendation">
        <Stack gap="sm">
          <div>
            <Text size="xs" c="dimmed">rendering</Text>
            <Badge size="lg" variant="light" color="indigo">{rec.rendering}</Badge>
          </div>
          <div>
            <Text size="xs" c="dimmed">topology</Text>
            <Badge size="lg" variant="light" color="teal">{rec.architecture}</Badge>
          </div>
          <div>
            <Text size="sm" fw={600} mb={2}>trade-offs you're accepting</Text>
            <Stack gap={2}>
              {rec.tradeoffs.map((t, i) => <Text key={i} size="sm">• {t}</Text>)}
            </Stack>
          </div>
        </Stack>
      </DemoCard>

      {rec.warnings.length > 0 && (
        <Callout kind="warning" title="Tensions in this combination">
          <Stack gap={2}>
            {rec.warnings.map((w, i) => <Text key={i} size="sm">• {w}</Text>)}
          </Stack>
        </Callout>
      )}
    </Stack>
  );
}
