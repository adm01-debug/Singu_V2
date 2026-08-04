import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/empresas': 'Empresas',
  '/contatos': 'Contatos',
  '/interacoes': 'Interações',
  '/insights': 'Insights',
  '/calendario': 'Calendário',
  '/configuracoes': 'Configurações',
  '/notificacoes': 'Notificações',
  '/analytics': 'Analytics',
  '/network': 'Rede de Relacionamentos',
  '/auth': 'Autenticação',
};

/**
 * Announces route changes to screen readers via aria-live region.
 * Renders a visually hidden live region that updates on navigation.
 */
export function RouteAnnouncer() {
  const location = useLocation();
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = location.pathname;
    const title = routeTitles[path] || 
      path.replace(/^\//, '').replace(/\//g, ' > ').replace(/-/g, ' ');
    
    if (announcerRef.current) {
      announcerRef.current.textContent = `Navegou para ${title}`;
    }
  }, [location.pathname]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
