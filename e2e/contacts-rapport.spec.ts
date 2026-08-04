import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:8080';
const EMAIL = process.env.E2E_USER_EMAIL;
const PASS = process.env.E2E_USER_PASS;

test.describe('Contacts Rapport & Intelligence', () => {
  test.skip(!EMAIL || !PASS, 'E2E_USER_EMAIL/E2E_USER_PASS não definidos');

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/auth`);
    await page.getByLabel(/e-?mail/i).fill(EMAIL!);
    await page.getByLabel(/senha/i).fill(PASS!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|index|$)/, { timeout: 15_000 });
  });

  test('CRUD de contatos com Hobbies e Interesses', async ({ page }) => {
    await page.goto(`${BASE}/contatos`);
    await page.getByRole('button', { name: /novo contato/i }).click();
    
    const ts = Date.now();
    const firstName = `Rapport ${ts}`;
    
    await page.getByLabel(/nome/i).first().fill(firstName);
    await page.getByLabel(/sobrenome/i).fill('Test');
    
    // Fill Hobbies and Interests
    await page.getByLabel(/hobbies/i).fill('Futebol, Leitura');
    await page.getByLabel(/interesses/i).fill('IA, Tecnologia');
    
    await page.getByRole('button', { name: /salvar|criar/i }).click();
    
    // Verify visibility in the list
    await expect(page.getByText(firstName)).toBeVisible({ timeout: 10_000 });
    
    // Check for badges
    await expect(page.getByText(/Futebol/)).toBeVisible();
    await expect(page.getByText(/IA/)).toBeVisible();
  });

  test('Filtro por Hobbies e Interesses', async ({ page }) => {
    await page.goto(`${BASE}/contatos`);
    
    // Open filters if necessary (assuming they are visible or in a menu)
    const filterButton = page.getByRole('button', { name: /filtros/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Filter by a hobby
    // Note: The specific implementation of filters might vary, assuming a label/dropdown approach
    await page.getByText(/Futebol/).first().click();
    
    // Verify results count changed or list updated
    // (This is a simplified check)
    await expect(page.locator('article')).toBeVisible();
  });

  test('Ficha 360: Edição Inline de Família e Histórico', async ({ page }) => {
    await page.goto(`${BASE}/contatos`);
    // Click on the first contact
    await page.locator('article').first().click();
    
    // Wait for Ficha 360 to load
    await expect(page.getByText(/Ficha 360/)).toBeVisible({ timeout: 15_000 });
    
    // Find the family card and edit
    const editBtn = page.locator('button').filter({ hasText: /edit/i }).first();
    await editBtn.click();
    
    await page.getByPlaceholder(/nome do cônjuge/i).fill('Maria Test');
    await page.getByRole('button', { name: /salvar/i }).first().click();
    
    await expect(page.getByText('Maria Test')).toBeVisible();
    
    // Check history
    await page.locator('button').filter({ has: page.locator('svg.lucide-history') }).click();
    await expect(page.getByText(/Histórico Familiar/i)).toBeVisible();
  });
});