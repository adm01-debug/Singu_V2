import { describe, it, expect } from 'vitest';
import { validateProviderOrder, isProviderOrderError } from '@/lib/providerGuard';

describe('Provider Hierarchy Guard', () => {
  describe('validateProviderOrder', () => {
    it('deve aceitar a ordem correta sem violações', () => {
      const correct = [
        'HelmetProvider',
        'ErrorBoundary',
        'QueryClientProvider',
        'CelebrationProvider',
        'AriaLiveProvider',
        'TooltipProvider',
        'BrowserRouter',
        'AuthProvider',
        'NavigationStackProvider',
      ];
      expect(validateProviderOrder(correct)).toEqual([]);
    });

    it('deve detectar AuthProvider sem BrowserRouter acima', () => {
      const wrong = [
        'HelmetProvider',
        'QueryClientProvider',
        'AuthProvider', // BrowserRouter está faltando
      ];
      const violations = validateProviderOrder(wrong);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]).toContain('BrowserRouter');
    });

    it('deve detectar AuthProvider sem QueryClientProvider acima', () => {
      const wrong = [
        'HelmetProvider',
        'BrowserRouter',
        'AuthProvider', // QueryClientProvider está faltando
      ];
      const violations = validateProviderOrder(wrong);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]).toContain('QueryClientProvider');
    });

    it('deve detectar NavigationStackProvider sem BrowserRouter', () => {
      const wrong = [
        'HelmetProvider',
        'QueryClientProvider',
        'NavigationStackProvider',
      ];
      const violations = validateProviderOrder(wrong);
      expect(violations.some(v => v.includes('BrowserRouter'))).toBe(true);
    });

    it('deve detectar EasterEggsProvider sem AuthProvider', () => {
      const wrong = [
        'HelmetProvider',
        'BrowserRouter',
        'QueryClientProvider',
        'EasterEggsProvider',
      ];
      const violations = validateProviderOrder(wrong);
      expect(violations.some(v => v.includes('AuthProvider'))).toBe(true);
    });

    it('deve permitir providers desconhecidos sem erro', () => {
      const withUnknown = [
        'HelmetProvider',
        'CustomProvider',
        'BrowserRouter',
      ];
      expect(validateProviderOrder(withUnknown)).toEqual([]);
    });
  });

  describe('isProviderOrderError', () => {
    it('deve detectar erro de "must be used within"', () => {
      expect(isProviderOrderError(new Error('useAuth must be used within an AuthProvider'))).toBe(true);
    });

    it('deve detectar erro de "no queryClient set"', () => {
      expect(isProviderOrderError(new Error('No queryClient set, use QueryClientProvider'))).toBe(true);
    });

    it('deve detectar erro de useNavigate', () => {
      expect(isProviderOrderError(new Error('useNavigate() may be used only in the context of a Router'))).toBe(true);
    });

    it('não deve detectar erros genéricos', () => {
      expect(isProviderOrderError(new Error('Cannot read properties of undefined'))).toBe(false);
    });
  });
});
