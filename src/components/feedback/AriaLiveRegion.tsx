import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type AriaLiveMode = 'polite' | 'assertive' | 'off';

interface AriaLiveContextValue {
  announce: (message: string, mode?: AriaLiveMode) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
}

const AriaLiveContext = createContext<AriaLiveContextValue | null>(null);

/**
 * Hook to access the aria-live announcement functions
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAriaLiveRegion() {
  const context = useContext(AriaLiveContext);
  if (!context) {
    throw new Error('useAriaLiveRegion must be used within an AriaLiveProvider');
  }
  return context;
}

interface AriaLiveProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages ARIA live region announcements
 */
export function AriaLiveProvider({ children }: AriaLiveProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, mode: AriaLiveMode = 'polite') => {
    if (mode === 'off') return;
    
    // Clear first to ensure re-announcement of same message
    if (mode === 'polite') {
      setPoliteMessage('');
      // Use setTimeout to ensure the DOM updates before setting new message
      setTimeout(() => setPoliteMessage(message), 50);
    } else {
      setAssertiveMessage('');
      setTimeout(() => setAssertiveMessage(message), 50);
    }
  }, []);

  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  return (
    <AriaLiveContext.Provider value={{ announce, announcePolite, announceAssertive }}>
      {children}
      
      {/* Polite live region - for non-urgent updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      
      {/* Assertive live region - for urgent updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AriaLiveContext.Provider>
  );
}

/**
 * Pre-defined announcement messages for common actions
 */
// eslint-disable-next-line react-refresh/only-export-components
export const liveAnnouncements = {
  // CRUD Operations
  saving: 'Salvando...',
  saved: (name?: string) => `${name || 'Item'} salvo com sucesso`,
  deleting: 'Excluindo...',
  deleted: (name?: string) => `${name || 'Item'} excluído`,
  creating: 'Criando...',
  created: (name?: string) => `${name || 'Item'} criado`,
  updating: 'Atualizando...',
  updated: (name?: string) => `${name || 'Item'} atualizado`,

  // Forms
  formSubmitting: 'Enviando formulário...',
  formSuccess: 'Formulário enviado com sucesso',
  formError: (error?: string) => error || 'Erro ao enviar formulário',
  validationError: (field: string) => `Erro de validação no campo ${field}`,
  
  // Loading
  loading: (context?: string) => context ? `Carregando ${context}...` : 'Carregando...',
  loaded: (context?: string) => context ? `${context} carregado` : 'Carregado',
  
  // Search
  searching: 'Pesquisando...',
  searchResults: (count: number, term?: string) => {
    const termSuffix = term ? ` para "${term}"` : '';
    if (count === 0) return `Nenhum resultado encontrado${termSuffix}`;
    if (count === 1) return `1 resultado encontrado${termSuffix}`;
    return `${count} resultados encontrados${termSuffix}`;
  },
  
  // Navigation
  navigatedTo: (page: string) => `Navegou para ${page}`,
  pageLoaded: (page: string) => `Página ${page} carregada`,
  modalOpened: (name?: string) => `${name || 'Modal'} aberto`,
  modalClosed: (name?: string) => `${name || 'Modal'} fechado`,
  
  // Selection
  selected: (item: string) => `${item} selecionado`,
  deselected: (item: string) => `${item} desmarcado`,
  allSelected: (count: number) => `${count} itens selecionados`,
  selectionCleared: 'Seleção limpa',
  
  // Filters
  filterApplied: (filter: string) => `Filtro ${filter} aplicado`,
  filterRemoved: (filter: string) => `Filtro ${filter} removido`,
  filtersCleared: 'Todos os filtros removidos',
  sortedBy: (field: string, direction: 'asc' | 'desc') => 
    `Ordenado por ${field} em ordem ${direction === 'asc' ? 'crescente' : 'decrescente'}`,
    
  // Status
  online: 'Conexão restaurada',
  offline: 'Você está offline',
  syncing: 'Sincronizando...',
  synced: 'Dados sincronizados',
  
  // Notifications
  newNotification: (count: number) => 
    count === 1 ? '1 nova notificação' : `${count} novas notificações`,
    
  // Errors
  error: (message: string) => `Erro: ${message}`,
  networkError: 'Erro de conexão. Verifique sua internet.',
  
  // Generic
  actionCompleted: (action: string) => `${action} concluído`,
  actionFailed: (action: string) => `Falha ao ${action}`,
};

export default AriaLiveProvider;
