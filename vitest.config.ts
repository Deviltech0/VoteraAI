import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Vitest configuration for Votera AI test suite.
 *
 * Uses jsdom for DOM-based tests including accessible fallback layer testing.
 * Mirrors Vite path aliases so tests can import identically to source.
 *
 * Coverage includes core logic modules (services, utils, state, data).
 * UI and WebGL components are excluded from unit tests as they are 
 * verified by Playwright E2E tests.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/types/**',
        'src/scene/**',
        'src/ui/**', // Tested via E2E Playwright tests
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 95,
        lines: 90,
      },
    },
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@services': resolve(__dirname, 'src/services'),
      '@data': resolve(__dirname, 'src/data'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@scene': resolve(__dirname, 'src/scene'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },
});
