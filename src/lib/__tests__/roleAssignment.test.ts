import { describe, it, expect } from 'vitest';
import {
  APP_ROLES,
  canRemoveRole,
  describeRoleError,
  hasPermissionsMapped,
  isAppRole,
  rolesOfUser,
  usersWithoutRole,
} from '@/lib/roleAssignment';

describe('isAppRole', () => {
  it('aceita os cinco papeis do enum app_role', () => {
    for (const papel of APP_ROLES) expect(isAppRole(papel)).toBe(true);
  });

  it('rejeita papel fora do enum', () => {
    expect(isAppRole('superuser')).toBe(false);
    expect(isAppRole('')).toBe(false);
  });
});

describe('hasPermissionsMapped', () => {
  it('moderator e user nao tem permissao mapeada', () => {
    expect(hasPermissionsMapped('moderator')).toBe(false);
    expect(hasPermissionsMapped('user')).toBe(false);
  });

  it('admin, manager e salesperson tem permissao mapeada', () => {
    expect(hasPermissionsMapped('admin')).toBe(true);
    expect(hasPermissionsMapped('manager')).toBe(true);
    expect(hasPermissionsMapped('salesperson')).toBe(true);
  });
});

describe('rolesOfUser', () => {
  const atribuicoes = [
    { id: '1', user_id: 'u1', role: 'salesperson' },
    { id: '2', user_id: 'u1', role: 'admin' },
    { id: '3', user_id: 'u2', role: 'manager' },
    { id: '4', user_id: 'u2', role: 'legado' },
  ];

  it('devolve so os papeis do usuario, na ordem do enum', () => {
    expect(rolesOfUser(atribuicoes, 'u1')).toEqual(['admin', 'salesperson']);
  });

  it('ignora papel fora do enum', () => {
    expect(rolesOfUser(atribuicoes, 'u2')).toEqual(['manager']);
  });

  it('devolve lista vazia para usuario sem papel', () => {
    expect(rolesOfUser(atribuicoes, 'u3')).toEqual([]);
  });
});

describe('usersWithoutRole', () => {
  it('lista apenas perfis sem nenhuma atribuicao', () => {
    const perfis = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];
    const atribuicoes = [{ id: '1', user_id: 'u2', role: 'manager' }];
    expect(usersWithoutRole(perfis, atribuicoes)).toEqual(['u1', 'u3']);
  });
});

describe('canRemoveRole', () => {
  it('bloqueia o admin de remover o proprio admin', () => {
    expect(canRemoveRole('u1', 'u1', 'admin')).toBe(false);
  });

  it('libera remover outro papel de si mesmo', () => {
    expect(canRemoveRole('u1', 'u1', 'salesperson')).toBe(true);
  });

  it('libera remover admin de outro usuario', () => {
    expect(canRemoveRole('u1', 'u2', 'admin')).toBe(true);
  });
});

describe('describeRoleError', () => {
  it('traduz duplicidade, perfil sem conta e falta de permissao', () => {
    expect(describeRoleError({ code: '23505' })).toContain('já tem esse papel');
    expect(describeRoleError({ code: '23503' })).toContain('conta de login');
    expect(describeRoleError({ code: '42501' })).toContain('apenas administradores');
  });

  it('usa a mensagem do erro quando o codigo e desconhecido', () => {
    expect(describeRoleError({ code: 'XX000', message: 'boom' })).toBe('Falha ao salvar: boom');
    expect(describeRoleError(null)).toBe('Falha ao salvar o papel.');
  });
});