import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SortChips } from '../SortChips';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';

vi.mock('sonner', () => ({
  toast: { message: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

describe('SortChips', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza os 4 chips', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={false} />);
    expect(screen.getByLabelText('Mais recentes')).toBeInTheDocument();
    expect(screen.getByLabelText('Mais antigas')).toBeInTheDocument();
    expect(screen.getByLabelText('Melhor correspondência')).toBeInTheDocument();
    expect(screen.getByLabelText('Por pessoa/empresa')).toBeInTheDocument();
  });

  it('chip ativo recebe aria-pressed=true', () => {
    render(<SortChips value="oldest" onChange={() => {}} hasQuery={false} />);
    expect(screen.getByLabelText('Mais antigas')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Mais recentes')).toHaveAttribute('aria-pressed', 'false');
  });

  it('click em chip inativo chama onChange', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={false} />);
    fireEvent.click(screen.getByLabelText('Mais antigas'));
    expect(onChange).toHaveBeenCalledWith('oldest');
  });

  it('Melhor correspondência fica disabled sem query', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={false} />);
    expect(screen.getByLabelText('Melhor correspondência')).toBeDisabled();
  });

  it('Melhor correspondência fica habilitada com query', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={true} />);
    expect(screen.getByLabelText('Melhor correspondência')).not.toBeDisabled();
  });

  it('Alt+R chama onChange("recent")', () => {
    const onChange = vi.fn();
    render(<SortChips value="oldest" onChange={onChange} hasQuery={false} />);
    fireEvent.keyDown(window, { key: 'r', altKey: true });
    expect(onChange).toHaveBeenCalledWith('recent');
  });

  it('Alt+M é ignorado quando hasQuery=false', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={false} />);
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Alt+M funciona quando hasQuery=true', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={true} />);
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    expect(onChange).toHaveBeenCalledWith('relevance');
  });

  it('clicar no chip ativo é no-op', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={false} />);
    fireEvent.click(screen.getByLabelText('Mais recentes'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('mostra ícone info no chip de relevância quando hasQuery=true', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={true} />);
    const icon = screen.getByTestId('relevance-info-icon');
    expect(icon).toBeInTheDocument();
    const button = screen.getByLabelText('Melhor correspondência');
    expect(button).toContainElement(icon);
  });

  it('não mostra ícone info quando hasQuery=false', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={false} />);
    expect(screen.queryByTestId('relevance-info-icon')).not.toBeInTheDocument();
  });

  it('click no chip de relevância continua funcionando com ícone info presente', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={true} />);
    fireEvent.click(screen.getByLabelText('Melhor correspondência'));
    expect(onChange).toHaveBeenCalledWith('relevance');
  });

  it('"Por canal" fica disabled quando channelCounts vazio', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={false} channelCounts={{}} />);
    expect(screen.getByLabelText('Por canal')).toBeDisabled();
  });

  it('"Por canal" fica habilitado quando há contagens > 0', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={false} channelCounts={{ whatsapp: 3 }} />);
    const btn = screen.getByLabelText('Por canal');
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith('channel');
  });
});

// ---------- Integração com useInteractionsAdvancedFilter (URL) ----------

function Harness() {
  const { filters, setFilter } = useInteractionsAdvancedFilter();
  const loc = useLocation();
  return (
    <div>
      <div data-testid="search">{loc.search}</div>
      <div data-testid="page">{filters.page}</div>
      <SortChips
        value={filters.sort}
        onChange={(v) => setFilter('sort', v)}
        hasQuery={!!filters.q.trim()}
        channelCounts={{ whatsapp: 5, email: 2 }}
      />
    </div>
  );
}

function renderHarness(initialEntries: string[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Harness />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SortChips · integração com useInteractionsAdvancedFilter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hidrata o chip ativo a partir do parâmetro ?sort= da URL', () => {
    renderHarness(['/interacoes?sort=oldest']);
    expect(screen.getByLabelText('Mais antigas')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Mais recentes')).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicar em outro chip grava ?sort= na URL (omitindo default "recent")', () => {
    renderHarness(['/interacoes?sort=oldest']);
    expect(screen.getByTestId('search').textContent).toContain('sort=oldest');

    // voltar ao default remove o parâmetro
    act(() => { fireEvent.click(screen.getByLabelText('Mais recentes')); });
    expect(screen.getByTestId('search').textContent).not.toContain('sort=');

    // mudar para outro non-default re-grava
    act(() => { fireEvent.click(screen.getByLabelText('Por pessoa/empresa')); });
    expect(screen.getByTestId('search').textContent).toContain('sort=entity');
  });

  it('trocar o sort reseta page=1 (remove ?page= da URL) preservando demais filtros', () => {
    renderHarness(['/interacoes?canais=whatsapp&page=4&sort=oldest']);
    expect(screen.getByTestId('page').textContent).toBe('4');

    act(() => { fireEvent.click(screen.getByLabelText('Por pessoa/empresa')); });

    const search = screen.getByTestId('search').textContent ?? '';
    expect(search).toContain('sort=entity');
    expect(search).toContain('canais=whatsapp');
    expect(search).not.toContain('page=');
    expect(screen.getByTestId('page').textContent).toBe('1');
  });

  it('compatibilidade: sort=relevance sem q efetivo cai para "Mais recentes" visualmente', () => {
    renderHarness(['/interacoes?sort=relevance']);
    expect(screen.getByLabelText('Melhor correspondência')).toBeDisabled();
    expect(screen.getByLabelText('Mais recentes')).toHaveAttribute('aria-pressed', 'true');
  });
});
