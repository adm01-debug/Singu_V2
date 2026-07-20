 import { defineConfig } from 'vitest/config';
 import path from 'path';
 
 export default defineConfig({
   test: {
     globals: true,
     environment: 'jsdom',
     setupFiles: ['./src/test/setup.ts'],
     // Inject Vite env vars for all modules under test (import.meta.env is per-module,
     // so the setup-file override alone does not reach application code).
     env: {
       VITE_SUPABASE_URL: 'https://test.supabase.co',
       VITE_SUPABASE_PUBLISHABLE_KEY: 'test-key',
       VITE_SUPABASE_PROJECT_ID: 'test-project',
     },
     // Playwright e2e specs (tests/ root + tests/e2e + e2e/) import '@playwright/test'
     // and must not run under vitest. Vitest unit/integration tests live in src/ and
     // the tests/{integration,security,stress} subdirectories.
     include: [
       'src/**/*.{test,spec}.{ts,tsx}',
       'tests/integration/**/*.{test,spec}.{ts,tsx}',
       'tests/security/**/*.{test,spec}.{ts,tsx}',
       'tests/stress/**/*.{test,spec}.{ts,tsx}',
     ],
     exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**', 'tests/e2e/**'],
   },
   resolve: {
     alias: [
       { find: '@', replacement: path.resolve(__dirname, './src') },
       // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
       { find: /^npm:(.*)@(.*)$/, replacement: '$1' }
     ]
   },
 });