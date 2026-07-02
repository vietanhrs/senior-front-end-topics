import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Resolve the shared workbook engine to its TS source so Vite transpiles it as
// first-class app source (proper HMR, no node_modules pre-bundling surprises).
const workbookSrc = new URL('../../packages/workbook/src', import.meta.url).pathname;

// The hub aggregates every level's concepts (imported from the sibling apps'
// src/concepts — fine inside the monorepo: Vite's fs.allow covers the
// workspace root, and all apps share identical tooling).
export default defineConfig({
  base: '/senior-front-end-topics/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@sfe/workbook': workbookSrc,
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mantine')) return 'mantine';
            if (
              id.includes('react-markdown') ||
              id.includes('remark') ||
              id.includes('micromark') ||
              id.includes('mdast') ||
              id.includes('unified')
            ) {
              return 'markdown';
            }
            return undefined;
          }
          // Keep dynamically-imported demo modules out of the level chunks so
          // Level 1's code-splitting demos still load as separate chunks.
          if (/HeavyWidget|mathPack|\.worker\./.test(id)) return undefined;
          // One chunk per level keeps individual files reasonable.
          const m = id.match(/apps\/level-(\d+)-/);
          if (m) return `level-${m[1]}`;
          return undefined;
        },
      },
    },
  },
});
