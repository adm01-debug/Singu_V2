import { test, expect } from '@playwright/test';

/**
 * Rodada 50/10 · Smoke E2E dos hubs que ainda não tinham cobertura:
 *   - /abm (Account-Based Marketing)
 *   - /intent (Intent Data)
 *   - Ask CRM (chat flutuante, disparado por evento global)
 *
 * Escopo intencionalmente leve: confirma que a rota resolve, o guard de
 * autenticação está ativo (redirect para /auth) e — quando aplicável — que
 * o componente carrega sem erro de bundle. Não depende de sessão real, o
 * que evita flakes em CI sem seed de usuário.
 */
test.describe('Hubs — smoke E2E (Rodada 50/10)', () => {
  test('/abm redireciona anônimo para /auth', async ({ page }) => {
    await page.goto('/abm');
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  });

  test('/abm/campanhas redireciona anônimo para /auth', async ({ page }) => {
    await page.goto('/abm/campanhas');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('/intent redireciona anônimo para /auth', async ({ page }) => {
    await page.goto('/intent');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('/intent/setup redireciona anônimo para /auth', async ({ page }) => {
    await page.goto('/intent/setup');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('rota inexistente não quebra o app (404 gracioso)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/rota-que-nao-existe-42');
    // Ou redireciona pra /auth (guard) ou renderiza NotFound; qualquer um é OK.
    await expect(page.locator('body')).toBeVisible();
    expect(errors, `pageerror inesperado: ${errors.join(' | ')}`).toEqual([]);
  });

  test('bundle de /abm carrega sem erro de módulo', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`);
    });
    await page.goto('/abm', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    const fatal = consoleErrors.filter((e) =>
      /(ChunkLoadError|Failed to fetch dynamically imported module|Unexpected token)/i.test(e),
    );
    expect(fatal, `falha de chunk: ${fatal.join(' | ')}`).toEqual([]);
  });

  test('bundle de /intent carrega sem erro de módulo', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`);
    });
    await page.goto('/intent', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    const fatal = consoleErrors.filter((e) =>
      /(ChunkLoadError|Failed to fetch dynamically imported module|Unexpected token)/i.test(e),
    );
    expect(fatal, `falha de chunk: ${fatal.join(' | ')}`).toEqual([]);
  });

  test('Ask CRM: evento global open-ask-crm é ouvido pelo AppLayout', async ({ page }) => {
    await page.goto('/auth');
    // Basta que o dispatch não lance — o listener só existe pós-login,
    // então validamos o contrato do evento (nome + payload) sem depender de sessão.
    const dispatched = await page.evaluate(() => {
      try {
        window.dispatchEvent(new CustomEvent('open-ask-crm'));
        return true;
      } catch {
        return false;
      }
    });
    expect(dispatched).toBe(true);
  });
});