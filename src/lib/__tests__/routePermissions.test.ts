import { describe, it, expect } from 'vitest';
import { canAccessRoute, ROUTE_PERMISSIONS } from '@/lib/routePermissions';

const comPermissao = (permitidas: string[]) => (p: string) => permitidas.includes(p);

describe('canAccessRoute', () => {
  it('libera rota fora do mapa de permissoes', () => {
    expect(canAccessRoute('/contatos', comPermissao([]), ['vendedor'], false)).toBe(true);
  });

  it('libera quando o usuario nao tem papel (fail-open)', () => {
    expect(canAccessRoute('/configuracoes', comPermissao([]), [], false)).toBe(true);
  });

  it('libera enquanto o RBAC carrega', () => {
    expect(canAccessRoute('/configuracoes', comPermissao([]), ['vendedor'], true)).toBe(true);
  });

  it('bloqueia rota gateada sem a permissao exigida', () => {
    expect(canAccessRoute('/configuracoes', comPermissao(['view_analytics']), ['vendedor'], false)).toBe(false);
  });

  it('libera rota gateada com a permissao exigida', () => {
    expect(canAccessRoute('/configuracoes', comPermissao(['view_settings']), ['vendedor'], false)).toBe(true);
  });

  it('todas as chaves do mapa sao rotas absolutas', () => {
    for (const rota of Object.keys(ROUTE_PERMISSIONS)) expect(rota.startsWith('/')).toBe(true);
  });
});
