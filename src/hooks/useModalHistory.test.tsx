import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useModalHistory } from './useModalHistory';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('mantém uma entrada e fecha com o callback atual após rerender', async () => {
  vi.useFakeTimers();
  window.history.replaceState({ key: 'router-key', idx: 3, usr: { origem: 'busca' } }, '');
  const push = vi.spyOn(window.history, 'pushState');
  const firstClose = vi.fn();
  const latestClose = vi.fn();
  const hook = renderHook(({ onClose }) => useModalHistory(true, onClose, 'search'), {
    initialProps: { onClose: firstClose },
    wrapper: ({ children }: { children: ReactNode }) => <BrowserRouter>{children}</BrowserRouter>,
  });
  hook.rerender({ onClose: latestClose });
  expect(push).toHaveBeenCalledTimes(1);
  expect(window.history.state).toMatchObject({ idx: 4, usr: { origem: 'busca' }, modal: 'search' });
  act(() => window.history.back());
  await act(async () => vi.advanceTimersByTimeAsync(10));
  expect(hook.result.current.isClosing).toBe(true);
  await act(async () => vi.advanceTimersByTimeAsync(200));
  expect(hook.result.current.isClosing).toBe(false);
  expect(window.history.state).toMatchObject({ key: 'router-key', idx: 3, usr: { origem: 'busca' } });
  expect(latestClose).toHaveBeenCalledTimes(1);
  expect(firstClose).not.toHaveBeenCalled();
  hook.unmount();
});
