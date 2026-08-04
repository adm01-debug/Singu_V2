import { test, expect } from '@playwright/test';

test('should handle parallel requests with token refresh', async ({ page }) => {
  await page.goto('/');
  // Simulando 3 chamadas simultâneas à API que podem disparar refresh
  const results = await page.evaluate(async () => {
    const fetcher = () => fetch('/functions/v1/system-health');
    return Promise.all([fetcher(), fetcher(), fetcher()]);
  });
  
  for (const res of results) {
    expect(res.status).toBeLessThan(500);
  }
});
