import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { DateRangePopover } from '@/components/interactions/DateRangePopover';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn() },
}));

/**
 * Atalho Alt+D: limpa SOMENTE o range de datas (de/ate), preservando todos os
 * outros filtros. O componente é o único responsável pela ação porque é o
 * único que recebe `de`, `ate` e `applyDateRange` — manter o atalho aqui
 * evita acoplamento com a página inteira.
 */
describe('DateRangePopover · atalho Alt+D', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama applyDateRange(undefined, undefined) quando há datas aplicadas', () => {
    const apply = vi.fn().mockReturnValue(false);
    render(
      <DateRangePopover
        de={new Date('2025-01-01')}
        ate={new Date('2025-01-31')}
        applyDateRange={apply}
      />,
    );

    fireEvent.keyDown(window, { key: 'd', altKey: true });

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(undefined, undefined);
  });

  it('aceita Alt+D em maiúsculas (case-insensitive)', () => {
    const apply = vi.fn().mockReturnValue(false);
    render(<DateRangePopover de={new Date('2025-01-01')} ate={undefined} applyDateRange={apply} />);

    fireEvent.keyDown(window, { key: 'D', altKey: true });

    expect(apply).toHaveBeenCalledWith(undefined, undefined);
  });

  it('é no-op silencioso quando não há datas aplicadas', () => {
    const apply = vi.fn();
    render(<DateRangePopover de={undefined} ate={undefined} applyDateRange={apply} />);

    fireEvent.keyDown(window, { key: 'd', altKey: true });

    expect(apply).not.toHaveBeenCalled();
  });

  it('ignora Alt+D quando o foco está em um <input> (preserva digitação)', () => {
    const apply = vi.fn();
    render(
      <div>
        <input data-testid="search" />
        <DateRangePopover
          de={new Date('2025-01-01')}
          ate={new Date('2025-01-31')}
          applyDateRange={apply}
        />
      </div>,
    );

    const input = screen.getByTestId('search') as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: 'd', altKey: true, bubbles: true });

    expect(apply).not.toHaveBeenCalled();
  });

  it('ignora Alt+D em <textarea> e contenteditable', () => {
    const apply = vi.fn();
    render(
      <div>
        <textarea data-testid="ta" />
        <div data-testid="ce" contentEditable />
        <DateRangePopover de={new Date('2025-01-01')} ate={undefined} applyDateRange={apply} />
      </div>,
    );

    const ta = screen.getByTestId('ta');
    ta.focus();
    fireEvent.keyDown(ta, { key: 'd', altKey: true, bubbles: true });
    expect(apply).not.toHaveBeenCalled();

    // jsdom não trata `contentEditable` no JSX como editável; forçamos a flag
    // via DOM API para refletir o comportamento real do browser.
    const ce = screen.getByTestId('ce');
    ce.setAttribute('contenteditable', 'true');
    Object.defineProperty(ce, 'isContentEditable', { configurable: true, get: () => true });
    ce.focus();
    fireEvent.keyDown(ce, { key: 'd', altKey: true, bubbles: true });
    expect(apply).not.toHaveBeenCalled();
  });

  it('NÃO dispara com modificadores extras (Ctrl/Meta/Shift)', () => {
    const apply = vi.fn();
    render(
      <DateRangePopover
        de={new Date('2025-01-01')}
        ate={new Date('2025-01-31')}
        applyDateRange={apply}
      />,
    );

    fireEvent.keyDown(window, { key: 'd', altKey: true, ctrlKey: true });
    fireEvent.keyDown(window, { key: 'd', altKey: true, metaKey: true });
    fireEvent.keyDown(window, { key: 'd', altKey: true, shiftKey: true });
    fireEvent.keyDown(window, { key: 'd' }); // sem Alt
    expect(apply).not.toHaveBeenCalled();
  });

  it('NÃO afeta outros filtros: chama applyDateRange (não setFilter de canais/q/sort)', () => {
    // O contrato é: o atalho usa exclusivamente `applyDateRange`, que pelo
    // hook só toca `de` e `ate` na URL. Aqui blindamos a assinatura usada.
    const apply = vi.fn().mockReturnValue(false);
    render(<DateRangePopover de={new Date('2025-01-01')} ate={undefined} applyDateRange={apply} />);

    fireEvent.keyDown(window, { key: 'd', altKey: true });

    expect(apply).toHaveBeenCalledTimes(1);
    const args = apply.mock.calls[0];
    expect(args).toEqual([undefined, undefined]);
  });
});
