import { FunctionsHttpError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { resolveHealthResponse } from './systemHealth';

const unavailablePayload = {
  status: 'unavailable',
  timestamp: '2026-10-02T00:00:00.000Z',
  total_latency_ms: 10,
  components: {
    whatsapp: { status: 'not_configured' },
  },
  alerts_count: null,
};

describe('resolveHealthResponse', () => {
  it('preserva a resposta 503 estruturada da Edge Function', async () => {
    const response = new Response(JSON.stringify(unavailablePayload), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(
      resolveHealthResponse(null, new FunctionsHttpError(response)),
    ).resolves.toEqual(unavailablePayload);
  });

  it('propaga erro de transporte em vez de inferir estado saudável', async () => {
    await expect(
      resolveHealthResponse(null, new Error('falha de rede')),
    ).rejects.toThrow('falha de rede');
  });
});
