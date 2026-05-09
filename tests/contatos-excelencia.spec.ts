import { test, expect } from '@playwright/test';

test.describe('Contatos e Rapport (Meta 10/10)', () => {
  test('Fluxo completo: CRUD, Filtros por Hobbies e Rapport', async ({ page }) => {
    // 1. Navegação e Listagem (Paginação/LoadMore)
    await page.goto('/contatos');
    await expect(page.locator('h1')).toContainText('Contatos');
    
    // Verifica se a lista carregou
    const contactCards = page.locator('[data-testid="contact-card"]');
    await expect(contactCards.first()).toBeVisible();
    
    // Teste de Load More (se houver mais de 50)
    const totalContactsText = await page.locator('.text-muted-foreground >> text=/\\d+/').first().textContent();
    const totalContacts = parseInt(totalContactsText?.match(/\d+/)?.[0] || '0');
    
    if (totalContacts > 50) {
      const loadMoreButton = page.getByRole('button', { name: /carregar mais/i });
      await loadMoreButton.scrollIntoViewIfNeeded();
      await loadMoreButton.click();
      await expect(contactCards).toHaveCount(Math.min(totalContacts, 100));
    }

    // 2. Filtro por Hobbies/Interesses na lista
    // Assumindo que existem badges de hobbies nos cards
    const hobbyBadge = page.locator('.badge-hobby').first();
    if (await hobbyBadge.isVisible()) {
      const hobbyText = await hobbyBadge.textContent();
      await page.getByPlaceholder(/buscar/i).fill(hobbyText || '');
      await expect(contactCards).toContainText(hobbyText || '');
    }

    // 3. Ficha 360 e Edição Inline Familiar
    await contactCards.first().click();
    await expect(page.locator('h1')).toContainText('Ficha 360');
    
    const editFamilyButton = page.locator('button:has-text("Rapport & Dados Pessoais")').locator('..').locator('button').nth(1);
    await editFamilyButton.click();
    
    const spouseInput = page.getByPlaceholder(/nome do cônjuge/i);
    await spouseInput.fill('Maria Silva');
    
    const childInput = page.getByPlaceholder(/adicionar filho/i);
    await childInput.fill('Joãozinho');
    await childInput.press('Enter');
    
    await page.locator('button.text-success').click(); // Botão Check de salvar
    await expect(page.locator('text=Maria Silva')).toBeVisible();
    await expect(page.locator('text=Joãozinho')).toBeVisible();

    // 4. Histórico e Reversão Familiar
    await page.locator('button:has(.lucide-history)').click();
    await expect(page.locator('text=Histórico Familiar')).toBeVisible();
    
    const restoreButton = page.locator('button:has-text("Restaurar")').first();
    if (await restoreButton.isVisible()) {
      await restoreButton.click();
      await expect(page.locator('text=revertidas com sucesso')).toBeVisible();
    }

    // 5. Fluxo de Aprovação de Rapport
    const suggestionCard = page.locator('text=Sugestões para Revisão');
    if (await suggestionCard.isVisible()) {
      const approveButton = page.locator('button.text-green-500').first();
      await approveButton.click();
      await expect(page.locator('text=Sugestão aprovada')).toBeVisible();
    }

    // 6. Busca por Palavra-chave em Atividades
    const activitySearch = page.getByPlaceholder(/buscar em mensagens e transcrições/i);
    await activitySearch.fill('orçamento');
    // Verifica se as interações foram filtradas
    const activities = page.locator('ul >> li');
    if (await activities.count() > 0) {
      await expect(activities.first()).toContainText(/orçamento/i);
    }
  });

  test('Sincronização Social e Enriquecimento', async ({ page }) => {
    await page.goto('/contatos');
    const firstContact = page.locator('[data-testid="contact-card"]').first();
    await firstContact.click();
    
    const syncButton = page.getByRole('button', { name: /social sync/i });
    if (await syncButton.isVisible()) {
      await syncButton.click();
      await expect(page.locator('text=Sincronização social concluída')).toBeVisible();
    }
  });
});
