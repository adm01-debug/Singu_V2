import { describe, expect, it } from 'vitest';
import { parseQueryOrder } from '../../supabase/functions/_shared/tenant-guard';

describe('Ordenação de páginas pelo proxy externo', () => {
  it('preserva a ordenação legada e sua direção padrão', () => {
    expect(parseQueryOrder({ column: 'created_at' })).toEqual([{ column: 'created_at', ascending: false }]);
    expect(parseQueryOrder({ column: 'nome_crm', ascending: true })).toEqual([{ column: 'nome_crm', ascending: true }]);
  });

  it('preserva o desempate por ID na ordem recebida', () => {
    const order = [{ column: 'created_at', ascending: false }, { column: 'id', ascending: false }];
    expect(parseQueryOrder(order)).toEqual(order);
  });

  it('aceita consultas sem ordenação', () => {
    expect(parseQueryOrder(undefined)).toEqual([]);
    expect(parseQueryOrder(null)).toEqual([]);
  });

  it.each([
    { column: 'created_at),user_id.neq.outro' },
    [{ column: 'created_at' }, { column: 'profile->>email' }],
    [{ column: 'id' }, null],
    { ascending: true },
    'created_at',
    { column: 1 },
    Array.from({ length: 11 }, () => ({ column: 'id' })),
  ])('rejeita a ordenação inteira se algum critério for inválido: %j', order => {
    expect(parseQueryOrder(order)).toBeNull();
  });
});
