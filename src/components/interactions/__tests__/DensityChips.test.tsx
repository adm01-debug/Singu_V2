/**
 * Testes do componente `DensityChips`.
 *
 * Cobertura:
 *  - Renderiza dois botões (Confortável/Compacta) com `aria-pressed` correto
 *    em ambos os estados (`comfortable` e `compact`).
 *  - Expõe `role="group"` com `aria-label` para leitores de tela.
 *  - Clicar no chip inativo dispara `onChange` UMA ÚNICA vez com o valor novo.
 *  - Clicar no chip JÁ ativo NÃO dispara `onChange` (idempotência por design,
 *    evita re-renders e reset de URL/state quando o usuário re-clica).
 *  - Alternância funciona nas duas direções (comfortable ↔ compact).
 *  - Sequência de cliques contabiliza uma chamada por clique efetivo.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { DensityChips } from '@/components/interactions/DensityChips';

afterEach(() => cleanup());

describe('DensityChips', () => {
  it('renderiza dois botões com aria-pressed correto (comfortable ativo)', () => {
    render(<DensityChips value="comfortable" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Confortável' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Compacta' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renderiza com aria-pressed refletindo compact quando ativo', () => {
    render(<DensityChips value="compact" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Confortável' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Compacta' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('expõe role="group" com aria-label "Densidade da lista"', () => {
    render(<DensityChips value="comfortable" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: /densidade da lista/i })).toBeInTheDocument();
  });

  it('click no botão inativo dispara onChange uma vez com o novo valor', () => {
    const onChange = vi.fn();
    render(<DensityChips value="comfortable" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compacta' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('compact');
  });

  it('click no botão ativo é no-op (idempotência)', () => {
    const onChange = vi.fn();
    render(<DensityChips value="compact" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compacta' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('alterna nas duas direções: compact → comfortable também funciona', () => {
    const onChange = vi.fn();
    render(<DensityChips value="compact" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confortável' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('comfortable');
  });

  it('múltiplos cliques em chips diferentes disparam onChange por clique', () => {
    const onChange = vi.fn();
    const { rerender } = render(<DensityChips value="comfortable" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compacta' }));
    rerender(<DensityChips value="compact" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confortável' }));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, 'compact');
    expect(onChange).toHaveBeenNthCalledWith(2, 'comfortable');
  });
});
