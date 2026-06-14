import React, { useState, useEffect } from 'react';
import { Keyboard, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useKeyboardShortcutsEnhanced, 
  shortcutCategoryLabels 
} from '@/hooks/useKeyboardShortcutsEnhanced';

export function KeyboardShortcutsDialogEnhanced() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { groupedShortcuts, formatShortcut } = useKeyboardShortcutsEnhanced({ enabled: false });

  useEffect(() => {
    const handleShowShortcuts = () => setIsOpen(true);
    window.addEventListener('show-keyboard-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('show-keyboard-shortcuts', handleShowShortcuts);
  }, []);

  const filteredShortcuts = React.useMemo(() => {
    const filtered: Partial<typeof groupedShortcuts> = {};
    Object.entries(groupedShortcuts).forEach(([category, shortcuts]) => {
      const matching = shortcuts.filter(s => 
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matching.length > 0) {
        filtered[category as keyof typeof groupedShortcuts] = matching;
      }
    });
    return filtered;
  }, [groupedShortcuts, searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="relative py-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atalhos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-6">
            {Object.entries(filteredShortcuts).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {shortcutCategoryLabels[category as keyof typeof shortcutCategoryLabels]}
                </h3>
                <div className="grid gap-1">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {formatShortcut(shortcut).map((key, i, arr) => (
                          <React.Fragment key={`${key}-${i}`}>
                            <kbd className="min-w-[24px] h-6 px-1.5 text-xs font-mono bg-muted border rounded">
                              {key}
                            </kbd>
                            {i < arr.length - 1 && <span className="text-xs">+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
          Pressione <kbd className="px-1 bg-muted rounded">⇧</kbd> + <kbd className="px-1 bg-muted rounded">?</kbd> para abrir
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ShortcutHint({ keys }: { keys: string[] }) {
  return (
    <span className="hidden md:inline-flex items-center gap-0.5">
      {keys.map((key, i) => (
        <React.Fragment key={key}>
          <kbd className="min-w-[18px] h-5 px-1 text-[10px] font-mono bg-muted/50 border rounded">
            {key}
          </kbd>
          {i < keys.length - 1 && <span className="text-[10px]">+</span>}
        </React.Fragment>
      ))}
    </span>
  );
}
