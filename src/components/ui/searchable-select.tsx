import { useState, useRef, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type CustomValueMode = 'strict' | 'flexible' | 'approval';

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  /** @deprecated Use `customValueMode` instead */
  allowCustom?: boolean;
  /** Controls how custom (non-existing) values are handled */
  customValueMode?: CustomValueMode;
  /** Callback to validate/create custom values. Return true to accept. */
  onCustomValue?: (value: string) => Promise<boolean>;
  /** Label for the "add new" button */
  customValueLabel?: string;
  /** Field name for audit logging */
  fieldName?: string;
  /** Registro realmente persistido pelo callback de criação do valor. */
  auditTarget?: Pick<TablesInsert<'audit_log'>, 'table_name' | 'record_id'> & {
    action: 'INSERT' | 'UPDATE' | 'DELETE';
  };
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  isLoading = false,
  disabled = false,
  allowCustom,
  customValueMode,
  onCustomValue,
  customValueLabel = 'Adicionar novo',
  fieldName,
  auditTarget,
}: SearchableSelectProps) {
  const { user } = useAuth();

  // Resolve mode: new prop takes precedence over legacy
  const mode: CustomValueMode = customValueMode
    ?? (allowCustom === false ? 'strict' : allowCustom === true ? 'flexible' : 'strict');

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmValue, setConfirmValue] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = useCallback((selected: string) => {
    onValueChange(selected);
    setOpen(false);
    setSearch('');
  }, [onValueChange]);

  const logCustomValue = useCallback(async (customValue: string) => {
    if (!auditTarget) return;
    try {
      if (!user) throw new Error('Usuário indisponível para auditoria.');
      const { error } = await supabase.from('audit_log').insert({
        table_name: auditTarget.table_name,
        record_id: auditTarget.record_id,
        entity_type: 'custom_value',
        entity_id: auditTarget.record_id,
        action: auditTarget.action,
        new_data: { field: fieldName || 'unknown', value: customValue },
        user_id: user.id,
      });
      if (error) throw error;
    } catch {
      toast.error('Valor selecionado, mas não foi possível registrar a auditoria.');
    }
  }, [auditTarget, fieldName, user]);

  const handleCustomValue = useCallback(async (customValue: string) => {
    if (mode === 'strict') return;

    if (mode === 'approval') {
      setConfirmValue(customValue);
      return;
    }

    // Flexible mode — accept immediately
    if (onCustomValue) {
      setIsCreating(true);
      const accepted = await onCustomValue(customValue);
      setIsCreating(false);
      if (!accepted) return;
    }
    await logCustomValue(customValue);
    handleSelect(customValue);
  }, [mode, onCustomValue, handleSelect, logCustomValue]);

  const handleConfirmCreate = useCallback(async () => {
    if (!confirmValue) return;
    setIsCreating(true);

    if (onCustomValue) {
      const accepted = await onCustomValue(confirmValue);
      if (!accepted) {
        setIsCreating(false);
        setConfirmValue(null);
        return;
      }
    }

    await logCustomValue(confirmValue);
    handleSelect(confirmValue);
    setIsCreating(false);
    setConfirmValue(null);
  }, [confirmValue, onCustomValue, handleSelect, logCustomValue]);

  const showCustomOption = mode !== 'strict' && search.trim() && filtered.length === 0;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal h-10 text-sm"
          >
            <span className={cn('truncate', !value && 'text-muted-foreground')}>
              {value || placeholder}
            </span>
            {isLoading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b border-border">
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Carregando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {showCustomOption ? (
                  <button
                    type="button"
                    onClick={() => handleCustomValue(search.trim())}
                    disabled={isCreating}
                    className="flex items-center gap-1.5 mx-auto text-primary hover:underline disabled:opacity-50"
                  >
                    {isCreating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {customValueLabel}: "{search.trim()}"
                  </button>
                ) : (
                  'Nenhum resultado'
                )}
              </div>
            ) : (
              <>
                {filtered.slice(0, 100).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      'flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer text-left',
                      value === option && 'bg-primary/10'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        value === option ? 'opacity-100 text-primary' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{option}</span>
                  </button>
                ))}
                {filtered.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{filtered.length - 100} resultados. Refine a busca.
                  </p>
                )}
                {/* Show "add custom" even when there are results but no exact match */}
                {mode !== 'strict' && search.trim() && !filtered.some(o => o.toLowerCase() === search.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleCustomValue(search.trim())}
                    disabled={isCreating}
                    className="flex items-center gap-1.5 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-muted cursor-pointer text-primary border-t border-border/50 mt-1 pt-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {customValueLabel}: "{search.trim()}"
                  </button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Approval confirmation dialog */}
      <AlertDialog open={!!confirmValue} onOpenChange={(v) => !v && setConfirmValue(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar novo valor?</AlertDialogTitle>
            <AlertDialogDescription>
              O valor <strong>"{confirmValue}"</strong> não existe no banco de dados. Deseja criá-lo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>Cancelar</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmValue(null);
                inputRef.current?.focus();
              }}
              disabled={isCreating}
            >
              Buscar novamente
            </Button>
            <AlertDialogAction onClick={handleConfirmCreate} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Criar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Pre-configured variants ─── */

type VariantProps = Omit<SearchableSelectProps, 'customValueMode' | 'allowCustom'>;

/** Never allows custom values — lookup only */
export function SearchableSelectStrict(props: VariantProps) {
  return <SearchableSelect {...props} customValueMode="strict" />;
}

/** Always allows custom values without confirmation */
export function SearchableSelectFlexible(props: VariantProps) {
  return <SearchableSelect {...props} customValueMode="flexible" />;
}

/** Allows custom values with confirmation dialog */
export function SearchableSelectWithApproval(props: VariantProps) {
  return <SearchableSelect {...props} customValueMode="approval" />;
}
