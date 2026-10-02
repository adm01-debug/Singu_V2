import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebhookReplayButton } from './WebhookReplayButton';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

describe('WebhookReplayButton', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'jwt-admin' } },
    });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('envia replay administrativo autenticado sem expor o segredo HMAC', async () => {
    render(<WebhookReplayButton webhookToken="token-1" payload={{ nome: 'Ana' }} />);

    fireEvent.click(screen.getByRole('button', { name: /testar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toContain('/incoming-webhook/token-1?');
    expect(url).toContain('admin_replay=true');
    expect(url).toContain('dry_run=true');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer jwt-admin',
      apikey: 'test-key',
    });
    expect(init.headers).not.toHaveProperty('X-Lovable-Signature');
  });
});
