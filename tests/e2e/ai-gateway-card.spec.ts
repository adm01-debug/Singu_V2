import { test, expect } from '@playwright/test';

/**
 * Rodada 54/10 — Smoke E2E do card AiGatewayHealth em /admin/error-budget.
 * Sem sessão admin injetada o app redireciona para /auth; validamos o
 * comportamento defensivo e a ausência de ChunkLoadError na rota.
 */
test.describe('AI Gateway Health card', () => {
  test('rota /admin/error-budget carrega sem chunk error', async ({ page }) => {
    const chunkErrors: string[] = [];
    page.on('pageerror', (err) => {
      if (/ChunkLoadError|Loading chunk/i.test(err.message)) chunkErrors.push(err.message);
    });

    await page.goto('/admin/error-budget', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    expect(chunkErrors, `Chunk errors: ${chunkErrors.join('\n')}`).toHaveLength(0);
    // Sem sessão admin, aceitamos landing em /auth OU renderização do painel.
    const url = page.url();
    expect(url).toMatch(/\/(admin\/error-budget|auth)/);
  });
});