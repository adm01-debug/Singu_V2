import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeDocumentHtml, sanitizeText, sanitizeUrl } from '../sanitize';

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

  describe('sanitizeDocumentHtml', () => {
    it('should allow rich document tags', () => {
      const html = '<h1>Title</h1><table><tr><td>Cell</td></tr></table><img src="https://example.com/logo.png" alt="logo">';
      const clean = sanitizeDocumentHtml(html);
      expect(clean).toContain('<h1>');
      expect(clean).toContain('<table>');
      expect(clean).toContain('<img');
    });

    it('should block script tags and event handlers', () => {
      const dirty = '<div onclick="xss()">Safe text</div><script>alert(1)</script>';
      const clean = sanitizeDocumentHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onclick');
    });

    it('should block form and input elements', () => {
      const dirty = '<form action="/steal"><input type="text" name="pw"><button>Submit</button></form>';
      const clean = sanitizeDocumentHtml(dirty);
      expect(clean).not.toContain('<form');
      expect(clean).not.toContain('<input');
      expect(clean).not.toContain('<button');
    });

    it('should block iframe and object elements', () => {
      const dirty = '<iframe src="https://evil.com"></iframe><object data="evil.swf"></object>';
      const clean = sanitizeDocumentHtml(dirty);
      expect(clean).not.toContain('<iframe');
      expect(clean).not.toContain('<object');
    });

    it('should block javascript: href on anchor tags', () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>';
      const clean = sanitizeDocumentHtml(dirty);
      expect(clean).not.toContain('javascript:');
    });

    it('should add noopener noreferrer to target=_blank links', () => {
      const dirty = '<a href="https://example.com" target="_blank">Link</a>';
      const clean = sanitizeDocumentHtml(dirty);
      expect(clean).toContain('rel="noopener noreferrer"');
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
