import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Resolve the shared workbook engine to its TS source so Vite transpiles it as
// first-class app source (proper HMR, no node_modules pre-bundling surprises).
const workbookSrc = new URL('../../packages/workbook/src', import.meta.url).pathname;

// Level 1 — Fundamentals workbook.
// Manual chunk names below make the "Code splitting" / "Dynamic import chunking"
// concepts observable in the Network tab (chunk file names are stable & readable).
export default defineConfig({
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
        manualChunks: {
          mantine: ['@mantine/core', '@mantine/hooks'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
});
