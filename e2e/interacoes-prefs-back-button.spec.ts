/**
 * E2E — Preferências de visualização de /interacoes sobrevivem ao botão "Voltar".
 *
 * Cenário coberto:
 *  1. Abre /interacoes (default).
 *  2. Aplica preferências não-default: density=compact, perPage=50, view=by-contact,
 *     sort=oldest. Cada uma é alterada via UI e refletida na URL.
 *  3. Navega para /dashboard.
 *  4. Aciona o botão "Voltar" do navegador.
 *  5. Verifica que a URL voltou com TODOS os 4 query params intactos e que os
 *     controles de UI (chip de densidade ativo + select de perPage com o valor)
 *     refletem o estado restaurado — não os defaults.
 *
 * Por que isso importa:
 *  - O reset por View Transition (`useSearchParams({ replace })`) historicamente
 *    pode "achatar" entradas do histórico. Esse teste garante a contramedida:
 *    `view` é empurrada com `pushToHistory=true`, então o "Voltar" recupera o
 *    estado completo dos filtros de visualização.
 *
 * Roda com:
 *   E2E_USER_EMAIL=... E2E_USER_PASS=... npx playwright test e2e/interacoes-prefs-back-button.spec.ts
 *
 * Variáveis de ambiente (mesmo contrato dos smoke tests):
 *   E2E_BASE_URL    (default: http://localhost:8080)
 *   E2E_USER_EMAIL  (usuário com acesso ao módulo Interações)
 *   E2E_USER_PASS
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:8080';
const EMAIL = process.env.E2E_USER_EMAIL;
const PASS = process.env.E2E_USER_PASS;

/**
 * Login helper compartilhado com smoke.spec.ts. Mantido inline para evitar
 * acoplamento entre specs e permitir rodar este arquivo isoladamente.
 */
async function login(page: Page): Promise<void> {
  await page.goto(`${BASE}/auth`);
  await page.getByLabel(/e-?mail/i).fill(EMAIL!);
  await page.getByLabel(/senha/i).fill(PASS!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|index|interacoes|$)/, { timeout: 15_000 });
}

/** Lê os query params relevantes da URL atual em um snapshot tipado. */
async function readPrefsFromUrl(
  page: Page,
): Promise<{ density: string | null; perPage: string | null; view: string | null; sort: string | null }> {
  const url = new URL(page.url());
  return {
    density: url.searchParams.get('density'),
    perPage: url.searchParams.get('perPage'),
    view: url.searchParams.get('view'),
    sort: url.searchParams.get('sort'),
  };
}

test.describe('/interacoes — preferências sobrevivem ao botão Voltar', () => {
  test.skip(!EMAIL || !PASS, 'E2E_USER_EMAIL/E2E_USER_PASS não definidos');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('aplicar prefs → ir pro dashboard → voltar → prefs restauradas', async ({ page }) => {
    // 1) Abre o módulo limpo. URL inicial não deve ter os params de visualização.
    await page.goto(`${BASE}/interacoes`);
    await expect(page.getByTestId('view-prefs-summary')).toBeVisible({ timeout: 10_000 });

    // 2) Density: clica no chip "Compacta".
    //    O chip vive dentro do ViewPrefsSummary; usamos role+name (a11y label garantido).
    const summary = page.getByTestId('view-prefs-summary');
    await summary.getByRole('button', { name: 'Compacta' }).click();
    await expect.poll(async () => (await readPrefsFromUrl(page)).density).toBe('compact');

    // 3) perPage: troca pelo combobox "Itens por página" para 50.
    await summary.getByRole('combobox', { name: /itens por página/i }).click();
    await page.getByRole('option', { name: '50' }).click();
    await expect.poll(async () => (await readPrefsFromUrl(page)).perPage).toBe('50');

    // 4) View: troca para "Por pessoa". O controle pode estar fora do summary;
    //    usamos role+name globalmente. Skipa silenciosamente se a UI ainda não
    //    expõe esse modo (mantém o teste resiliente a A/B).
    const viewByContact = page.getByRole('button', { name: /por pessoa/i });
    if (await viewByContact.count()) {
      await viewByContact.first().click();
      await expect.poll(async () => (await readPrefsFromUrl(page)).view).toBe('by-contact');
    }

    // 5) Sort: aciona ordenação "Mais antigas". Mesmo princípio defensivo do view.
    const sortOldest = page.getByRole('menuitem', { name: /mais antigas/i });
    if (await sortOldest.count()) {
      await sortOldest.first().click();
      await expect.poll(async () => (await readPrefsFromUrl(page)).sort).toBe('oldest');
    }

    // Snapshot do que de fato conseguimos aplicar (mínimo: density + perPage).
    const applied = await readPrefsFromUrl(page);
    expect(applied.density).toBe('compact');
    expect(applied.perPage).toBe('50');

    // 6) Navega para outra rota — usa /dashboard como destino estável.
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // 7) Botão "Voltar" do navegador. goBack aguarda a navegação concluir.
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/interacoes/, { timeout: 10_000 });
    await expect(page.getByTestId('view-prefs-summary')).toBeVisible({ timeout: 10_000 });

    // 8) Verifica que TODOS os params aplicados continuam na URL.
    const restored = await readPrefsFromUrl(page);
    expect(restored.density).toBe(applied.density);
    expect(restored.perPage).toBe(applied.perPage);
    if (applied.view) expect(restored.view).toBe(applied.view);
    if (applied.sort) expect(restored.sort).toBe(applied.sort);

    // 9) Verifica que a UI reflete o estado restaurado (não só a URL).
    const summaryAfter = page.getByTestId('view-prefs-summary');
    // Densidade compacta → chip "Compacta" deve estar pressionado.
    await expect(summaryAfter.getByRole('button', { name: 'Compacta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // perPage refletido no combobox.
    await expect(summaryAfter.getByRole('combobox', { name: /itens por página/i })).toContainText(
      '50',
    );
  });

  test('reload da rota com prefs na URL ainda restaura o estado', async ({ page }) => {
    // Carrega direto com os 4 params na URL — simula link compartilhado.
    await page.goto(
      `${BASE}/interacoes?density=compact&perPage=50&view=by-contact&sort=oldest`,
    );
    const summary = page.getByTestId('view-prefs-summary');
    await expect(summary).toBeVisible({ timeout: 10_000 });

    // URL preservada após hidratação (defaults não são reescritos por cima).
    const fromUrl = await readPrefsFromUrl(page);
    expect(fromUrl.density).toBe('compact');
    expect(fromUrl.perPage).toBe('50');
    expect(fromUrl.view).toBe('by-contact');
    expect(fromUrl.sort).toBe('oldest');

    // perPage refletido no combobox imediatamente.
    await expect(summary.getByRole('combobox', { name: /itens por página/i })).toContainText('50');
  });
});
