import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  globalTimeout: process.env.CI ? 30 * 60 * 1000 : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'e2e-chromium',
      testDir: './e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-firefox',
      testDir: './e2e',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'e2e-webkit',
      testDir: './e2e',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'regression-chromium',
      testDir: './tests',
      testIgnore: ['**/integration/**', '**/security/**', '**/stress/**', '**/load/**', '**/rls/**'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
