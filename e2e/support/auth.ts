import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_USER_EMAIL;
const PASS = process.env.E2E_USER_PASS;

export function requireTestCredentials(): void {
  test.skip(!EMAIL || !PASS, 'E2E_USER_EMAIL/E2E_USER_PASS não definidos');
}

export async function loginWithTestUser(page: Page): Promise<void> {
  await page.goto('/auth');
  await page.getByLabel(/e-?mail/i).fill(EMAIL!);
  await page.getByLabel(/^senha$/i).fill(PASS!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|index|$)/, { timeout: 15_000 });
}
