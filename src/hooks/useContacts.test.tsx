import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContacts } from './useContacts';
import * as externalData from '@/lib/externalData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useActivityLogger', () => ({
  useActivityLogger: () => ({ logActivity: vi.fn() }),
}));

vi.mock('@/lib/externalData', () => ({
  queryExternalData: vi.fn(),
  insertExternalData: vi.fn(),
  updateExternalData: vi.fn(),
  deleteExternalData: vi.fn(),
  updateExternalDataWithVersion: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('useContacts CRUD & Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should fetch first page of contacts (50 per page)', async () => {
    const mockData = Array.from({ length: 50 }, (_, i) => ({
      id: `id-${i}`,
      first_name: `User ${i}`,
      last_name: 'Test',
      updated_at: new Date().toISOString(),
    }));

    vi.mocked(externalData.queryExternalData).mockResolvedValue({
      data: mockData,
      count: 100,
      error: null,
    });

    const { result } = renderHook(() => useContacts(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.contacts).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);
    expect(externalData.queryExternalData).toHaveBeenCalledWith(expect.objectContaining({
      range: { from: 0, to: 49 }
    }));
  });

  it('should fetch every page when the consumer requires the full dataset', async () => {
    const firstPage = Array.from({ length: 50 }, (_, i) => ({
      id: `id-${i}`,
      first_name: `User ${i}`,
      last_name: 'Test',
      updated_at: new Date().toISOString(),
    }));
    const secondPage = Array.from({ length: 30 }, (_, i) => ({
      id: `id-${i + 50}`,
      first_name: `User ${i + 50}`,
      last_name: 'Test',
      updated_at: new Date().toISOString(),
    }));

    vi.mocked(externalData.queryExternalData)
      .mockResolvedValueOnce({ data: firstPage, count: 80, error: null })
      .mockResolvedValueOnce({ data: secondPage, count: null, error: null });

    const { result } = renderHook(
      () => useContacts(undefined, { fetchAll: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.contacts).toHaveLength(80);
    expect(externalData.queryExternalData).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ range: { from: 50, to: 99 } }),
    );
  });

  it('should create a contact with mapped hobbies and interests', async () => {
    const newContact = {
      first_name: 'John',
      last_name: 'Doe',
      hobbies: ['Reading', 'Hiking'],
      interests: ['AI', 'Tech'],
      family_info: 'Married with 2 kids'
    };

    vi.mocked(externalData.insertExternalData).mockResolvedValue({
      data: { ...newContact, id: 'new-id', updated_at: new Date().toISOString() },
      error: null,
    });

    const { result } = renderHook(() => useContacts(), { wrapper });
    
    await result.current.createContact(newContact as unknown as Parameters<typeof result.current.createContact>[0]);

    expect(externalData.insertExternalData).toHaveBeenCalledWith(
      'contacts',
      expect.objectContaining({
        first_name: 'John',
        hobbies: ['Reading', 'Hiking'],
        interests_array: ['AI', 'Tech'] // Mapped key
      })
    );
  });
});
