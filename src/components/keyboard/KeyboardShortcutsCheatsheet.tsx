import { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Search, X, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['Ctrl', 'K'], description: 'Abrir busca global', category: 'Navegação' },
  { keys: ['Alt', '1'], description: 'Ir para Dashboard', category: 'Navegação' },
  { keys: ['Alt', '2'], description: 'Ir para Empresas', category: 'Navegação' },
  { keys: ['Alt', '3'], description: 'Ir para Contatos', category: 'Navegação' },
  { keys: ['Alt', '4'], description: 'Ir para Interações', category: 'Navegação' },
  { keys: ['Alt', '5'], description: 'Ir para Calendário', category: 'Navegação' },
  { keys: ['Alt', '6'], description: 'Ir para Insights', category: 'Navegação' },
  { keys: ['G', 'H'], description: 'Ir para Home', category: 'Navegação' },
  { keys: ['Esc'], description: 'Fechar modal/diálogo', category: 'Navegação' },
  
  // Quick Actions
  { keys: ['Alt', 'C'], description: 'Novo Contato', category: 'Ações Rápidas' },
  { keys: ['Alt', 'E'], description: 'Nova Empresa', category: 'Ações Rápidas' },
  { keys: ['Alt', 'I'], description: 'Nova Interação', category: 'Ações Rápidas' },
  { keys: ['Alt', 'N'], description: 'Abrir Notificações', category: 'Ações Rápidas' },
  
  // Lists & Selection
  { keys: ['↑', '↓'], description: 'Navegar na lista', category: 'Listas' },
  { keys: ['Enter'], description: 'Abrir item selecionado', category: 'Listas' },
  { keys: ['Space'], description: 'Selecionar/desmarcar item', category: 'Listas' },
  { keys: ['Ctrl', 'A'], description: 'Selecionar todos', category: 'Listas' },
  { keys: ['Esc'], description: 'Limpar seleção', category: 'Listas' },
  
  // Forms
  { keys: ['Tab'], description: 'Próximo campo', category: 'Formulários' },
  { keys: ['Shift', 'Tab'], description: 'Campo anterior', category: 'Formulários' },
  { keys: ['Ctrl', 'Enter'], description: 'Submeter formulário', category: 'Formulários' },
  { keys: ['Ctrl', 'S'], description: 'Salvar', category: 'Formulários' },
  
  // View
  { keys: ['Ctrl', 'B'], description: 'Toggle sidebar', category: 'Visualização' },
  { keys: ['Ctrl', 'D'], description: 'Toggle dark mode', category: 'Visualização' },
  { keys: ['?'], description: 'Mostrar atalhos', category: 'Visualização' },
];

interface KeyboardShortcutsCheatsheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const KeyboardShortcutsCheatsheet = forwardRef<HTMLDivElement, KeyboardShortcutsCheatsheetProps>(function KeyboardShortcutsCheatsheet({ 
  open: controlledOpen, 
  onOpenChange 
}, _ref) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Listen for ? key to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  // Filter shortcuts based on search
  const filteredShortcuts = shortcuts.filter(shortcut => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      shortcut.description.toLowerCase().includes(search) ||
      shortcut.category.toLowerCase().includes(search) ||
      shortcut.keys.some(k => k.toLowerCase().includes(search))
    );
  });

  // Group shortcuts by category
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const formatKey = (key: string) => {
    if (isMac) {
      return key
        .replace('Ctrl', '⌘')
        .replace('Alt', '⌥')
        .replace('Shift', '⇧')
        .replace('Enter', '↵')
        .replace('Esc', '⎋')
        .replace('Space', '␣');
    }
    return key;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atalhos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                aria-label="Limpar pesquisa" onClick={() => setSearchTerm('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] px-4 pb-4">
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: categoryIndex * 0.05 }}
                className="mb-4"
              >
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Command className="w-3 h-3" />
                  {category}
                </h3>
                <div className="space-y-1">
                  {categoryShortcuts.map((shortcut, index) => (
                    <motion.div
                      key={`${category}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            {keyIndex > 0 && (
                              <span className="text-xs text-muted-foreground">+</span>
                            )}
                            <kbd className={cn(
                              "min-w-[24px] h-6 px-1.5 rounded flex items-center justify-center",
                              "bg-muted border border-border text-xs font-mono",
                              "shadow-sm"
                            )}>
                              {formatKey(key)}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredShortcuts.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Keyboard className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum atalho encontrado</p>
              <p className="text-xs mt-1">Tente outra busca</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-xs text-center text-muted-foreground">
            Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">?</kbd> a qualquer momento para ver esta lista
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

/**
 * Floating button to open keyboard shortcuts
 */
export function KeyboardShortcutsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Keyboard className="w-4 h-4" />
        <span className="hidden md:inline">Atalhos</span>
        <Badge variant="secondary" className="text-xs h-4 px-1.5 hidden md:flex">?</Badge>
      </Button>
      <KeyboardShortcutsCheatsheet open={open} onOpenChange={setOpen} />
    </>
  );
}

export default KeyboardShortcutsCheatsheet;
