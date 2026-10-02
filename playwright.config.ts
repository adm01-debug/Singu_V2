import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalTimeout: process.env.CI ? 15 * 60 * 1000 : undefined,
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
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
