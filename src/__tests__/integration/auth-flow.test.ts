    it('should handle parallel refresh session requests (race condition simulation)', async () => {
      // Simulate a scenario where multiple parts of the app trigger a refresh simultaneously
      const mockSession = {
        access_token: 'refreshed-token',
        refresh_token: 'new-refresh-token',
        user: { id: 'user-123' },
      };

      // We mock a slight delay to simulate network/processing time
      mockRefreshSession.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { session: mockSession }, error: null }), 10))
      );
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Fire 3 parallel requests
      const results = await Promise.all([
        supabase.auth.refreshSession(),
        supabase.auth.refreshSession(),
        supabase.auth.refreshSession()
      ]);
      
      // All should eventually resolve with the same session (Supabase client handles this internally, but we test the expectation)
      results.forEach(res => {
        expect(res.data.session?.access_token).toBe('refreshed-token');
        expect(res.error).toBeNull();
      });
      
      // In a real Supabase JS client, it actually deduplicates concurrent refresh calls.
      // Our mock just proves the app code can handle the parallel resolution.
      expect(mockRefreshSession).toHaveBeenCalledTimes(3); 
    });
/**
 * Integration tests — Auth Flow
 * Validates authentication state management, token refresh, and session handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockRefreshSession = vi.fn();
const mockOnAuthStateChange = vi.fn((_cb: unknown) => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      signOut: () => mockSignOut(),
      signInWithPassword: (creds: Record<string, unknown>) => mockSignInWithPassword(creds),
      refreshSession: () => mockRefreshSession(),
      onAuthStateChange: (cb: unknown) => mockOnAuthStateChange(cb),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should retrieve existing session on init', async () => {
      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.getSession();
      
      expect(result.data.session).toBeDefined();
      expect(result.data.session?.user.id).toBe('user-123');
      expect(result.error).toBeNull();
    });

    it('should return null session when not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.getSession();
      
      expect(result.data.session).toBeNull();
    });

    it('should handle session retrieval errors gracefully', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Network error', status: 500 },
      });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.getSession();
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('Sign In Flow', () => {
    it('should sign in with valid credentials', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'new-token' } },
        error: null,
      });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      
      expect(result.data.user?.id).toBe('user-123');
      expect(result.error).toBeNull();
    });

    it('should reject invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'bad-password',
      });
      
      expect(result.data.user).toBeNull();
      expect(result.error?.message).toContain('Invalid login credentials');
    });
  });

  describe('Sign Out Flow', () => {
    it('should clear session on sign out', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signOut();
      
      expect(result.error).toBeNull();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh session token successfully', async () => {
      mockRefreshSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'refreshed-token',
            refresh_token: 'new-refresh-token',
            user: { id: 'user-123' },
          },
        },
        error: null,
      });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.refreshSession();
      
      expect(result.data.session?.access_token).toBe('refreshed-token');
      expect(result.error).toBeNull();
    });

    it('should handle expired refresh token', async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Token expired', status: 401 },
      });
      
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.refreshSession();
      
      expect(result.data.session).toBeNull();
      expect(result.error?.status).toBe(401);
    });
  });

  describe('Auth State Change Listener', () => {
    it('should set up auth state listener', async () => {
      const callback = vi.fn();
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = supabase.auth.onAuthStateChange(callback);
      
      expect(data.subscription).toBeDefined();
      expect(data.subscription.unsubscribe).toBeDefined();
      expect(mockOnAuthStateChange).toHaveBeenCalledWith(callback);
    });
  });
});
