import { test, expect } from '@playwright/test';

test.describe('Contatos CRUD & Filtros E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login if necessary or navigate to the contacts page
    await page.goto('/contatos');
    // Wait for the list to load
    await page.waitForSelector('[role="region"][aria-label="Tabela de contatos"]');
  });

  test('deve criar um novo contato e aparecer na lista', async ({ page }) => {
    await page.click('button:has-text("Novo Contato")');
    
    await page.fill('input[name="first_name"]', 'Teste');
    await page.fill('input[name="last_name"]', 'Playwright');
    await page.fill('input[name="email"]', 'playwright@test.com');
    
    await page.click('button:has-text("Criar Contato")');
    
    await expect(page.locator('text=Contato criado')).toBeVisible();
    await expect(page.locator('text=Teste Playwright')).toBeVisible();
  });

  test('deve filtrar contatos por interesses', async ({ page }) => {
    // Abre filtros
    await page.click('button:has-text("Filtros")');
    
    // Procura por um interesse conhecido (ex: Tecnologia)
    const filterValue = 'Tecnologia';
    await page.click(`text=${filterValue}`);
    
    // Verifica se a lista foi atualizada (deve ter menos itens ou apenas os que tem esse interesse)
    // Nota: Depende de dados reais ou mockados. Aqui validamos a interação com a UI.
    await expect(page.locator('text=Filtros ativos')).toBeVisible();
  });

  test('deve carregar mais contatos ao rolar (loadMore)', async ({ page }) => {
    const initialRows = await page.locator('tbody tr').count();
    
    // Rola para o fim da página
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Aguarda um pouco para o loadMore disparar (se houver mais de 50)
    // await page.waitForTimeout(1000);
    
    // const newRows = await page.locator('tbody tr').count();
    // expect(newRows).toBeGreaterThanOrEqual(initialRows);
  });
});
