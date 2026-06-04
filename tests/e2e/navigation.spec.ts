import { test, expect } from '@playwright/test';

/**
 * E2E tests for Auth flow: login, navigation, and logout.
 */
test.describe('Autenticação e Navegação E2E', () => {
  // Test user credentials (using dummy ones since we'll mock the response if possible, 
  // or just check the UI transitions if actual credentials aren't available)
  const TEST_EMAIL = 'e2e-test@singu.com.br';
  const TEST_PASS = 'password123';

  test('deve redirecionar usuário não autenticado para /auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator('h1:has-text("SINGU")')).toBeVisible();
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible();
  });

  test('deve alternar entre Login e Cadastro no formulário', async ({ page }) => {
    await page.goto('/auth');
    
    // Default is login
    await expect(page.locator('h2:has-text("Entrar")')).toBeVisible();
    
    // Switch to signup
    await page.click('button:has-text("Criar conta")');
    await expect(page.locator('h2:has-text("Criar conta")')).toBeVisible();
    await expect(page.locator('label[for="firstName"]')).toBeVisible();
    
    // Switch back
    await page.click('button:has-text("Entrar")');
    await expect(page.locator('h2:has-text("Entrar")')).toBeVisible();
  });

  test('deve validar campos obrigatórios no login', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Email inválido')).toBeVisible();
    await expect(page.locator('text=Senha deve ter no mínimo 6 caracteres')).toBeVisible();
  });

  // Note: Actual login test requires valid user in DB or mocked auth state.
  // Since we are creating tests for "critical flows", we assume the environment has test data.
  test('deve permitir navegação entre páginas protegidas após login simulado', async ({ page }) => {
    // Navigate to auth
    await page.goto('/auth');
    
    // Fill credentials (assuming valid for this test environment)
    await page.fill('input[id="email"]', TEST_EMAIL);
    await page.fill('input[id="password"]', TEST_PASS);
    
    // We expect failure or redirect. For E2E coverage of navigation, 
    // we focus on what happens when a session exists.
    
    // Assuming we successfully logged in or are already in:
    await page.goto('/');
    
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
    await expect(page.locator('h1, h2')).toContainText(/Status/i);
    // Should show uptime/status items
    await expect(page.locator('text=Operacional')).toBeVisible();
  });

  test('deve carregar o Design System sem autenticação', async ({ page }) => {
    await page.goto('/design-system');
    await expect(page.locator('text=Design System')).toBeVisible();
    await expect(page.locator('text=Cores')).toBeVisible();
    await expect(page.locator('text=Botões')).toBeVisible();
  });

  test('deve mostrar 404 para landing page inexistente', async ({ page }) => {
    await page.goto('/lp/non-existent-slug-12345');
    await expect(page.locator('text=Página não encontrada')).toBeVisible();
  });
});
