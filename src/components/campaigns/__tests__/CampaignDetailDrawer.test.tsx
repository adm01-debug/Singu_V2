import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { CampaignDetailDrawer } from '../CampaignDetailDrawer';
import type { EmailCampaign } from '@/hooks/useEmailCampaigns';

const sendMutate = vi.fn();
vi.mock('@/hooks/useEmailCampaigns', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useEmailCampaigns')>('@/hooks/useEmailCampaigns');
  return {
    ...actual,
    useEmailCampaigns: () => ({
      sendCampaign: { mutate: sendMutate, isPending: false },
    }),
  };
});

vi.mock('@/hooks/useCampaignRecipients', () => ({
  useCampaignRecipients: () => ({
    data: [
      { id: 'r1', campaign_id: 'c1', contact_id: 'ct1', email: 'foo@bar.com', status: 'opened', sent_at: '2025-01-01T00:00:00Z', opened_at: null, clicked_at: null, created_at: '2025-01-01' },
      { id: 'r2', campaign_id: 'c1', contact_id: 'ct2', email: 'baz@qux.com', status: 'bounced', sent_at: null, opened_at: null, clicked_at: null, created_at: '2025-01-01' },
    ],
    isLoading: false,
  }),
}));

function makeCampaign(overrides: Partial<EmailCampaign> = {}): EmailCampaign {
  return {
    id: 'c1',
    user_id: 'u1',
    name: 'Promo Outono',
    subject: 'Aproveite descontos exclusivos',
    content_html: null,
    content_text: null,
    status: 'draft',
    segment_filter: {},
    tags: [],
    scheduled_at: null,
    sent_at: null,
    total_recipients: 200,
    total_opened: 60,
    total_clicked: 20,
    total_bounced: 4,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderDrawer(campaign: EmailCampaign | null) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CampaignDetailDrawer campaign={campaign} open={true} onOpenChange={() => {}} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CampaignDetailDrawer', () => {
  it('returns null when no campaign provided', () => {
    const { container } = renderDrawer(null);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders campaign name, subject and computed metric percentages', () => {
    renderDrawer(makeCampaign());
    expect(screen.getByText('Promo Outono')).toBeInTheDocument();
    expect(screen.getByText('Aproveite descontos exclusivos')).toBeInTheDocument();
    // open rate 60/200 = 30%
    expect(screen.getByText('30%')).toBeInTheDocument();
    // click rate 20/200 = 10%
    expect(screen.getByText('10%')).toBeInTheDocument();
    // bounce rate 4/200 = 2%
    expect(screen.getByText('2%')).toBeInTheDocument();
    // total recipients
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('shows the send CTA only for drafts and triggers mutation on click', async () => {
    const user = userEvent.setup();
    renderDrawer(makeCampaign({ status: 'draft' }));
    const btn = screen.getByRole('button', { name: /Materializar & Enviar/i });
    await user.click(btn);
    expect(sendMutate).toHaveBeenCalledWith('c1');
  });

  it('hides the send CTA for sent campaigns and shows the sent timestamp', () => {
    renderDrawer(makeCampaign({ status: 'sent', sent_at: new Date(Date.now() - 60_000).toISOString() }));
    expect(screen.queryByRole('button', { name: /Materializar & Enviar/i })).toBeNull();
    expect(screen.getByText(/Enviada/i)).toBeInTheDocument();
  });

  it('renders recipients with semantic status badges', () => {
    renderDrawer(makeCampaign());
    expect(screen.getByText('foo@bar.com')).toBeInTheDocument();
    expect(screen.getByText('baz@qux.com')).toBeInTheDocument();
    expect(screen.getByText('Aberto')).toBeInTheDocument();
    expect(screen.getByText('Bounce')).toBeInTheDocument();
  });

  it('handles zero recipients without dividing by zero', () => {
    renderDrawer(makeCampaign({ total_recipients: 0, total_opened: 0, total_clicked: 0, total_bounced: 0 }));
    // All three rates should be 0%
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(3);
  });
});
