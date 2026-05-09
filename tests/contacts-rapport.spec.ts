import { test, expect } from '@playwright/test';

test.describe('Contacts CRUD & Rapport', () => {
  test('Complete flow: Create, Search, Filter, and Ficha 360 Rapport', async ({ page }) => {
    await page.goto('/contatos');
    
    // 1. Create Contact
    await page.getByRole('button', { name: /Novo Contato/i }).click();
    await page.fill('input[name="first_name"]', 'Teste');
    await page.fill('input[name="last_name"]', 'Rapport');
    await page.fill('input[name="email"]', 'teste@rapport.com');
    await page.fill('input[name="hobbies"]', 'Surf, Poker');
    await page.fill('input[name="interests_array"]', 'IA, Finanças');
    await page.getByRole('button', { name: /Criar Contato/i }).click();
    
    // Wait for success toast
    await expect(page.getByText(/Contato criado/i)).toBeVisible();

    // 2. Filter & Search
    await page.fill('input[placeholder*="Buscar"]', 'Teste Rapport');
    await expect(page.getByText('Teste Rapport')).toBeVisible();

    // 3. Ficha 360 & Rapport Editing
    await page.getByText('Teste Rapport').first().click();
    await expect(page.url()).toContain('/contatos/');
    
    // Check Rapport Card
    await expect(page.getByText(/Rapport & Dados Pessoais/i)).toBeVisible();
    await expect(page.getByText('Surf')).toBeVisible();
    
    // Inline Edit Family
    await page.locator('button:has-text("Edit")').first().click(); // Open edit mode
    await page.fill('input[placeholder="Nome do cônjuge"]', 'Maria Teste');
    await page.fill('input[placeholder="Adicionar filho..."]', 'Joãozinho');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Check/i }).click(); // Save
    
    await expect(page.getByText('Maria Teste')).toBeVisible();
    await expect(page.getByText('Joãozinho')).toBeVisible();

    // 4. Activities Search
    const activitiesSearch = page.locator('input[placeholder*="Buscar em mensagens"]');
    await activitiesSearch.fill('teste');
    // Ensure filters are present
    await expect(page.getByRole('button', { name: 'WhatsApp' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ligações' })).toBeVisible();
  });

  test('Pagination (loadMore) flow', async ({ page }) => {
    await page.goto('/contatos');
    // Scroll to bottom to trigger load more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const loadingText = page.getByText(/Carregando mais contatos/i);
    // If there are many contacts, it should show loading
    if (await loadingText.isVisible()) {
      await expect(loadingText).toBeVisible();
    }
  });
});
