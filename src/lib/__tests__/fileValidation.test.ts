 import { describe, it, expect, vi } from 'vitest';
 import { validateFileMagicBytes, validateFileUpload } from '../fileValidation';
 
 describe('fileValidation', () => {
   it('should validate PNG magic bytes', async () => {
     const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
     const file = new File([pngHeader], 'test.png', { type: 'image/png' });
     
     const isValid = await validateFileMagicBytes(file);
     expect(isValid).toBe(true);
   });
 
   it('should invalidate corrupted PNG', async () => {
     const badHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
     const file = new File([badHeader], 'test.png', { type: 'image/png' });
     
     const isValid = await validateFileMagicBytes(file);
     expect(isValid).toBe(false);
   });
 
   it('should validate PDF magic bytes', async () => {
     const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
     const file = new File([pdfHeader], 'test.pdf', { type: 'application/pdf' });
     
     const isValid = await validateFileMagicBytes(file);
     expect(isValid).toBe(true);
   });
 
   it('should validate file upload within size limits', async () => {
     const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
     const file = new File([pngHeader], 'test.png', { type: 'image/png' });
     
     const result = await validateFileUpload(file, { maxSizeMB: 5 });
     expect(result.valid).toBe(true);
   });
 
   it('should fail file upload exceeding size limits', async () => {
     // Create a 2MB file
     const largeContent = new Uint8Array(2 * 1024 * 1024);
     const file = new File([largeContent], 'large.png', { type: 'image/png' });
     
     const result = await validateFileUpload(file, { maxSizeMB: 1 });
     expect(result.valid).toBe(false);
     expect(result.error).toContain('muito grande');
   });
 });