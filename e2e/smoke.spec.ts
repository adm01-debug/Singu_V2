/**
 * Smoke tests E2E — Rodada F Etapa 3.
 *
 * Cobre 3 jornadas críticas:
 *  (a) Login → Dashboard → criar contato
 *  (b) Pipeline → mover deal entre estágios
 *  (c) Inbox → completar tarefa → desfazer
 *
 * Roda com:
 *   npx playwright test e2e/smoke.spec.ts
 *
 * Requer variáveis de ambiente:
 *   E2E_BASE_URL    (default: http://localhost:8080)
 *   E2E_USER_EMAIL  (usuário de teste com dados seed)
 *   E2E_USER_PASS
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:8080';
const EMAIL = process.env.E2E_USER_EMAIL;
const PASS = process.env.E2E_USER_PASS;

test.describe('SINGU Smoke Tests', () => {
  test.skip(!EMAIL || !PASS, 'E2E_USER_EMAIL/E2E_USER_PASS não definidos');

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/auth`);
    await page.getByLabel(/e-?mail/i).fill(EMAIL!);
    await page.getByLabel(/senha/i).fill(PASS!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|index|$)/, { timeout: 15_000 });
  });

  test('jornada A: dashboard → criar contato', async ({ page }) => {
    await page.goto(`${BASE}/contatos`);
    await page.getByRole('button', { name: /novo contato/i }).click();
    const ts = Date.now();
    await page.getByLabel(/nome/i).first().fill(`Smoke ${ts}`);
    await page.getByLabel(/sobrenome/i).fill('Test');
    await page.getByRole('button', { name: /salvar|criar/i }).click();
    await expect(page.getByText(`Smoke ${ts}`)).toBeVisible({ timeout: 10_000 });
  });

  test('jornada B: pipeline → mover deal', async ({ page }) => {
    await page.goto(`${BASE}/pipeline`);
    const firstDeal = page.locator('[data-testid="deal-card"]').first();
    await expect(firstDeal).toBeVisible({ timeout: 10_000 });
    // Drag-and-drop entre colunas (smoke — apenas garante que o card é arrastável)
    const targetColumn = page.locator('[data-stage]').nth(1);
    await firstDeal.dragTo(targetColumn);
    // Verifica que toast de feedback apareceu
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('jornada C: inbox → completar tarefa → desfazer', async ({ page }) => {
    await page.goto(`${BASE}/inbox`);
    const firstCheckbox = page.getByRole('checkbox').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 10_000 });
    await firstCheckbox.click();
    const undoBtn = page.getByRole('button', { name: /desfazer/i });
    await expect(undoBtn).toBeVisible({ timeout: 3_000 });
    await undoBtn.click();
    // Tarefa volta a ficar desmarcada
    await expect(firstCheckbox).not.toBeChecked({ timeout: 5_000 });
  });
});
