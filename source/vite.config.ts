import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  root: mode === 'harness' ? 'harness' : '.',
  build:
    mode === 'harness'
      ? { outDir: '../dist/harness', emptyOutDir: true }
      : {
          outDir: 'dist/embed',
          emptyOutDir: true,
          cssCodeSplit: false,
          lib: { entry: 'web/entry.ts', name: 'OTACharts', formats: ['iife'], fileName: () => 'ota-charts.js' },
          minify: true,
          sourcemap: false,
        },
}));
