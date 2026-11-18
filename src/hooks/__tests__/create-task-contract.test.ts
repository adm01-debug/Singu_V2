import { describe, expect, it } from 'vitest';
import { montarArgsCriarTarefa } from '../useTasks';

/**
 * Contrato com a RPC de produção:
 * create_task(p_title text, p_due_date date, p_company_id uuid, p_task_type text,
 *             p_priority text, p_description text, p_contact_id uuid,
 *             p_deal_id uuid, p_user_id uuid)
 * Só p_title e p_due_date não têm valor padrão.
 */
const ARGS_DA_RPC = new Set([
  'p_title', 'p_due_date', 'p_company_id', 'p_task_type',
  'p_priority', 'p_description', 'p_contact_id', 'p_deal_id', 'p_user_id',
]);

describe('montarArgsCriarTarefa', () => {
  it('usa apenas nomes de argumento que a RPC aceita', () => {
    const args = montarArgsCriarTarefa({
      title: 'Ligar para o cliente',
      description: 'Retomar a proposta',
      priority: 'high',
      due_date: '2026-12-01T10:00:00.000Z',
      task_type: 'call',
      company_id: '11111111-1111-1111-1111-111111111111',
      contact_id: '22222222-2222-2222-2222-222222222222',
    });
    for (const chave of Object.keys(args)) {
      expect(ARGS_DA_RPC.has(chave), `argumento inesperado: ${chave}`).toBe(true);
    }
  });

  it('sempre envia os dois argumentos sem valor padrão', () => {
    const args = montarArgsCriarTarefa({ title: 'Follow-up' });
    expect(args.p_title).toBe('Follow-up');
    expect(args.p_due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('descarta campos do Task que a RPC não recebe', () => {
    const args = montarArgsCriarTarefa({
      title: 'Tarefa',
      status: 'pending',
      nba_id: 'abc',
      script_context: 'texto',
    });
    expect(args).not.toHaveProperty('status');
    expect(args).not.toHaveProperty('nba_id');
    expect(args).not.toHaveProperty('script_context');
  });

  it('aplica os padrões do domínio quando o chamador omite', () => {
    const args = montarArgsCriarTarefa({ title: 'Tarefa' });
    expect(args.p_task_type).toBe('todo');
    expect(args.p_priority).toBe('medium');
    expect(args.p_company_id).toBeNull();
    expect(args.p_contact_id).toBeNull();
  });

  it('recusa título vazio e data inválida', () => {
    expect(() => montarArgsCriarTarefa({ title: '   ' })).toThrow(/obrigatório/);
    expect(() => montarArgsCriarTarefa({ title: 'x', due_date: 'não é data' })).toThrow(/inválida/);
  });
});
