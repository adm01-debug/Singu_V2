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
     include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
     // Playwright e2e specs (import '@playwright/test') must not run under Vitest.
     exclude: [
       'node_modules', 'dist', '.idea', '.git', '.cache',
       'e2e/**',
       'tests/e2e/**',
       'tests/*.spec.ts',
       'tests/contacts-e2e.test.ts',
     ],
   },
   resolve: {
     alias: [
       { find: '@', replacement: path.resolve(__dirname, './src') },
       { find: /^npm:(.*)@(.*)$/, replacement: '$1' }
     ]
   },
 });