import { test, expect } from '@playwright/test';

/**
 * Rodada 56/10 — Smoke E2E do heatmap de erros do AI Gateway.
 * Sem sessão admin injetada o app redireciona para /auth; validamos apenas
 * a ausência de ChunkLoadError e a resposta 200 do bundle da rota.
 */
test.describe('AI Gateway heatmap', () => {
  test('rota /admin/error-budget não quebra o bundle', async ({ page }) => {
    const chunkErrors: string[] = [];
    page.on('pageerror', (err) => {
      if (/ChunkLoadError|Loading chunk/i.test(err.message)) chunkErrors.push(err.message);
    });

    const resp = await page.goto('/admin/error-budget', { waitUntil: 'domcontentloaded' });
    expect(resp?.ok(), 'response should be ok').toBeTruthy();

    await expect(page.locator('body')).toBeVisible();

    expect(chunkErrors, `Chunk errors: ${chunkErrors.join('\n')}`).toHaveLength(0);
    expect(page.url()).toMatch(/\/(admin\/error-budget|auth)/);
  });
});