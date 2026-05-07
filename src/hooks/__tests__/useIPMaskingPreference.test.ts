import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIPMaskingPreference } from '../useIPMaskingPreference';

describe('useIPMaskingPreference', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('deve inicializar como false (default seguro)', () => {
    const { result } = renderHook(() => useIPMaskingPreference());
    expect(result.current.masked).toBe(false);
  });

  it('deve ler o valor persistido do localStorage na inicialização', () => {
    window.localStorage.setItem('singu:mask-ips', '1');
    const { result } = renderHook(() => useIPMaskingPreference());
    expect(result.current.masked).toBe(true);
  });

  it('setMasked(true) deve persistir "1" no localStorage', () => {
    const { result } = renderHook(() => useIPMaskingPreference());
    act(() => {
      result.current.setMasked(true);
    });
    expect(window.localStorage.getItem('singu:mask-ips')).toBe('1');
    expect(result.current.masked).toBe(true);
  });

  it('toggle() deve inverter o estado e persistir', () => {
    const { result } = renderHook(() => useIPMaskingPreference());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.masked).toBe(true);
    expect(window.localStorage.getItem('singu:mask-ips')).toBe('1');

    act(() => {
      result.current.toggle();
    });
    expect(result.current.masked).toBe(false);
    expect(window.localStorage.getItem('singu:mask-ips')).toBe('0');
  });

  it('deve sincronizar múltiplas instâncias na mesma aba via CustomEvent', () => {
    const { result: hook1 } = renderHook(() => useIPMaskingPreference());
    const { result: hook2 } = renderHook(() => useIPMaskingPreference());

    expect(hook1.current.masked).toBe(false);
    expect(hook2.current.masked).toBe(false);

    act(() => {
      hook1.current.setMasked(true);
    });

    expect(hook1.current.masked).toBe(true);
    expect(hook2.current.masked).toBe(true);
  });

  it('deve sincronizar com outras abas via evento storage', () => {
    const { result } = renderHook(() => useIPMaskingPreference());
    
    act(() => {
      // Simula evento disparado pelo navegador ao mudar em outra aba
      const event = new StorageEvent('storage', {
        key: 'singu:mask-ips',
        newValue: '1',
        storageArea: window.localStorage
      });
      window.dispatchEvent(event);
    });

    expect(result.current.masked).toBe(true);
  });

  it('deve ser tolerante a falhas no localStorage (modo privado)', () => {
    // Mockamos especificamente o setItem para lançar erro
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    
    // Capturamos console.warn para verificar se o log de erro foi disparado
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useIPMaskingPreference());
    
    act(() => {
      result.current.setMasked(true);
    });

    // Estado em memória deve atualizar mesmo com erro no storage
    expect(result.current.masked).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useIPMaskingPreference] Falha ao persistir preferência:'),
      expect.any(Error)
    );

    setItemSpy.mockRestore();
    warnSpy.mockRestore();
  });
});

