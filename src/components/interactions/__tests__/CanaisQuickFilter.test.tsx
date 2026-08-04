import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanaisQuickFilter } from '@/components/interactions/CanaisQuickFilter';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
  },
}));

describe('CanaisQuickFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('auto mode: clicking a chip calls onChange immediately', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(onChange).toHaveBeenCalledWith(['email']);
  });

  it('manual mode: clicking a chip does NOT call onChange and shows Apply button', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
  });

  it('manual mode: Apply button calls onChange with pending selection', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByTitle('WhatsApp'));
    fireEvent.click(screen.getByText('Aplicar'));
    expect(onChange).toHaveBeenCalledWith(['email', 'whatsapp']);
  });

  it('manual mode: Revert opens confirmation and restores pending to applied value when confirmed', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('WhatsApp'));
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reverter/i }));
    // Confirma no dialog
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('manual mode: persists pending to localStorage', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByTitle('WhatsApp'));
    const stored = JSON.parse(localStorage.getItem('channel-pending-canais-anon') || '[]');
    expect(stored).toEqual(expect.arrayContaining(['email', 'whatsapp']));
  });

  it('manual mode: restores pending from localStorage on remount', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    localStorage.setItem('channel-pending-canais-anon', JSON.stringify(['email', 'call']));
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Aplicar'));
    expect(onChange).toHaveBeenCalledWith(['email', 'call']);
  });

  it('manual mode: clears persisted pending after apply (no divergence)', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    const onChange = vi.fn();
    const { rerender } = render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(localStorage.getItem('channel-pending-canais-anon')).not.toBeNull();
    fireEvent.click(screen.getByText('Aplicar'));
    rerender(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    expect(localStorage.getItem('channel-pending-canais-anon')).toBeNull();
  });

  it('manual mode: ignores invalid persisted values', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    localStorage.setItem('channel-pending-canais-anon', JSON.stringify(['email', 'invalid_channel', 'call']));
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Aplicar'));
    expect(onChange).toHaveBeenCalledWith(['email', 'call']);
  });

  it('auto mode: does not restore pending from localStorage', () => {
    localStorage.setItem('channel-sync-mode-anon', 'auto');
    localStorage.setItem('channel-pending-canais-anon', JSON.stringify(['email']));
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
  });

  it('auto mode: Limpar canais calls onChange with empty array', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email', 'whatsapp']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Limpar seleção de canais/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('manual mode: Limpar canais clears pending without calling onChange', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Limpar seleção de canais/i }));
    expect(onChange).not.toHaveBeenCalled();
    // Aplicar continua visível pra confirmar a divergência
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
  });

  it('Limpar canais button is hidden when no channels are selected', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    expect(screen.queryByRole('button', { name: /Limpar seleção de canais/i })).not.toBeInTheDocument();
  });

  it('counts: without counts prop, chips render only icon + label (no number)', () => {
    const onChange = vi.fn();
    const { container } = render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    // Nenhum span com o estilo de contador deve existir
    const counters = container.querySelectorAll('span.tabular-nums');
    expect(counters).toHaveLength(0);
  });

  it('counts: shows number next to chip and applies opacity-50 to zero-count chips', () => {
    const onChange = vi.fn();
    render(
      <CanaisQuickFilter canais={[]} onChange={onChange} counts={{ email: 12, whatsapp: 0 }} />
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    const whatsappChip = screen.getByTitle('WhatsApp');
    expect(whatsappChip.className).toContain('opacity-50');
    const emailChip = screen.getByTitle('Email');
    expect(emailChip.className).not.toContain('opacity-50');
  });

  it('counts: caps display at 999+ for counts greater than 999', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} counts={{ email: 1500 }} />);
    expect(screen.getByText('999+')).toBeInTheDocument();
  });

  it('keyboard: Alt+1 toggles WhatsApp in auto mode', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.keyDown(window, { key: '1', altKey: true });
    expect(onChange).toHaveBeenCalledWith(['whatsapp']);
  });

  it('keyboard: Alt+0 clears channels in auto mode', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    fireEvent.keyDown(window, { key: '0', altKey: true });
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('keyboard: Alt+N works even when focus is inside an input', () => {
    const onChange = vi.fn();
    render(
      <div>
        <input data-testid="search-input" />
        <CanaisQuickFilter canais={[]} onChange={onChange} />
      </div>
    );
    const input = screen.getByTestId('search-input') as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: '3', altKey: true, bubbles: true });
    expect(onChange).toHaveBeenCalledWith(['email']);
  });

  it('keyboard: in manual mode, Alt+N updates pending without calling onChange', () => {
    localStorage.setItem('channel-sync-mode-anon', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.keyDown(window, { key: '1', altKey: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
  });

  describe('Reverter (descarta pendências)', () => {
    it('restaura pending para os filtros aplicados após confirmar', () => {
      localStorage.setItem('channel-sync-mode-anon', 'manual');
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      // Cria divergência adicionando WhatsApp e removendo Email
      fireEvent.click(screen.getByTitle('WhatsApp'));
      fireEvent.click(screen.getByTitle('Email'));
      expect(screen.getByText('Aplicar')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Reverter/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));

      // Pending volta a bater com aplicado → bloco dirty some
      expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Reverter/i })).not.toBeInTheDocument();
      // Não propaga mudanças para o pai
      expect(onChange).not.toHaveBeenCalled();
    });

    it('remove channel-pending-canais do localStorage após reverter', () => {
      localStorage.setItem('channel-sync-mode-anon', 'manual');
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      fireEvent.click(screen.getByTitle('WhatsApp'));
      expect(localStorage.getItem('channel-pending-canais-anon')).not.toBeNull();

      fireEvent.click(screen.getByRole('button', { name: /Reverter/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));

      expect(localStorage.getItem('channel-pending-canais-anon')).toBeNull();
    });

    it('preserva channel-applied-canais no localStorage após reverter', () => {
      localStorage.setItem('channel-sync-mode-anon', 'manual');
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      fireEvent.click(screen.getByTitle('WhatsApp'));
      fireEvent.click(screen.getByRole('button', { name: /Reverter/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));

      const applied = JSON.parse(localStorage.getItem('channel-applied-canais-anon') || '[]');
      expect(applied).toEqual(['email']);
    });

    it('Esc reverte pendências sem abrir o diálogo de confirmação', () => {
      localStorage.setItem('channel-sync-mode-anon', 'manual');
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      fireEvent.click(screen.getByTitle('WhatsApp'));
      expect(screen.getByText('Aplicar')).toBeInTheDocument();
      expect(localStorage.getItem('channel-pending-canais-anon')).not.toBeNull();

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
      expect(localStorage.getItem('channel-pending-canais-anon')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('cancelar o diálogo mantém as pendências intactas', () => {
      localStorage.setItem('channel-sync-mode-anon', 'manual');
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      fireEvent.click(screen.getByTitle('WhatsApp'));
      fireEvent.click(screen.getByRole('button', { name: /Reverter/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(screen.getByText('Aplicar')).toBeInTheDocument();
      expect(localStorage.getItem('channel-pending-canais-anon')).not.toBeNull();
    });
  });

  describe('estado visual via prop `canais` e onChange add/remove', () => {
    // O chip usa `aria-pressed` (true para ativo, false para inativo).
    // Estes testes blindam o contrato visual: mudar a prop `canais` deve
    // atualizar imediatamente o estado pressed dos chips, e cliques em modo
    // auto devem chamar onChange com o array final (add/remove do canal).

    it('marca aria-pressed=true apenas nos chips presentes em `canais`', () => {
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email', 'whatsapp']} onChange={onChange} />);

      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTitle('WhatsApp')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTitle('Ligação')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTitle('Reunião')).toHaveAttribute('aria-pressed', 'false');
    });

    it('todos os chips começam desmarcados quando `canais` é vazio', () => {
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={[]} onChange={onChange} />);

      ['Email', 'WhatsApp', 'Ligação', 'Reunião'].forEach((label) => {
        expect(screen.getByTitle(label)).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('auto mode: clicar em chip INATIVO chama onChange adicionando o canal', () => {
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      expect(screen.getByTitle('WhatsApp')).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(screen.getByTitle('WhatsApp'));

      expect(onChange).toHaveBeenCalledTimes(1);
      const next = onChange.mock.calls[0][0] as string[];
      expect(next).toEqual(expect.arrayContaining(['email', 'whatsapp']));
      expect(next).toHaveLength(2);
    });

    it('auto mode: clicar em chip ATIVO chama onChange removendo só aquele canal', () => {
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email', 'whatsapp', 'call']} onChange={onChange} />);

      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(screen.getByTitle('Email'));

      expect(onChange).toHaveBeenCalledTimes(1);
      const next = onChange.mock.calls[0][0] as string[];
      expect(next).not.toContain('email');
      expect(next).toEqual(expect.arrayContaining(['whatsapp', 'call']));
      expect(next).toHaveLength(2);
    });

    it('auto mode: remover o ÚNICO canal ativo chama onChange com []', () => {
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      fireEvent.click(screen.getByTitle('Email'));
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('atualiza aria-pressed quando a prop `canais` muda em re-render', () => {
      const onChange = vi.fn();
      const { rerender } = render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'false');

      rerender(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'true');

      rerender(<CanaisQuickFilter canais={[]} onChange={onChange} />);
      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'false');
    });

    it('chip ativo recebe estilo sólido (bg-primary); inativo, não', () => {
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      expect(screen.getByTitle('Email').className).toContain('bg-primary');
      expect(screen.getByTitle('WhatsApp').className).not.toContain('bg-primary');
    });
  });

  describe('sincronização entre modo manual e estado aplicado pela URL', () => {
    // Cenários blindados: ao alternar modo, o estado visual dos chips
    // (`aria-pressed`) deve refletir EXATAMENTE o `canais` aplicado pelo
    // pai (URL), sem deixar pendências fantasmas herdadas de estado órfão.

    it('auto→manual: pending órfão do localStorage não causa divergência ao entrar em manual', () => {
      // Pending salvo de uma sessão anterior, mas usuário está agora em auto
      // com canais=[email] vindo da URL.
      localStorage.setItem('channel-sync-mode-anon', 'auto');
      localStorage.setItem('channel-pending-canais-anon', JSON.stringify(['whatsapp', 'call']));

      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      // Em auto: não deve mostrar Aplicar.
      expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();

      // Alterna para manual.
      fireEvent.click(screen.getByRole('button', { name: /Mudar para modo manual/i }));

      // O bloco "Aplicar" NÃO deve aparecer — pending foi alinhado a safe.
      expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();

      // Chips refletem URL: só Email pressionado.
      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTitle('WhatsApp')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTitle('Ligação')).toHaveAttribute('aria-pressed', 'false');

      // Pending órfão foi removido do storage.
      expect(localStorage.getItem('channel-pending-canais-anon')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('manual→auto: aplica pending e re-sincroniza chips com o novo safe via re-render', () => {
      localStorage.setItem('channel-sync-mode-anon', 'manual');
      const onChange = vi.fn();
      const { rerender } = render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      // Cria divergência: adiciona WhatsApp pendente.
      fireEvent.click(screen.getByTitle('WhatsApp'));
      expect(screen.getByText('Aplicar')).toBeInTheDocument();

      // Volta para auto.
      fireEvent.click(screen.getByRole('button', { name: /Mudar para modo automático/i }));

      // onChange foi chamado com o pending.
      expect(onChange).toHaveBeenCalledWith(['email', 'whatsapp']);

      // Pai propaga o novo safe via re-render.
      rerender(<CanaisQuickFilter canais={['email', 'whatsapp']} onChange={onChange} />);

      // Chips refletem o novo aplicado, sem pending residual.
      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTitle('WhatsApp')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
      expect(localStorage.getItem('channel-pending-canais-anon')).toBeNull();
    });

    it('manual→auto: pai descarta canal inválido — voltar para manual NÃO mostra divergência fantasma', () => {
      // Cenário: pai (whitelist da URL) ignorou um canal pendente. Sem o
      // realinhamento, voltar para manual mostraria Aplicar sem o usuário
      // ter feito nada na nova sessão de modo.
      localStorage.setItem('channel-sync-mode-anon', 'manual');
      const onChange = vi.fn();
      const { rerender } = render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      fireEvent.click(screen.getByTitle('WhatsApp'));
      expect(screen.getByText('Aplicar')).toBeInTheDocument();

      // Vai para auto…
      fireEvent.click(screen.getByRole('button', { name: /Mudar para modo automático/i }));
      // …mas o pai aplicou só ['email'] (descartou whatsapp por algum motivo).
      rerender(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      // Volta para manual.
      fireEvent.click(screen.getByRole('button', { name: /Mudar para modo manual/i }));

      // Sem divergência: pending foi realinhado ao safe pelo effect.
      expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
      expect(screen.getByTitle('WhatsApp')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'true');
    });

    it('alternâncias repetidas auto↔manual sem mudanças não criam divergência', () => {
      const onChange = vi.fn();
      render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);

      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /Mudar para modo manual/i }));
        expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Mudar para modo automático/i }));
        expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
      }

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByTitle('Email')).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
