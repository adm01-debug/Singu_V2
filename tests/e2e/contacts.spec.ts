import { test, expect } from '@playwright/test';
import {
  loginWithTestUser,
  requireTestCredentials,
  requireWritableEnvironment,
} from '../../e2e/support/auth';
import { openContactsTable, requireContactRows } from '../../e2e/support/contacts';

test.describe('Contatos CRUD & Filtros E2E', () => {
  test.beforeEach(async ({ page }) => {
    requireTestCredentials();
    await loginWithTestUser(page);
    await openContactsTable(page);
  });

  test('deve criar um novo contato e aparecer na lista', async ({ page }) => {
    requireWritableEnvironment();
    await page.click('button:has-text("Novo Contato")');
    
    await page.fill('input[name="first_name"]', 'Teste');
    await page.fill('input[name="last_name"]', 'Playwright');
    await page.fill('input[name="email"]', 'playwright@test.com');
    
    await page.click('button:has-text("Criar Contato")');
    
    await expect(page.locator('text=Contato criado')).toBeVisible();
    await expect(page.locator('text=Teste Playwright')).toBeVisible();
  });

  test('deve navegar para ficha 360 e validar rapport e histórico familiar', async ({ page }) => {
    await requireContactRows(page);
    await page.locator('tbody tr').first().getByRole('link').first().click();
    await expect(page).toHaveURL(/\/contatos\/[0-9a-f-]{36}/);

    await page.getByRole('tab', { name: 'Comportamental' }).click();
    await expect(page.getByText('Vida Pessoal & Rapport')).toBeVisible({ timeout: 15_000 });

    const familySection = page.locator('h4', { hasText: 'Família & Contexto' }).locator('..');
    await familySection.getByRole('button', { name: 'Histórico', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: /Histórico Familiar/ })).toBeVisible();
  });

  test('deve validar fluxo de aprovação de sugestões IA', async ({ page }) => {
    // No dashboard, deve aparecer o widget de aprovações se houver sugestões
    await page.goto('/');
    
    // Verifica se o widget de aprovações IA está visível (depende de dados)
    const aiWidget = page.locator('text=Sugestões IA para Rapport').or(page.locator('text=Aprovação de Follow-ups IA'));
    // Se existir, validamos a interação
    if (await aiWidget.isVisible()) {
      await expect(page.locator('button:has(svg.lucide-check)')).toBeVisible();
      await expect(page.locator('button:has(svg.lucide-x)')).toBeVisible();
    }
  });

  test('deve filtrar contatos por interesses', async ({ page }) => {
    await requireContactRows(page);
    await page.getByRole('button', { name: /Interesses/ }).click();
    await expect(page.getByRole('listbox')).toBeVisible();

    const firstInterest = page.getByRole('option').first();
    test.skip((await page.getByRole('option').count()) === 0, 'Contatos do usuário E2E sem interesses cadastrados');
    await firstInterest.click();
    await expect(page.getByText('Filtros ativos:')).toBeVisible();
  });
});
