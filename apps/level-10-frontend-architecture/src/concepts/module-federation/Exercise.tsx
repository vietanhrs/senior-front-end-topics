import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Host + remote federation config. In production users hit "Invalid hook call",
// Context from the shell is undefined inside the remote, and the bundle ships
// React three times.
// --- shell webpack.config.js ---
new ModuleFederationPlugin({
  name: 'shell',
  remotes: { catalog: 'catalog@/catalog/remoteEntry.js' },
  // no shared section at all → every remote bundles its own React
});

// --- catalog (remote) webpack.config.js ---
new ModuleFederationPlugin({
  name: 'catalog',
  exposes: { './App': './src/App' },
  shared: { react: {}, 'react-dom': {} },   // shared, but NOT singleton
});`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the shared dependency config"
        description="The shell shares nothing and the remote shares React without singleton, so multiple React instances load — invalid hook calls, dead Context, and triplicated bytes. Configure shared singletons with sane version handling."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Both sides must declare the same framework deps as <code>shared</code> with{' '}
        <code>singleton: true</code> so exactly one React instance is negotiated. Add{' '}
        <code>requiredVersion</code> (and consider <code>strictVersion</code> to fail fast on skew),
        and <code>eager</code> for deps the shell needs at boot. Align major versions across teams.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// Shared config that BOTH host and remotes use (keep it in one place and import).
const shared = {
  react: { singleton: true, requiredVersion: '^18.2.0', eager: true },
  'react-dom': { singleton: true, requiredVersion: '^18.2.0', eager: true },
  // also singleton any module-level-stateful lib: router, state store, styling, i18n
  'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
};

// --- shell webpack.config.js ---
new ModuleFederationPlugin({
  name: 'shell',
  remotes: { catalog: 'catalog@/catalog/remoteEntry.js' },
  shared,                       // the host MUST share too, or it keeps its own copy
});

// --- catalog (remote) webpack.config.js ---
new ModuleFederationPlugin({
  name: 'catalog',
  exposes: { './App': './src/App' },
  shared,                       // same declaration → one negotiated instance
});

// Optional: fail the build instead of silently risking API skew across majors.
//   react: { singleton: true, requiredVersion: '^18.2.0', strictVersion: true }

// Why it works: singleton:true makes the runtime pick ONE React (the highest
// version satisfying every requiredVersion) and load it once. Hooks share a single
// dispatcher and the shell's Context is visible inside the remote — no "Invalid
// hook call", no duplicated reconciler, React shipped once instead of 3×. eager
// avoids an extra round-trip for the boot-critical singletons; strictVersion turns
// a silent runtime risk into a loud build error so version skew is caught early.`}
      />
    </Stack>
  );
}
