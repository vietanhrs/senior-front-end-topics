import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Level 1 — Fundamentals workbook.
// Manual chunk names below make the "Code splitting" / "Dynamic import chunking"
// concepts observable in the Network tab (chunk file names are stable & readable).
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
