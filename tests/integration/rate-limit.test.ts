 import { describe, it, expect } from 'vitest';
 import { rateLimit } from '../../supabase/functions/_shared/rate-limit.ts';
 
 describe('Integration: Edge Function Rate Limiting', () => {
   it('should block requests exceeding the limit', () => {
     const limiter = rateLimit({ max: 2, windowMs: 1000 });
     const key = 'test-ip';
 
     expect(limiter.check(key)).toBeNull(); // Req 1
     expect(limiter.check(key)).toBeNull(); // Req 2
     
     const blocked = limiter.check(key); // Req 3
     expect(blocked).not.toBeNull();
     expect(blocked?.status).toBe(429);
   });
 
   it('should reset after the window expires', async () => {
     const limiter = rateLimit({ max: 1, windowMs: 50 });
     const key = 'test-reset';
 
     limiter.check(key);
     expect(limiter.check(key)).not.toBeNull();
 
     await new Promise(r => setTimeout(r, 60));
     expect(limiter.check(key)).toBeNull();
   });
 });