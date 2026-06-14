import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, setRequestId, setLogUser, generateRequestId } from '@/lib/logger';
import { supabase } from "@/integrations/supabase/client";

// Mocking Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null })
    }))
  }
}));

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRequestId('');
    setLogUser(null);
  });

  it('deve gerar IDs de requisição únicos', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).toMatch(/^req_/);
    expect(id1).not.toBe(id2);
  });

  it('deve formatar logs corretamente em desenvolvimento', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    setRequestId('test-rid');
    
    logger.info('Test message');
    
    expect(consoleSpy).toHaveBeenCalled();
    const callArgs = consoleSpy.mock.calls[0][0];
    expect(callArgs).toContain('[INFO]');
    expect(callArgs).toContain('[test-rid]');
    
    consoleSpy.mockRestore();
  });

  it('deve persistir erros no banco de dados', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn(() => ({ insert: mockInsert }));
    (supabase.from as any).mockImplementation(mockFrom);
    
    setLogUser('user-123');
    setRequestId('req-123');
    
    const testError = new Error('Database connection failed');
    logger.error('Erro crítico no banco', testError, { db: 'main' });
    
    // Aguarda processamento assíncrono do logger (fire-and-forget)
    // Usamos um pequeno timeout para dar tempo ao persistError
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(mockFrom).toHaveBeenCalledWith('error_logs');
    expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
      message: 'Erro crítico no banco',
      severity: 'error',
      user_id: 'user-123',
      stack: testError.stack
    })]);
  });

  it('deve agrupar logs quando solicitado', () => {
    const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const endSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    
    logger.group('Subprocesso A');
    logger.groupEnd();
    
    expect(groupSpy).toHaveBeenCalledWith('Subprocesso A');
    expect(endSpy).toHaveBeenCalled();
    
    groupSpy.mockRestore();
    endSpy.mockRestore();
  });
});
