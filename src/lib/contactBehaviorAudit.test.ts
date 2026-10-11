import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchContactBehaviorAudit } from './contactBehaviorAudit';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), then: response.then.bind(response) };
  for (const method of [query.select, query.eq, query.order, query.limit]) method.mockReturnValue(query);
  return query;
}

beforeEach(() => vi.resetAllMocks());

describe('Histórico comportamental canônico', () => {
  it('preserva análises e validações humanas junto das alterações em ordem cronológica', async () => {
    const changes = queryResult([{ id: 'alteracao', created_at: '2026-10-01T12:00:00Z', change_source: 'manual', field_name: 'disc', old_value: 'D', new_value: 'I', reason: 'Correção' }]);
    const vak = queryResult([{ id: 'analise-vak', analyzed_at: '2026-10-02T12:00:00Z', created_at: '2026-10-01T12:00:00Z', analysis_source: 'interaction', primary_modality: 'visual', analyzed_text: 'Quero ver a proposta', profile_summary: 'Visual', is_validated: true, user_feedback: 'Confirmado' }]);
    const metaprograms = queryResult([{ id: 'analise-meta', created_at: '2026-10-03T12:00:00Z', analyzed_text: 'Quero alcançar o objetivo', is_validated: false, user_feedback: null }]);
    mocks.from.mockImplementation(table => table === 'crm_relationship_audit_logs' ? changes : table === 'vak_analysis_history' ? vak : metaprograms);

    const result = await fetchContactBehaviorAudit('contato-1', 'usuario-1');
    expect(result.map(row => row.id)).toEqual(['analise-meta', 'analise-vak', 'alteracao']);
    expect(result[0]).toMatchObject({ analysis_type: 'metaprogram', is_validated: false, analyzed_text: 'Quero alcançar o objetivo' });
    expect(result[1]).toMatchObject({ analysis_type: 'vak', is_validated: true, user_feedback: 'Confirmado', new_value: 'visual' });
    expect(result[2]).toMatchObject({ old_value: 'D', new_value: 'I', reason: 'Correção' });
    for (const query of [changes, vak, metaprograms]) {
      expect(query.eq).toHaveBeenCalledWith('contact_id', 'contato-1');
      expect(query.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
    }
  });

  it.each(['crm_relationship_audit_logs', 'vak_analysis_history', 'metaprogram_analysis'])('expõe a falha de %s sem apresentar histórico parcial como completo', async table => {
    const failure = new Error('Sem acesso ao histórico');
    mocks.from.mockImplementation(name => queryResult([], name === table ? failure : null));
    await expect(fetchContactBehaviorAudit('contato-1', 'usuario-1')).rejects.toBe(failure);
  });
});
