import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useContactIntelligence } from '../useContactIntelligence';
import { useBestContactTime } from '../useBestContactTime';
import { useBirthdayContacts } from '../useBirthdayContacts';
import { useOrphanContacts } from '../useOrphanContacts';
import { useDuplicateContacts } from '../useDuplicateContacts';

const callExternalRpcMock = vi.fn();
vi.mock('@/lib/externalData', () => ({
  callExternalRpc: (...args: unknown[]) => callExternalRpcMock(...args),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useContactIntelligence', () => {
  it('skips when contactId empty', () => {
    const { result } = renderHook(() => useContactIntelligence(''), { wrapper: makeWrapper() });
    expect(result.current.isFetching).toBe(false);
    expect(callExternalRpcMock).not.toHaveBeenCalled();
  });

  it('returns first item when RPC returns array', async () => {
    callExternalRpcMock.mockResolvedValue({ data: [{ contact_id: 'c1', relationship_score: 88 }], error: null });
    const { result } = renderHook(() => useContactIntelligence('c1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.relationship_score).toBe(88);
    expect(callExternalRpcMock).toHaveBeenCalledWith('get_contact_intelligence', { p_contact_id: 'c1' });
  });

  it('returns object directly when RPC returns single', async () => {
    callExternalRpcMock.mockResolvedValue({ data: { contact_id: 'c1', nps_score: 9 }, error: null });
    const { result } = renderHook(() => useContactIntelligence('c1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nps_score).toBe(9);
  });

  it('propagates errors from RPC', async () => {
    callExternalRpcMock.mockResolvedValue({ data: null, error: new Error('rpc-down') });
    const { result } = renderHook(() => useContactIntelligence('c1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('rpc-down');
  });
});

describe('useBestContactTime', () => {
  it('handles array response', async () => {
    callExternalRpcMock.mockResolvedValue({ data: [{ day_of_week: 2, hour_of_day: 10, success_rate: 0.8 }], error: null });
    const { result } = renderHook(() => useBestContactTime('c1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.day_of_week).toBe(2);
  });

  it('returns null when array empty', async () => {
    callExternalRpcMock.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useBestContactTime('c1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useBirthdayContacts', () => {
  it('returns array when RPC succeeds', async () => {
    callExternalRpcMock.mockResolvedValue({ data: [{ contact_id: '1', full_name: 'Ana', days_until: 3 }], error: null });
    const { result } = renderHook(() => useBirthdayContacts(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('coerces non-array to empty', async () => {
    callExternalRpcMock.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useBirthdayContacts(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useOrphanContacts', () => {
  it('returns array on success', async () => {
    callExternalRpcMock.mockResolvedValue({ data: [{ contact_id: 'o1', full_name: 'Sem Empresa' }], error: null });
    const { result } = renderHook(() => useOrphanContacts(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].full_name).toBe('Sem Empresa');
  });
});

describe('useDuplicateContacts', () => {
  it('swallows RPC errors and returns empty array (resilience)', async () => {
    callExternalRpcMock.mockResolvedValue({ data: null, error: new Error('schema-drift') });
    const { result } = renderHook(() => useDuplicateContacts(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 8000 });
    expect(result.current.data).toEqual([]);
  }, 10000);

  it('returns array on success', async () => {
    callExternalRpcMock.mockResolvedValue({ data: [{ id: 'd1', full_name: 'Duplicado' }], error: null });
    const { result } = renderHook(() => useDuplicateContacts(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 8000 });
    expect(result.current.data).toHaveLength(1);
  }, 10000);
});
