const ROUTE_LABELS: Record<string, string> = {
  '': 'início',
  contatos: 'Contatos',
  empresas: 'Empresas',
  interacoes: 'Interações',
  analytics: 'Analytics',
  insights: 'Insights',
  calendario: 'Calendário',
  notificacoes: 'Notificações',
  network: 'Network',
  automacoes: 'Automações',
  configuracoes: 'Configurações',
  relatorio: 'Relatório',
  admin: 'Admin',
  playbooks: 'Playbooks',
  intent: 'Intenção de compra',
  'lead-scoring': 'Pontuação de leads',
  'deal-rooms': 'Salas de negociação',
  'customer-success': 'Sucesso do cliente',
};

export function getReadableLabel(path: string | null): string {
  if (!path) return 'início';
  const segment = path.split(/[?#]/)[0].replace(/^\//, '').split('/')[0] || '';
  return ROUTE_LABELS[segment] || segment || 'início';
}

export function getSectionFallback(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 1 && Object.keys(ROUTE_LABELS).includes(segments[0])
    ? `/${segments[0]}` : '/';
}
