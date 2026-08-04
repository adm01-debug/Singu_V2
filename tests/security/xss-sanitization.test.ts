 import { describe, it, expect } from 'vitest';
 import DOMPurify from 'dompurify';
 
 describe('Security: XSS Sanitization', () => {
   it('should sanitize malicious HTML scripts', () => {
     const dirty = '<img src=x onerror=alert(1)>';
     const clean = DOMPurify.sanitize(dirty);
     expect(clean).not.toContain('onerror');
   });
 
   it('should sanitize javascript: links', () => {
     const dirty = '<a href="javascript:alert(1)">Click me</a>';
     const clean = DOMPurify.sanitize(dirty);
     expect(clean).not.toContain('javascript:');
   });
 });