import { test, expect } from '@playwright/test';
import { loginWithTestUser, requireTestCredentials } from '../../e2e/support/auth';

/**
 * E2E tests for Auth flow: login, navigation, and logout.
 */
test.describe('Autenticação e Navegação E2E', () => {
  test('deve redirecionar usuário não autenticado para /auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole('heading', { name: 'SINGU', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  });

  test('deve alternar entre Login e Cadastro no formulário', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Criar conta', exact: true })).toBeVisible();
    await expect(page.locator('label[for="firstName"]')).toBeVisible();

    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
  });

  test('deve validar campos obrigatórios no login', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Email inválido')).toBeVisible();
    await expect(page.locator('text=Senha deve ter no mínimo 6 caracteres')).toBeVisible();
  });

  test('deve permitir navegação entre páginas protegidas após login', async ({ page }) => {
    requireTestCredentials();
    await loginWithTestUser(page);

    // Check main navigation elements
    const sidebar = page.locator('nav').first();
    await expect(sidebar).toBeVisible();
    
    // Test navigation to Contacts
    await page.click('nav a[href="/contatos"]');
    await expect(page).toHaveURL(/\/contatos/);
    await expect(page.locator('h1, h2')).toContainText(/Contatos/i);
    
    // Test navigation to Companies
    await page.click('nav a[href="/empresas"]');
    await expect(page).toHaveURL(/\/empresas/);
    await expect(page.locator('h1, h2')).toContainText(/Empresas/i);
    
    // Test logout via user menu
    await page.click('button[aria-label="Menu do usuário"]');
    await page.click('text=Sair');
    
    // Should redirect back to auth
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('Páginas Públicas E2E', () => {
  test('deve carregar a página de Status sem autenticação', async ({ page }) => {
    await page.goto('/status');
    await expect(page.getByRole('heading', { name: 'Status do Sistema' })).toBeVisible();
    await expect(page.getByText('SINGU CRM — Monitoramento de Saúde do Sistema')).toBeVisible();
  });

  test('deve carregar o Design System sem autenticação', async ({ page }) => {
    await page.goto('/design-system');
    await expect(page.getByRole('main', { name: 'Nexus Design System' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tokens Nexus que comandam a identidade' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Primary action' })).toBeVisible();
  });

  test('deve mostrar 404 para landing page inexistente', async ({ page }) => {
    await page.goto('/lp/non-existent-slug-12345');
    await expect(page.locator('text=Página não encontrada')).toBeVisible();
  });
});
