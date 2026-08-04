import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { Network, User, GitCompare, MessageSquare, Trash2, Download, HelpCircle, ExternalLink } from 'lucide-react';

interface IntelCommandPaletteProps {
  onChangeTab: (tab: string) => void;
  onClearAsk: () => void;
  onExportAsk: () => void;
  onHelp: () => void;
}

/**
 * Command palette do Intelligence Hub (Ctrl/⌘+P).
 * Permite saltar entre tabs, abrir entidade por ID e disparar comandos do Ask.
 */
export const IntelCommandPalette = ({
  onChangeTab,
  onClearAsk,
  onExportAsk,
  onHelp,
}: IntelCommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const goTab = (t: string) => {
    onChangeTab(t);
    close();
  };

  // Detecta UUID-like na query para sugerir abrir entidade
  const uuidLike = /^[0-9a-f-]{6,}$/i.test(query.trim());

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Saltar para… ou cole um ID de entidade"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => goTab('graph')}>
            <Network className="mr-2 h-4 w-4" /> Ir para Graph
            <CommandShortcut>G</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTab('entity')}>
            <User className="mr-2 h-4 w-4" /> Ir para Entity 360
            <CommandShortcut>E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTab('crossref')}>
            <GitCompare className="mr-2 h-4 w-4" /> Ir para Cross-Ref
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTab('ask')}>
            <MessageSquare className="mr-2 h-4 w-4" /> Ir para Ask
            <CommandShortcut>A</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {uuidLike && (
          <CommandGroup heading="Entidade">
            <CommandItem
              onSelect={() => {
                navigate(`/contatos/${query.trim()}`);
                close();
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Abrir contato {query.trim().slice(0, 8)}…
            </CommandItem>
            <CommandItem
              onSelect={() => {
                navigate(`/empresas/${query.trim()}`);
                close();
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Abrir empresa {query.trim().slice(0, 8)}…
            </CommandItem>
          </CommandGroup>
        )}

        <CommandGroup heading="Ações do Ask">
          <CommandItem
            onSelect={() => {
              onClearAsk();
              close();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> /clear · Limpar console
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onExportAsk();
              close();
            }}
          >
            <Download className="mr-2 h-4 w-4" /> /export · Exportar última tabela
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onHelp();
              close();
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4" /> /help · Listar comandos
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
