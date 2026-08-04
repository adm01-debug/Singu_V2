import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  Compass, Zap, Search, Sparkles, History,
  Plus, Sun, Moon, Maximize2, KeyboardIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMAND_ROUTES, pushRecent, readRecent, type CommandAction, type CommandRoute } from './commandRegistry';
import { useGlobalDensity } from '@/hooks/useGlobalDensity';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'navigate' | 'actions' | 'search' | 'ask';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Abre a busca federada legada (GlobalSearch). */
  onOpenLegacySearch?: () => void;
  /** Abre o chat IA "Ask CRM". */
  onOpenAsk?: () => void;
}

const MODE_META: Record<Mode, { label: string; icon: typeof Compass; hint: string }> = {
  navigate: { label: 'Navegar', icon: Compass, hint: 'Pular para qualquer página' },
  actions: { label: 'Ações', icon: Zap, hint: 'Executar comandos rápidos' },
  search: { label: 'Buscar', icon: Search, hint: 'Contatos, empresas, conversas' },
  ask: { label: 'Perguntar', icon: Sparkles, hint: 'Perguntar à IA do CRM' },
};

export function GlobalCommandBar({ open, onOpenChange, onOpenLegacySearch, onOpenAsk }: Props) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('navigate');
  const [query, setQuery] = useState('');
  const { toggle: toggleDensity, isCompact } = useGlobalDensity();
  const { user } = useAuth();

  const recentIds = useMemo(() => (open ? readRecent(user?.id) : []), [open, user?.id]);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery('');
  }, [onOpenChange]);

  const goto = useCallback(
    (route: CommandRoute) => {
      pushRecent(route.id, user?.id);
      navigate(route.url);
      close();
    },
    [navigate, close, user?.id],
  );

  const actions: CommandAction[] = useMemo(
    () => [
      {
        id: 'a-new-contact',
        label: 'Novo contato',
        icon: Plus,
        description: 'Abrir formulário de novo contato',
        run: () => {
          navigate('/contatos?new=1');
          close();
        },
      },
      {
        id: 'a-new-interaction',
        label: 'Nova interação',
        icon: Plus,
        description: 'Registrar nova conversa',
        run: () => {
          navigate('/interacoes?new=1');
          close();
        },
      },
      {
        id: 'a-new-company',
        label: 'Nova empresa',
        icon: Plus,
        description: 'Cadastrar empresa',
        run: () => {
          navigate('/empresas?new=1');
          close();
        },
      },
      {
        id: 'a-toggle-density',
        label: isCompact ? 'Densidade confortável' : 'Densidade compacta',
        icon: Maximize2,
        description: 'Alternar densidade global da UI',
        run: () => {
          toggleDensity();
          close();
        },
      },
      {
        id: 'a-toggle-theme',
        label: 'Alternar tema',
        icon: document.documentElement.classList.contains('dark') ? Sun : Moon,
        description: 'Trocar entre claro e escuro',
        run: () => {
          document.documentElement.classList.toggle('dark');
          try {
            window.localStorage.setItem(
              'theme',
              document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            );
          } catch { /* noop */ }
          close();
        },
      },
      {
        id: 'a-keyboard-cheatsheet',
        label: 'Atalhos de teclado',
        icon: KeyboardIcon,
        description: 'Ver todos os atalhos disponíveis',
        run: () => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }));
          close();
        },
      },
      {
        id: 'a-open-search',
        label: 'Busca avançada (federada)',
        icon: Search,
        description: 'Abrir GlobalSearch para contatos, empresas e conversas',
        run: () => {
          close();
          if (onOpenLegacySearch) {
            window.setTimeout(() => onOpenLegacySearch(), 50);
          }
        },
      },
      {
        id: 'a-open-ask',
        label: 'Perguntar ao CRM (IA)',
        icon: Sparkles,
        description: 'Abrir chat IA Ask CRM',
        run: () => {
          close();
          if (onOpenAsk) {
            window.setTimeout(() => onOpenAsk(), 50);
          }
        },
      },
    ],
    [navigate, close, toggleDensity, isCompact, onOpenLegacySearch, onOpenAsk],
  );

  const groupedRoutes = useMemo(() => {
    const groups = new Map<CommandRoute['section'], CommandRoute[]>();
    for (const r of COMMAND_ROUTES) {
      const list = groups.get(r.section) ?? [];
      list.push(r);
      groups.set(r.section, list);
    }
    return Array.from(groups.entries());
  }, []);

  const recentRoutes = useMemo(
    () => recentIds.map((id) => COMMAND_ROUTES.find((r) => r.id === id)).filter((x): x is CommandRoute => !!x),
    [recentIds],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        {(Object.keys(MODE_META) as Mode[]).map((m) => {
          const Icon = MODE_META[m].icon;
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                if (m === 'search') {
                  close();
                  if (onOpenLegacySearch) window.setTimeout(() => onOpenLegacySearch(), 50);
                  return;
                }
                if (m === 'ask') {
                  close();
                  if (onOpenAsk) window.setTimeout(() => onOpenAsk(), 50);
                  return;
                }
                setMode(m);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-pressed={active}
              title={MODE_META[m].hint}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {MODE_META[m].label}
            </button>
          );
        })}
        <Badge variant="outline" className="ml-auto text-[10px] font-mono">
          ⌘K
        </Badge>
      </div>

      <CommandInput
        placeholder={mode === 'navigate' ? 'Para onde você quer ir?' : 'Que ação executar?'}
        value={query}
        onValueChange={setQuery}
      />

      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>

        {mode === 'navigate' && recentRoutes.length > 0 && !query && (
          <>
            <CommandGroup heading={(
              <span className="flex items-center gap-1.5">
                <History className="h-3 w-3" /> Recentes
              </span>
            ) as unknown as string}>
              {recentRoutes.map((r) => {
                const Icon = r.icon;
                return (
                  <CommandItem key={`recent-${r.id}`} value={`${r.label} ${r.section}`} onSelect={() => goto(r)}>
                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{r.label}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">{r.section}</Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {mode === 'navigate' &&
          groupedRoutes.map(([section, routes]) => (
            <CommandGroup key={section} heading={section}>
              {routes.map((r) => {
                const Icon = r.icon;
                return (
                  <CommandItem
                    key={r.id}
                    value={`${r.label} ${r.section} ${(r.keywords ?? []).join(' ')}`}
                    onSelect={() => goto(r)}
                  >
                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{r.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{r.url}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}

        {mode === 'actions' && (
          <CommandGroup heading="Ações rápidas">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <CommandItem
                  key={a.id}
                  value={`${a.label} ${a.description ?? ''}`}
                  onSelect={() => a.run?.()}
                >
                  <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{a.label}</span>
                    {a.description && (
                      <span className="text-[10px] text-muted-foreground">{a.description}</span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
