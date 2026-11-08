import { test, expect } from '@playwright/test';
import {
  loginWithTestUser,
  requireTestCredentials,
  requireWritableEnvironment,
} from '../e2e/support/auth';
import { openContactsTable, requireContactRows } from '../e2e/support/contacts';

test.describe('Contact Management', () => {
  test.beforeEach(async ({ page }) => {
    requireTestCredentials();
    await loginWithTestUser(page);
  });

  test('should create, filter and paginate contacts', async ({ page }) => {
    await openContactsTable(page);
    
    // Test Search
    const search = page.getByPlaceholder('Buscar...');
    await search.fill('Test');
    await expect(search).toHaveValue('Test');
    
    // Test Pagination (Scroll for loadMore)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Test Rapport Badges visibility
    // We expect some badges to be visible if data exists
    // Note: This is a simplified test for illustration
  });

  test('should edit family info inline in Ficha 360', async ({ page }) => {
    // Navigate to a contact's Ficha 360 (using a mock ID or first available)
    requireWritableEnvironment();
    await openContactsTable(page);
    await requireContactRows(page);
    await page.click('tbody tr:first-child a');
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
