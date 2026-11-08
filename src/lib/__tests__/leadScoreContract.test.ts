import { describe, expect, it, vi } from 'vitest';
import { displayLeadGrade, storedLeadGrade, scorePayloads, persistLeadScores } from '../../../supabase/functions/_shared/lead-score-contract';

const input = {
  userId: 'dono', contactId: 'contato', dimensions: { fit: 95.2, engagement: 89.8, intent: 50, relationship: 41 },
  total: 68.5, grade: 'B', previousScore: 20, timestamp: '2026-10-11T20:00:00Z', signalsCount: 2, interactionsCount: 3,
};

describe('persistência canônica da pontuação de leads', () => {
  it.each([['A', 'on_fire'], ['B', 'hot'], ['C', 'warm'], ['D', 'cold']])('traduz %s e preserva leitura de %s', (display, stored) => {
    expect(storedLeadGrade(display)).toBe(stored);
    expect(displayLeadGrade(stored)).toBe(display);
    expect(displayLeadGrade(display)).toBe(display);
  });

  it('persiste inteiros, timestamps e factors sem aliases inexistentes', () => {
    const { score, history } = scorePayloads(input);
    expect(score).toMatchObject({ grade: 'hot', total_score: 69, previous_score: 20, fit_score: 95, engagement_score: 90 });
    expect(score).not.toHaveProperty('score_change');
    expect(score.calculated_at).toBe(input.timestamp);
    expect(score.last_calculated_at).toBe(input.timestamp);
    expect(score).not.toHaveProperty('computed_at');
    expect(score).not.toHaveProperty('decay_applied_at');
    expect(history).toMatchObject({ user_id: input.userId, contact_id: input.contactId, company_id: null, recorded_at: input.timestamp });
    expect(history).not.toHaveProperty('breakdown');
    expect(history.factors).toEqual({ dimensions: input.dimensions, signals_count: 2, interactions_count: 3 });
  });

  it('rejeita categoria e pontuação inválidas antes de gravar', () => {
    expect(() => scorePayloads({ ...input, grade: 'desconhecida' })).toThrow('Categoria');
    expect(() => scorePayloads({ ...input, total: Number.NaN })).toThrow('Pontuação');
  });

  it('propaga falha da transação de score, histórico ou fila e permite nova tentativa', async () => {
    const rows = scorePayloads(input);
    const rpc = vi.fn().mockResolvedValueOnce({ error: { message: 'Histórico recusado' } }).mockResolvedValueOnce({ error: null });
    const payload = { _user_id: input.userId, _scores: [rows.score], _history: [rows.history], _queue_ids: ['fila'] };
    await expect(persistLeadScores({ rpc }, payload)).rejects.toThrow('Histórico recusado');
    await expect(persistLeadScores({ rpc }, payload)).resolves.toBeUndefined();
    expect(rpc).toHaveBeenNthCalledWith(1, 'persist_lead_score_results', payload);
    expect(rpc).toHaveBeenNthCalledWith(2, 'persist_lead_score_results', payload);
  });
});
