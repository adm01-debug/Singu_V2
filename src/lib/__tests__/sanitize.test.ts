import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeText, sanitizeUrl } from '../sanitize';

describe('Sanitize Lib', () => {
  describe('sanitizeHtml', () => {
    it('should keep allowed tags', () => {
      const dirty = '<p>Hello <strong>World</strong> <a href="https://google.com">Link</a></p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('<p>Hello <strong>World</strong> <a href="https://google.com">Link</a></p>');
    });

    it('should remove dangerous tags and attributes', () => {
      const dirty = '<p>Safe</p><script>alert("XSS")</script><img src="x" onerror="alert(1)">';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe('<p>Safe</p>');
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror');
    });

    it('should handle nested dangerous elements', () => {
      const dirty = '<div><a href="javascript:alert(1)">Click me</a></div>';
      const clean = sanitizeHtml(dirty);
      // DOMPurify removes the whole href if it's javascript: by default or keeps it as safe
      expect(clean).not.toContain('javascript:');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const dirty = '<p>Hello <strong>World</strong></p>';
      const clean = sanitizeText(dirty);
      expect(clean).toBe('Hello World');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow safe protocols', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should block dangerous protocols', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,xss')).toBe('');
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    });
  });
});
