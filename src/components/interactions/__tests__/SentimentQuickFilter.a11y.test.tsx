import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SentimentQuickFilter } from '../SentimentQuickFilter';
import type { SentimentoFilter } from '@/hooks/useInteractionsAdvancedFilter';

function setup(value: SentimentoFilter | undefined = undefined) {
  const onChange = vi.fn();
  render(
    <SentimentQuickFilter
      value={value}
      onChange={onChange}
      counts={{ positive: 5, neutral: 2, negative: 0, mixed: 1 }}
    />,
  );
  return { onChange };
}

describe('SentimentQuickFilter — acessibilidade', () => {
  it('expõe role=radiogroup com aria-label descritivo', () => {
    setup();
    const group = screen.getByRole('radiogroup', { name: /filtrar por sentimento/i });
    expect(group).toBeInTheDocument();
  });

  it('todos os chips têm role=radio com aria-checked refletindo o estado', () => {
    setup('positive');
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    const positivo = radios.find((r) => r.getAttribute('aria-label')?.startsWith('Positivo'))!;
    expect(positivo.getAttribute('aria-checked')).toBe('true');
    radios
      .filter((r) => r !== positivo)
      .forEach((r) => expect(r.getAttribute('aria-checked')).toBe('false'));
  });

  it('roving tabindex: somente o item ativo é alcançável por Tab', () => {
    setup('neutral');
    const radios = screen.getAllByRole('radio');
    const ativo = radios.find((r) => r.getAttribute('aria-checked') === 'true')!;
    expect(ativo.getAttribute('tabindex')).toBe('0');
    radios
      .filter((r) => r !== ativo)
      .forEach((r) => expect(r.getAttribute('tabindex')).toBe('-1'));
  });

  it('quando nenhum filtro está ativo, "Todos" é o ponto de entrada por Tab', () => {
    setup(undefined);
    const todos = screen.getByRole('radio', { name: /todos os sentimentos/i });
    expect(todos.getAttribute('tabindex')).toBe('0');
    expect(todos.getAttribute('aria-checked')).toBe('true');
  });

  it('aria-label inclui a contagem para leitores de tela', () => {
    setup();
    expect(screen.getByRole('radio', { name: 'Positivo (5 interações)' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Neutro (2 interações)' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Negativo (0 interações)' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Misto (1 interação)' })).toBeInTheDocument();
  });

  it('setas movem o foco entre os chips (com wrap-around)', async () => {
    const user = userEvent.setup();
    setup(undefined);
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radios[1]);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(document.activeElement).toBe(radios[radios.length - 1]); // wrap
  });

  it('Home/End focam primeiro/último chip', async () => {
    const user = userEvent.setup();
    setup(undefined);
    const radios = screen.getAllByRole('radio');
    radios[2].focus();
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(radios[radios.length - 1]);
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('Enter seleciona o chip focado', async () => {
    const user = userEvent.setup();
    const { onChange } = setup(undefined);
    screen.getByRole('radio', { name: /positivo/i }).focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('positive');
  });

  it('Space seleciona o chip focado (compatível com role=radio)', async () => {
    const user = userEvent.setup();
    const { onChange } = setup(undefined);
    screen.getByRole('radio', { name: /negativo/i }).focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith('negative');
  });

  it('clicar em "Todos" limpa o filtro chamando onChange(undefined)', async () => {
    const user = userEvent.setup();
    const { onChange } = setup('positive');
    await user.click(screen.getByRole('radio', { name: /todos os sentimentos/i }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
