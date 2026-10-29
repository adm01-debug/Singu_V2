import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { parseISO } from 'date-fns';
import { normalizeExternalContact } from './useContacts';
import { useProactiveIntelligence } from './useProactiveIntelligence';

function contact(birthday: string | null) {
  return normalizeExternalContact({
    id: 'contato-1', user_id: 'usuario-1', version: 1,
    first_name: 'Ana', last_name: 'Silva', birthday,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(parseISO('2026-10-18T18:30:00'));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('aniversários na Inteligência Proativa', () => {
  it.each([
    ['1990-10-18', 'HOJE!', 'Agora!', 'critical', 'parabéns'],
    ['1990-10-19', '1 dia(s)', 'Em 1 dia(s)', 'high', 'Preparar mensagem'],
    ['1990-10-25', '7 dia(s)', 'Em 7 dia(s)', 'high', 'Preparar mensagem'],
  ])('distingue o aniversário %s sem depender do horário', (birthday, title, timing, priority, script) => {
    const { result } = renderHook(() => useProactiveIntelligence(contact(birthday), []));
    const action = result.current.actions.find(item => item.id === 'birthday-nurture');
    expect(action).toMatchObject({ title: `🎂 Aniversário em ${title}`, timing, priority });
    expect(action?.script).toContain(script);
  });

  it.each(['1990-10-17', '1990-10-26', null])('não recomenda aniversário fora da janela: %s', birthday => {
    const { result } = renderHook(() => useProactiveIntelligence(contact(birthday), []));
    expect(result.current.actions.some(item => item.id === 'birthday-nurture')).toBe(false);
  });

  it('prepara amanhã na virada do ano', () => {
    vi.setSystemTime(parseISO('2026-12-31T23:30:00'));
    const { result } = renderHook(() => useProactiveIntelligence(contact('1990-01-01'), []));
    expect(result.current.actions.find(item => item.id === 'birthday-nurture')).toMatchObject({
      title: '🎂 Aniversário em 1 dia(s)', timing: 'Em 1 dia(s)', priority: 'high',
      script: expect.stringContaining('01 de janeiro'),
    });
  });

  it('reflete a data editada sem remontar a ficha', () => {
    const { result, rerender } = renderHook(
      ({ birthday }) => useProactiveIntelligence(contact(birthday), []),
      { initialProps: { birthday: '1990-10-19' } },
    );
    expect(result.current.actions.find(item => item.id === 'birthday-nurture')?.timing).toBe('Em 1 dia(s)');
    rerender({ birthday: '1990-10-18' });
    expect(result.current.actions.find(item => item.id === 'birthday-nurture')?.timing).toBe('Agora!');
  });

  it('atravessa a meia-noite e o ano com as mesmas referências e limpa o timer ao desmontar', () => {
    vi.setSystemTime(parseISO('2026-12-31T23:59:59'));
    const props = { contact: contact('1990-01-01'), interactions: [] };
    const { result, unmount } = renderHook(() => useProactiveIntelligence(props.contact, props.interactions));
    expect(result.current.actions.find(item => item.id === 'birthday-nurture')?.timing).toBe('Em 1 dia(s)');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.actions.find(item => item.id === 'birthday-nurture')?.timing).toBe('Agora!');
    act(() => { vi.advanceTimersByTime(24 * 60 * 60 * 1000); });
    expect(result.current.actions.some(item => item.id === 'birthday-nurture')).toBe(false);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['focus', 'visibilitychange'])('atualiza o dia ao retomar uma aba suspensa por %s', event => {
    vi.setSystemTime(parseISO('2026-10-18T23:30:00'));
    const props = { contact: contact('1990-10-19'), interactions: [] };
    const { result } = renderHook(() => useProactiveIntelligence(props.contact, props.interactions));
    expect(result.current.actions.find(item => item.id === 'birthday-nurture')?.timing).toBe('Em 1 dia(s)');
    vi.setSystemTime(parseISO('2026-10-19T08:30:00'));
    act(() => { (event === 'focus' ? window : document).dispatchEvent(new Event(event)); });
    expect(result.current.actions.find(item => item.id === 'birthday-nurture')?.timing).toBe('Agora!');
    expect(vi.getTimerCount()).toBe(1);
  });
});
