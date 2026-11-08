import { expect, test, type Page } from '@playwright/test';

export async function openContactsTable(page: Page): Promise<void> {
  await page.goto('/contatos?view=table');
  await expect(page.getByRole('region', { name: 'Tabela de contatos' })).toBeVisible({ timeout: 15_000 });
}

export async function requireContactRows(page: Page): Promise<void> {
  const rows = page.getByRole('region', { name: 'Tabela de contatos' }).locator('tbody tr');
  const emptyState = page.getByText('Sua rede de contatos começa aqui');
  await expect(rows.first().or(emptyState)).toBeVisible({ timeout: 15_000 });
  test.skip((await rows.count()) === 0, 'Usuário E2E sem contatos; a jornada exige massa de dados');
}
