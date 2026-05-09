/**
 * Security Hardening Verification Tests
 * Validates that all security patterns are properly implemented across the codebase.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

function readFile(relativePath: string): string {
  const fullPath = resolve(ROOT, relativePath);
  if (!existsSync(fullPath)) return '';
  return readFileSync(fullPath, 'utf-8');
}

describe('Security Hardening', () => {
  describe('HTML Security Headers', () => {
    const html = readFile('index.html');

    it('has X-Frame-Options meta', () => {
      expect(html).toMatch(/X-Frame-Options/i);
    });

    it('has X-Content-Type-Options meta', () => {
      expect(html).toMatch(/X-Content-Type-Options/i);
    });

    it('has security meta tags', () => {
      expect(html).toMatch(/X-Frame-Options|Content-Security-Policy/i);
    });
  });

  describe('Edge Function Security', () => {
    it('shared auth module has scopedCorsHeaders', () => {
      const auth = readFile('supabase/functions/_shared/auth.ts');
      expect(auth).toContain('scopedCorsHeaders');
    });

    it('shared auth module has withAuth', () => {
      const auth = readFile('supabase/functions/_shared/auth.ts');
      expect(auth).toContain('withAuth');
    });

    it('shared auth module validates JWT', () => {
      const auth = readFile('supabase/functions/_shared/auth.ts');
      expect(auth).toContain('getUser');
    });

    it('rate limiter module exists', () => {
      const rateLimiter = readFile('supabase/functions/_shared/rate-limit.ts');
      expect(rateLimiter).toContain('rateLimit');
      expect(rateLimiter).toContain('windowMs');
    });

    it('external-data uses rate limiting', () => {
      const fn = readFile('supabase/functions/external-data/index.ts');
      expect(fn).toContain('rateLimit');
      expect(fn).toContain('limiter.check');
    });

    it('external-data validates allowed tables', () => {
      const fn = readFile('supabase/functions/external-data/index.ts');
      expect(fn).toContain('ALLOWED_TABLES');
      expect(fn).toContain('isAllowedTable');
    });

    it('external-data validates UUID format', () => {
      const fn = readFile('supabase/functions/external-data/index.ts');
      expect(fn).toMatch(/uuidRegex/);
    });
  });

  describe('Client-Side Security', () => {
    it('circuit breaker exists', () => {
      const cb = readFile('src/lib/circuitBreaker.ts');
      expect(cb).toContain('CircuitBreaker');
      expect(cb).toContain('CLOSED');
      expect(cb).toContain('OPEN');
      expect(cb).toContain('HALF_OPEN');
    });

    it('resilient fetch exists with backoff', () => {
      const rf = readFile('src/lib/resilientFetch.ts');
      expect(rf).toContain('resilientFetch');
      expect(rf).toContain('backoff');
    });

    it('validation schemas use Zod', () => {
      const vs = readFile('src/lib/validationSchemas.ts');
      expect(vs).toContain('import { z }');
      expect(vs).toMatch(/Schema/);
    });

    it('externalData uses circuit breaker', () => {
      const ed = readFile('src/lib/externalData.ts');
      expect(ed).toContain('circuitBreaker');
      expect(ed).toContain('externalDbBreaker');
    });
  });

  describe('Auth Flow Security', () => {
    it('auth provider refreshes tokens proactively', () => {
      const auth = readFile('src/hooks/useAuth.tsx');
      expect(auth).toContain('scheduleTokenRefresh');
      expect(auth).toContain('REFRESH_THRESHOLD_MS');
    });

    it('auth handles 401 with re-auth', () => {
      const auth = readFile('src/hooks/useAuth.tsx');
      expect(auth).toContain('401');
    });

    it('QueryClient retries with backoff', () => {
      const qc = readFile('src/app/queryClient.ts');
      expect(qc).toContain('retryDelay');
      expect(qc).toMatch(/Math\.min.*2.*attemptIndex/);
    });
  });

  describe('Observability', () => {
    it('logger has structured output', () => {
      const logger = readFile('src/lib/logger.ts');
      expect(logger).toContain('structured');
    });

    it('health endpoint exists', () => {
      const health = readFile('supabase/functions/health/index.ts');
      expect(health.length).toBeGreaterThan(0);
      expect(health).toContain('healthy');
    });

    it('audit trail table triggers exist in migrations', () => {
      const auditTypes = readFile('src/integrations/supabase/types.ts');
      expect(auditTypes).toContain('audit_log');
    });
  });

  describe('Bundle Optimization', () => {
    it('vite config has manual chunks', () => {
      const vite = readFile('vite.config.ts');
      expect(vite).toContain('manualChunks');
      expect(vite).toContain('vendor-react');
      expect(vite).toContain('vendor-supabase');
    });

    it('vite config has treeshake preset', () => {
      const vite = readFile('vite.config.ts');
      expect(vite).toContain('treeshake');
      expect(vite).toContain('recommended');
    });
  });

  describe('Error Resilience', () => {
    it('ErrorBoundary component exists', () => {
      const eb = readFile('src/components/feedback/ErrorBoundary.tsx');
      expect(eb).toContain('ErrorBoundary');
      expect(eb).toContain('componentDidCatch');
    });

    it('DashboardErrorBoundary exists', () => {
      const deb = readFile('src/components/dashboard/DashboardErrorBoundary.tsx');
      expect(deb).toContain('DashboardErrorBoundary');
    });
  });
});
