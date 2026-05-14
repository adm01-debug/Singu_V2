 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { queryExternalData, insertExternalData } from '../../src/lib/externalData';
 import { supabase } from '../../src/integrations/supabase/client';
 
 vi.mock('../../src/lib/logger', () => ({
   logger: {
     error: vi.fn(),
     warn: vi.fn(),
     info: vi.fn(),
     log: vi.fn()
   },
   setRequestId: vi.fn(),
   setLogUser: vi.fn(),
   generateRequestId: vi.fn(() => 'test-id')
 }));
 
 vi.mock('../../src/integrations/supabase/client', () => ({
   supabase: {
     auth: {
       onAuthStateChange: vi.fn((cb) => cb('SIGNED_IN', { access_token: 'fake-token', expires_at: Date.now() / 1000 + 3600 })),
       getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 'fake-token', expires_at: Date.now() / 1000 + 3600 } } })),
     }
   }
 }));
 
 describe('Integration: Auth + External Data', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     global.fetch = vi.fn();
   });
 
   it('should include auth token in external data calls', async () => {
     (global.fetch as any).mockResolvedValue({
       ok: true,
       json: () => Promise.resolve({ data: [] })
     });
 
     await queryExternalData({ table: 'contacts' });
 
     expect(global.fetch).toHaveBeenCalledWith(
       expect.stringContaining('/functions/v1/external-data'),
       expect.objectContaining({
         headers: expect.objectContaining({
           'Authorization': 'Bearer fake-token'
         })
       })
     );
   });
 
   it('should handle concurrent edit errors (409) correctly', async () => {
     (global.fetch as any).mockResolvedValue({
       ok: false,
       status: 409,
       text: () => Promise.resolve(JSON.stringify({
         error: 'CONCURRENT_EDIT',
         entity: 'contacts',
         id: '123',
         attemptedVersion: 1
       }))
     });
 
     const { error } = await insertExternalData('contacts', { name: 'Test' });
     expect(error?.message).toContain('CONCURRENT_EDIT');
   });
 });