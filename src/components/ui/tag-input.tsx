import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Adicione e pressione Enter...',
  maxTags = 20,
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const removeTag = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      // Support comma-separated paste
      const parts = inputValue.split(',').map(s => s.trim()).filter(Boolean);
      const newTags = [...value];
      for (const part of parts) {
        if (!newTags.includes(part) && newTags.length < maxTags) {
          newTags.push(part);
        }
      }
      onChange(newTags);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  }, [inputValue, value, onChange, removeTag, maxTags]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes(',')) {
      e.preventDefault();
      const parts = pasted.split(',').map(s => s.trim()).filter(Boolean);
      const newTags = [...value];
      for (const part of parts) {
        if (!newTags.includes(part) && newTags.length < maxTags) {
          newTags.push(part);
        }
      }
      onChange(newTags);
    }
  }, [value, onChange, maxTags]);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background',
        'transition-colors cursor-text',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          variant="secondary"
          className="gap-1 px-2 py-0.5 text-xs font-medium animate-in fade-in-0 zoom-in-95"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(index); }}
              className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`Remover ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled}
        className={cn(
          'flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed'
        )}
      />
    </div>
  );
}
