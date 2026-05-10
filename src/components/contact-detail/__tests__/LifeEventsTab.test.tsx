import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LifeEventsTab } from '../LifeEventsTab';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';

// Mocking Supabase and Hooks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  </QueryClientProvider>
);

describe('LifeEventsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and shows the title', () => {
    render(<LifeEventsTab contactId="test-contact-id" />, { wrapper });
    expect(screen.getByText(/Eventos de Vida & Marcos/i)).toBeInTheDocument();
  });

  it('displays the gap checklist tab', () => {
    render(<LifeEventsTab contactId="test-contact-id" />, { wrapper });
    const analysisTab = screen.getByRole('tab', { name: /Gaps & Análise/i });
    expect(analysisTab).toBeInTheDocument();
    
    fireEvent.click(analysisTab);
    expect(screen.getByText(/Diagnóstico de Marcos/i)).toBeInTheDocument();
  });

  it('displays the audit trail tab', () => {
    render(<LifeEventsTab contactId="test-contact-id" />, { wrapper });
    const auditTab = screen.getByRole('tab', { name: /Auditoria/i });
    expect(auditTab).toBeInTheDocument();
    
    fireEvent.click(auditTab);
    expect(screen.getByText(/Histórico de Governança/i)).toBeInTheDocument();
  });
});
