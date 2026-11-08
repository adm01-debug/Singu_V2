import { test, expect } from '@playwright/test';

test('should handle parallel requests with token refresh', async ({ page }) => {
  await page.goto('/');
  // Simulando 3 chamadas simultâneas à API que podem disparar refresh
  const results = await page.evaluate(async () => {
    const fetcher = async () => (await fetch('/functions/v1/system-health')).status;
    return Promise.all([fetcher(), fetcher(), fetcher()]);
  });
  
  for (const status of results) {
    expect(status).toBeLessThan(500);
  }
});
