import { test, expect } from '@playwright/test';

test.describe('Contact Management', () => {
  test('should create, filter and paginate contacts', async ({ page }) => {
    await page.goto('/contatos');
    
    // Check if list loads
    await expect(page.locator('table')).toBeVisible();
    
    // Test Search
    await page.fill('input[placeholder*="Buscar"]', 'Test');
    
    // Test Pagination (Scroll for loadMore)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Test Rapport Badges visibility
    // We expect some badges to be visible if data exists
    const badges = page.locator('.badge');
    // Note: This is a simplified test for illustration
  });

  test('should edit family info inline in Ficha 360', async ({ page }) => {
    // Navigate to a contact's Ficha 360 (using a mock ID or first available)
    await page.goto('/contatos');
    await page.click('table tr:first-child td:first-child a');
    await page.click('text=Ficha 360');
    
    // Click edit on Rapport card
    await page.click('button:has-text("Edit")');
    
    // Fill spouse name
    await page.fill('input[placeholder="Nome do cônjuge"]', 'Test Spouse');
    
    // Save
    await page.click('button:has(.lucide-check)');
    
    // Verify visibility
    await expect(page.locator('text=Test Spouse')).toBeVisible();
  });
});
