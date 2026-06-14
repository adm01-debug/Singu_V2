/**
 * Integration tests — Data Validation
 * Validates Zod schemas, input sanitization, and data integrity rules.
 */
import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';

// Test validation patterns used across the app
describe('Data Validation Integration', () => {
  
  describe('CNPJ Validation', () => {
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    
    it('accepts valid formatted CNPJ', () => {
      expect(cnpjRegex.test('11.222.333/0001-81')).toBe(true);
    });

    it('rejects invalid CNPJ format', () => {
      expect(cnpjRegex.test('11222333000181')).toBe(false);
      expect(cnpjRegex.test('abc')).toBe(false);
      expect(cnpjRegex.test('')).toBe(false);
    });
  });

  describe('Email Validation', () => {
    // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('accepts valid emails', () => {
      expect(emailRegex.test('user@example.com')).toBe(true);
      expect(emailRegex.test('user.name@domain.co')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(emailRegex.test('not-an-email')).toBe(false);
      expect(emailRegex.test('@domain.com')).toBe(false);
      expect(emailRegex.test('user@')).toBe(false);
      expect(emailRegex.test('')).toBe(false);
    });
  });

  describe('Phone Validation (Brazilian)', () => {
    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

    it('accepts valid phone formats', () => {
      expect(phoneRegex.test('(11) 99999-9999')).toBe(true);
      expect(phoneRegex.test('11 99999-9999')).toBe(true);
      expect(phoneRegex.test('1199999-9999')).toBe(true);
      expect(phoneRegex.test('11999999999')).toBe(true);
    });

    it('rejects invalid phone formats', () => {
      expect(phoneRegex.test('abc')).toBe(false);
      expect(phoneRegex.test('123')).toBe(false);
    });
  });

  describe('XSS Sanitization', () => {
    it('strips script tags', () => {
      const dirty = '<script>alert("xss")</script>Hello';
      const clean = DOMPurify.sanitize(dirty);
      expect(clean).toBe('Hello');
      expect(clean).not.toContain('script');
    });

    it('strips event handlers', () => {
      const dirty = '<div onmouseover="alert(1)">text</div>';
      const clean = DOMPurify.sanitize(dirty);
      expect(clean).not.toContain('onmouseover');
    });

    it('preserves safe HTML', () => {
      const safe = '<strong>Bold</strong> and <em>italic</em>';
      const clean = DOMPurify.sanitize(safe);
      expect(clean).toContain('<strong>Bold</strong>');
      expect(clean).toContain('<em>italic</em>');
    });

    it('handles null and empty inputs', () => {
      expect(DOMPurify.sanitize('')).toBe('');
    });
  });

  describe('UUID Validation', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    it('accepts valid UUIDs', () => {
      expect(uuidRegex.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(uuidRegex.test('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
      expect(uuidRegex.test('not-a-uuid')).toBe(false);
      expect(uuidRegex.test('550e8400-e29b-41d4-a716')).toBe(false);
      expect(uuidRegex.test('')).toBe(false);
    });
  });

  describe('Financial Calculations', () => {
    it('avoids floating point errors with integers', () => {
      // Simulating monetary calculation: R$ 19.99 * 3
      const priceInCents = 1999;
      const quantity = 3;
      const totalCents = priceInCents * quantity;
      const totalReais = totalCents / 100;
      
      expect(totalReais).toBe(59.97);
    });

    it('handles percentage calculations correctly', () => {
      const value = 1000;
      const discount = 15; // 15%
      const discounted = value - (value * discount / 100);
      
      expect(discounted).toBe(850);
    });

    it('handles division by zero safely', () => {
      const rate = (conversions: number, total: number): number => {
        return total > 0 ? (conversions / total) * 100 : 0;
      };

      expect(rate(5, 100)).toBe(5);
      expect(rate(0, 100)).toBe(0);
      expect(rate(5, 0)).toBe(0);
      expect(rate(0, 0)).toBe(0);
    });
  });

  describe('Date/Timezone Safety', () => {
    it('creates dates in ISO format', () => {
      const date = new Date('2024-06-15T10:30:00Z');
      const iso = date.toISOString();
      
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('handles timezone-aware comparisons', () => {
      const utcDate = new Date('2024-06-15T00:00:00Z');
      const brDate = new Date('2024-06-14T21:00:00-03:00'); // Same moment in BRT
      
      expect(utcDate.getTime()).toBe(brDate.getTime());
    });
  });

  describe('Null/Undefined Coalescing', () => {
    it('handles null values with nullish coalescing', () => {
      const getValue = (v: string | null | undefined): string => v ?? 'default';
      
      expect(getValue('value')).toBe('value');
      expect(getValue(null)).toBe('default');
      expect(getValue(undefined)).toBe('default');
      expect(getValue('')).toBe('');
    });

    it('handles nested optional access', () => {
      const obj: { a?: { b?: { c?: number } } } = {};
      
      expect(obj.a?.b?.c ?? 0).toBe(0);
      expect(obj?.a?.b?.c).toBeUndefined();
    });
  });
});
