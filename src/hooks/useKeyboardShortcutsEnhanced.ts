import { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================
// ENHANCED KEYBOARD SHORTCUTS - Pilar 5 & 7
// ============================================

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: ShortcutCategory;
  global?: boolean; // Works even in inputs
  sequence?: string[]; // For multi-key shortcuts like "gg"
}

type ShortcutCategory = 
  | 'navigation' 
  | 'actions' 
  | 'ui' 
  | 'editing' 
  | 'search'
  | 'filters'
  | 'sorting';

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onShortcutTriggered?: (shortcut: ShortcutConfig) => void;
}

export function useKeyboardShortcutsEnhanced(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, onShortcutTriggered } = options;
  const navigate = useNavigate();
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Clear sequence after timeout
  useEffect(() => {
    if (keySequence.length > 0) {
      const timer = setTimeout(() => setKeySequence([]), 500);
      return () => clearTimeout(timer);
    }
  }, [keySequence]);

  const shortcuts = useMemo<ShortcutConfig[]>(() => [
    // Navigation shortcuts
    { 
      key: 'k', 
      ctrl: true, 
      action: () => window.dispatchEvent(new CustomEvent('toggle-global-search')),
      description: 'Abrir busca global',
      category: 'search',
      global: true
    },
    { 
      key: '/', 
      action: () => window.dispatchEvent(new CustomEvent('focus-search-input')),
      description: 'Focar na busca',
      category: 'search'
    },
    
    // Go to pages (Alt + letter)
    { key: 'h', alt: true, action: () => navigate('/'), description: 'Dashboard', category: 'navigation' },
    { key: 'c', alt: true, action: () => navigate('/contatos'), description: 'Contatos', category: 'navigation' },
    { key: 'e', alt: true, action: () => navigate('/empresas'), description: 'Empresas', category: 'navigation' },
    { key: 'i', alt: true, action: () => navigate('/interacoes'), description: 'Interações', category: 'navigation' },
    { key: 's', alt: true, action: () => navigate('/insights'), description: 'Insights', category: 'navigation' },
    { key: 'l', alt: true, action: () => navigate('/calendario'), description: 'Calendário', category: 'navigation' },
    { key: 'n', alt: true, action: () => navigate('/network'), description: 'Network', category: 'navigation' },
    { key: 'a', alt: true, action: () => navigate('/analytics'), description: 'Analytics', category: 'navigation' },
    { key: ',', alt: true, action: () => navigate('/configuracoes'), description: 'Configurações', category: 'navigation' },
     { 
       key: 'ArrowLeft', 
       alt: true, 
       action: () => window.dispatchEvent(new CustomEvent('navigate-back')),
       description: 'Voltar',
       category: 'navigation',
       global: true
     },
     { 
       key: 'Backspace', 
       action: () => window.dispatchEvent(new CustomEvent('navigate-back')),
       description: 'Voltar (Backspace)',
       category: 'navigation',
       global: false // Don't trigger in inputs
     },

    // Quick actions (Ctrl/Cmd + letter)
    { 
      key: 'n', 
      ctrl: true, 
      action: () => window.dispatchEvent(new CustomEvent('quick-add-contact')),
      description: 'Novo contato',
      category: 'actions'
    },
    { 
      key: 'j', 
      ctrl: true, 
      action: () => window.dispatchEvent(new CustomEvent('quick-add-interaction')),
      description: 'Nova interação',
      category: 'actions'
    },
    { 
      key: 'b', 
      ctrl: true, 
      action: () => window.dispatchEvent(new CustomEvent('quick-add-company')),
      description: 'Nova empresa',
      category: 'actions'
    },
    { 
      key: 's', 
      ctrl: true, 
      action: () => window.dispatchEvent(new CustomEvent('save-current')),
      description: 'Salvar',
      category: 'actions',
      global: true
    },

    // UI Controls
    { 
      key: '?', 
      shift: true, 
      action: () => window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts')),
      description: 'Mostrar atalhos',
      category: 'ui'
    },
    { 
      key: 'Escape', 
      action: () => window.dispatchEvent(new CustomEvent('close-all-modals')),
      description: 'Fechar modal',
      category: 'ui',
      global: true
    },
    { 
      key: '[', 
      ctrl: true, 
      action: () => window.dispatchEvent(new CustomEvent('toggle-sidebar')),
      description: 'Toggle sidebar',
      category: 'ui'
    },
    { 
      key: 'd', 
      ctrl: true, 
      shift: true, 
      action: () => window.dispatchEvent(new CustomEvent('toggle-dark-mode')),
      description: 'Alternar tema',
      category: 'ui'
    },

    // List navigation
    { 
      key: 'j', 
      action: () => window.dispatchEvent(new CustomEvent('navigate-list', { detail: 'next' })),
      description: 'Próximo item',
      category: 'navigation'
    },
    { 
      key: 'k', 
      action: () => window.dispatchEvent(new CustomEvent('navigate-list', { detail: 'prev' })),
      description: 'Item anterior',
      category: 'navigation'
    },
    { 
      key: 'Enter', 
      action: () => window.dispatchEvent(new CustomEvent('open-selected-item')),
      description: 'Abrir item',
      category: 'navigation'
    },

    // Quick edit (when item selected)
    { 
      key: 'e', 
      action: () => window.dispatchEvent(new CustomEvent('edit-selected-item')),
      description: 'Editar item',
      category: 'editing'
    },
    { 
      key: 'd', 
      action: () => window.dispatchEvent(new CustomEvent('delete-selected-item')),
      description: 'Excluir item',
      category: 'editing'
    },

    // Multi-select
    { 
      key: 'a', 
      ctrl: true, 
      action: () => window.dispatchEvent(new CustomEvent('select-all')),
      description: 'Selecionar tudo',
      category: 'editing',
      global: true
    },

    // Page refresh
    { 
      key: 'r', 
      ctrl: true, 
      shift: true, 
      action: () => window.location.reload(),
      description: 'Recarregar página',
      category: 'ui'
    },

    // Undo/Redo
    { 
      key: 'z', 
      ctrl: true, 
      action: () => window.dispatchEvent(new CustomEvent('undo')),
      description: 'Desfazer',
      category: 'editing',
      global: true
    },
    { 
      key: 'z', 
      ctrl: true, 
      shift: true, 
      action: () => window.dispatchEvent(new CustomEvent('redo')),
      description: 'Refazer',
      category: 'editing',
      global: true
    },

    // Channel filter shortcuts (handled inside CanaisQuickFilter — listed here for cheatsheet only)
    { key: '1', alt: true, action: () => {}, description: 'Alternar canal WhatsApp', category: 'filters', global: true },
    { key: '2', alt: true, action: () => {}, description: 'Alternar canal Ligação', category: 'filters', global: true },
    { key: '3', alt: true, action: () => {}, description: 'Alternar canal Email', category: 'filters', global: true },
    { key: '4', alt: true, action: () => {}, description: 'Alternar canal Reunião', category: 'filters', global: true },
    { key: '5', alt: true, action: () => {}, description: 'Alternar canal Vídeo', category: 'filters', global: true },
    { key: '6', alt: true, action: () => {}, description: 'Alternar canal Nota', category: 'filters', global: true },
    { key: '0', alt: true, action: () => {}, description: 'Limpar canais', category: 'filters', global: true },

    // Sort shortcuts (handled inside SortChips — listed here for cheatsheet only)
    { key: 'r', alt: true, action: () => {}, description: 'Ordenar: Mais recentes', category: 'sorting', global: true },
    { key: 'o', alt: true, action: () => {}, description: 'Ordenar: Mais antigas', category: 'sorting', global: true },
    { key: 'm', alt: true, action: () => {}, description: 'Ordenar: Melhor correspondência', category: 'sorting', global: true },
    { key: 'p', alt: true, action: () => {}, description: 'Ordenar: Por pessoa/empresa', category: 'sorting', global: true },
    { key: 'c', alt: true, action: () => {}, description: 'Ordenar: Por canal', category: 'sorting', global: true },
  ], [navigate]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    // Update key sequence
    const now = Date.now();
    if (now - lastKeyTime > 500) {
      setKeySequence([event.key]);
    } else {
      setKeySequence(prev => [...prev, event.key]);
    }
    setLastKeyTime(now);

    for (const shortcut of shortcuts) {
      // Skip non-global shortcuts when in input
      if (isInput && !shortcut.global) {
        // Allow Escape always
        if (shortcut.key !== 'Escape') continue;
      }

      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      // Handle modifier keys
      const ctrlMatch = shortcut.ctrl 
        ? (event.ctrlKey || event.metaKey) 
        : !(event.ctrlKey || event.metaKey);
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      // Special case: shift+? is actually shift+/
      if (shortcut.key === '?' && shortcut.shift) {
        if (event.key === '?' || (event.shiftKey && event.key === '/')) {
          event.preventDefault();
          shortcut.action();
          onShortcutTriggered?.(shortcut);
          return;
        }
        continue;
      }

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        onShortcutTriggered?.(shortcut);
        return;
      }
    }
  }, [enabled, shortcuts, lastKeyTime, onShortcutTriggered]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    return shortcuts.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {} as Record<ShortcutCategory, ShortcutConfig[]>);
  }, [shortcuts]);

  // Format shortcut keys for display
  const formatShortcut = useCallback((shortcut: ShortcutConfig): string[] => {
    const keys: string[] = [];
    if (shortcut.ctrl) keys.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    if (shortcut.alt) keys.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
    if (shortcut.shift) keys.push('⇧');
    keys.push(shortcut.key.toUpperCase());
    return keys;
  }, []);

  return {
    shortcuts,
    groupedShortcuts,
    formatShortcut,
    keySequence,
  };
}

// Hook for list navigation
export function useListNavigation<T>(items: T[], options?: {
  onSelect?: (item: T, index: number) => void;
  onOpen?: (item: T, index: number) => void;
  loop?: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { onSelect, onOpen, loop = true } = options || {};

  useEffect(() => {
    const handleNavigate = (e: CustomEvent<'next' | 'prev'>) => {
      const direction = e.detail;
      setSelectedIndex(prev => {
        let next: number;
        if (direction === 'next') {
          next = prev + 1;
          if (next >= items.length) next = loop ? 0 : items.length - 1;
        } else {
          next = prev - 1;
          if (next < 0) next = loop ? items.length - 1 : 0;
        }
        
        const item = items[next];
        if (item) onSelect?.(item, next);
        return next;
      });
    };

    const handleOpen = () => {
      const item = items[selectedIndex];
      if (item) onOpen?.(item, selectedIndex);
    };

    window.addEventListener('navigate-list', handleNavigate as EventListener);
    window.addEventListener('open-selected-item', handleOpen);

    return () => {
      window.removeEventListener('navigate-list', handleNavigate as EventListener);
      window.removeEventListener('open-selected-item', handleOpen);
    };
  }, [items, selectedIndex, onSelect, onOpen, loop]);

  return {
    selectedIndex,
    setSelectedIndex,
    selectedItem: items[selectedIndex],
  };
}

// Hook for vim-style navigation
export function useVimNavigation() {
  const [mode, setMode] = useState<'normal' | 'insert' | 'visual'>('normal');
  const [count, setCount] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (isInput) {
        setMode('insert');
        return;
      }

      // Number prefix for repeat count
      if (/^[1-9]$/.test(e.key) && mode === 'normal') {
        setCount(prev => prev * 10 + parseInt(e.key));
        return;
      }

      // Mode switching
      if (e.key === 'i' && mode === 'normal') {
        setMode('insert');
        return;
      }
      if (e.key === 'Escape') {
        setMode('normal');
        setCount(1);
        return;
      }
      if (e.key === 'v' && mode === 'normal') {
        setMode('visual');
        return;
      }

      // Execute command with count
      if (mode === 'normal') {
        // Repeat action 'count' times
        for (let i = 0; i < count; i++) {
          if (e.key === 'j') {
            window.dispatchEvent(new CustomEvent('navigate-list', { detail: 'next' }));
          } else if (e.key === 'k') {
            window.dispatchEvent(new CustomEvent('navigate-list', { detail: 'prev' }));
          }
        }
        setCount(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, count]);

  return { mode, count };
}

// Category labels for display
export const shortcutCategoryLabels: Record<ShortcutCategory, string> = {
  navigation: 'Navegação',
  actions: 'Ações Rápidas',
  ui: 'Interface',
  editing: 'Edição',
  search: 'Busca',
  filters: 'Filtros de canal',
  sorting: 'Ordenação',
};
