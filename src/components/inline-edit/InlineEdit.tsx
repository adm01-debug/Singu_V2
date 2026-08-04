import { useState, useRef, useEffect, KeyboardEvent, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<boolean>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  displayClassName?: string;
  multiline?: boolean;
  type?: string;
  maxLength?: number;
  disabled?: boolean;
  showEditIcon?: boolean;
  emptyText?: string;
  validate?: (value: string) => string | null;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = 'Clique para editar',
  className,
  inputClassName,
  displayClassName,
  multiline = false,
  type = "text",
  maxLength,
  disabled = false,
  showEditIcon = true,
  emptyText = 'Clique para adicionar',
  validate,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (!multiline && type !== 'date') {
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline, type]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    if (validate) {
      const validationError = validate(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const success = await onSave(editValue);
      if (success) {
        setIsEditing(false);
      } else {
        setError('Erro ao salvar');
      }
    } catch {
      setError('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={cn('group relative', className)}>
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-2"
          >
            <div className="flex-1 relative">
              {multiline ? (
                <Textarea
                  ref={inputRef as RefObject<HTMLTextAreaElement>}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!isSaving) handleCancel();
                    }, 150);
                  }}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  disabled={isSaving}
                  className={cn(
                    'pr-16',
                    error && 'border-destructive focus-visible:ring-destructive',
                    inputClassName
                  )}
                />
              ) : (
                <Input
                  ref={inputRef as RefObject<HTMLInputElement>}
                  type={type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!isSaving && document.activeElement !== inputRef.current) {
                        handleCancel();
                      }
                    }, 150);
                  }}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  disabled={isSaving}
                  className={cn(
                    'pr-16',
                    error && 'border-destructive focus-visible:ring-destructive',
                    inputClassName
                  )}
                />
              )}
              {maxLength && (
                <span className="absolute right-2 bottom-1 text-xs text-muted-foreground">
                  {editValue.length}/{maxLength}
                </span>
              )}
              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>
            
            <div className="flex gap-1">
              <Button
                size="icon" aria-label="Carregando"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-success" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Cancelar edição"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleStartEdit}
            onDoubleClick={handleStartEdit}
            className={cn(
              'cursor-pointer flex items-center gap-2 py-1 px-2 -mx-2 rounded-md transition-colors',
              !disabled && 'hover:bg-muted/50',
              disabled && 'cursor-default opacity-60',
              displayClassName
            )}
          >
            <span className={cn(!value && 'text-muted-foreground italic')}>
              {value || emptyText}
            </span>
            {showEditIcon && !disabled && (
              <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InlineNumberEditProps extends Omit<InlineEditProps, 'value' | 'onSave' | 'validate'> {
  value: number;
  onSave: (value: number) => Promise<boolean>;
  min?: number;
  max?: number;
  suffix?: string;
  prefix?: string;
}

export function InlineNumberEdit({
  value,
  onSave,
  min,
  max,
  suffix,
  prefix,
  ...props
}: InlineNumberEditProps) {
  const validate = (strValue: string): string | null => {
    const num = parseFloat(strValue);
    if (isNaN(num)) return 'Valor inválido';
    if (min !== undefined && num < min) return `Mínimo: ${min}`;
    if (max !== undefined && num > max) return `Máximo: ${max}`;
    return null;
  };

  const handleSave = async (strValue: string): Promise<boolean> => {
    const num = parseFloat(strValue);
    if (isNaN(num)) return false;
    return onSave(num);
  };

  return (
    <InlineEdit
      {...props}
      value={String(value)}
      onSave={handleSave}
      validate={validate}
      emptyText={`${prefix || ''}0${suffix || ''}`}
    />
  );
}

interface InlineDateEditProps extends Omit<InlineEditProps, 'value' | 'onSave' | 'type'> {
  value: string | null | undefined;
  onSave: (value: string | null) => Promise<boolean>;
  formatDisplay?: (value: string) => string;
}

export function InlineDateEdit({
  value,
  onSave,
  formatDisplay,
  ...props
}: InlineDateEditProps) {
  const handleSave = async (strValue: string): Promise<boolean> => {
    return onSave(strValue || null);
  };

  return (
    <InlineEdit
      {...props}
      type="date"
      value={value || ''}
      onSave={handleSave}
    />
  );
}
