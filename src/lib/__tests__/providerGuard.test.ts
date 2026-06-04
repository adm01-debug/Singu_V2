import { describe, it, expect } from 'vitest';
import { validateProviderOrder, PROVIDER_ORDER } from '@/lib/providerGuard';

describe('Provider Guard & Hierarchy', () => {
  it('deve validar corretamente uma ordem de providers válida', () => {
    const validOrder = [
      'HelmetProvider',
      'QueryClientProvider',
      'BrowserRouter',
      'AuthProvider',
      'NavigationStackProvider'
    ];
    
    const violations = validateProviderOrder(validOrder);
    expect(violations).toHaveLength(0);
  });

  it('deve detectar violação quando AuthProvider vem antes de BrowserRouter', () => {
    const invalidOrder = [
      'AuthProvider', // Requer BrowserRouter
      'BrowserRouter'
    ];
    
    const violations = validateProviderOrder(invalidOrder);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('AuthProvider requer BrowserRouter');
  });

  it('deve detectar violação quando AuthProvider vem antes de QueryClientProvider', () => {
    const invalidOrder = [
      'BrowserRouter',
      'AuthProvider', // Requer QueryClientProvider
      'QueryClientProvider'
    ];
    
    const violations = validateProviderOrder(invalidOrder);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('AuthProvider requer QueryClientProvider');
  });

  it('deve ser resiliente a providers desconhecidos (ex: providers de terceiros)', () => {
    const orderWithThirdParty = [
      'HelmetProvider',
      'SomeThirdPartyProvider',
      'BrowserRouter',
      'AuthProvider'
    ];
    
    // AuthProvider ainda precisa de QueryClientProvider na definição padrão
    const violations = validateProviderOrder(orderWithThirdParty);
    expect(violations.some(v => v.includes('QueryClientProvider'))).toBe(true);
  });

  it('deve validar a ordem completa canônica do sistema', () => {
    const canonicalOrder = PROVIDER_ORDER.map(p => p.name);
    const violations = validateProviderOrder(canonicalOrder);
    expect(violations).toHaveLength(0);
  });
});
