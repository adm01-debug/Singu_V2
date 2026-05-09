import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIPMaskingPreference } from '../useIPMaskingPreference';

describe('useIPMaskingPreference', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should initialize as false (safe default)', () => {
    const { result } = renderHook(() => useIPMaskingPreference());
    expect(result.current.masked).toBe(false);
  });

  it('should read persisted value from localStorage on init', () => {
    window.localStorage.setItem('singu:mask-ips', '1');
    const { result } = renderHook(() => useIPMaskingPreference());
    expect(result.current.masked).toBe(true);
  });

  it('setMasked(true) should persist "1" in localStorage', () => {
    const { result } = renderHook(() => useIPMaskingPreference());
    act(() => {
      result.current.setMasked(true);
    });
    expect(window.localStorage.getItem('singu:mask-ips')).toBe('1');
    expect(result.current.masked).toBe(true);
  });

  it('toggle() should flip the state and persist', () => {
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

  it('should sync multiple instances in the same tab via CustomEvent', () => {
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

  it('should sync with other tabs via native storage event', () => {
    const { result } = renderHook(() => useIPMaskingPreference());
    
    act(() => {
      // Simulate browser event fired when storage changes in another tab
      const event = new StorageEvent('storage', {
        key: 'singu:mask-ips',
        newValue: '1',
        storageArea: window.localStorage
      });
      window.dispatchEvent(event);
    });

    expect(result.current.masked).toBe(true);
  });

  it('should be fault tolerant when localStorage fails (private mode)', () => {
    // Mock setItem to throw
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    
    // Catch console.warn to verify error logging
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useIPMaskingPreference());
    
    act(() => {
      result.current.setMasked(true);
    });

    // In-memory state should still update
    expect(result.current.masked).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useIPMaskingPreference] Failed to persist preference:'),
      expect.any(Error)
    );

    setItemSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should be fault tolerant if reading localStorage fails', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access Denied');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useIPMaskingPreference());
    
    expect(result.current.masked).toBe(false); // Default
    expect(warnSpy).toHaveBeenCalled();

    getItemSpy.mockRestore();
    warnSpy.mockRestore();
  });
});


