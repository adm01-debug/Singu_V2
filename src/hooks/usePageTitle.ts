import { useEffect } from 'react';

const APP_NAME = 'SINGU';

/**
 * Hook para definir o título da página dinamicamente.
 * Restaura o título original ao desmontar.
 * 
 * @example
 * usePageTitle('Contatos'); // → "Contatos | SINGU"
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    
    if (title) {
      document.title = `${title} | ${APP_NAME}`;
    } else {
      document.title = `${APP_NAME} - CRM Inteligente`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
