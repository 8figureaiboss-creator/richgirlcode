import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      'npm:@base44/sdk': fileURLToPath(new URL('./test/stubs/base44sdk.ts', import.meta.url)),
    },
  },
  test: { include: ['test/**/*.test.ts'] },
});
