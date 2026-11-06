import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests for the pure logic (the packing engine and friends). Same `@/` alias as
// tsconfig, Node environment, no browser.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
