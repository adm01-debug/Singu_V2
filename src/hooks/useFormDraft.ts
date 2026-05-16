 import { toast } from 'sonner';
import { useEffect, useCallback, useRef } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';

interface UseFormDraftOptions {
  /** Unique key for this form draft (e.g. 'contact-new' or 'contact-edit-{id}') */
  key: string;
  /** Debounce delay in ms before saving draft */
  debounceMs?: number;
  /** Whether drafting is enabled */
  enabled?: boolean;
}

/**
 * Auto-saves form data to localStorage on change, and restores on mount.
 * Clears draft on successful submit.
 * 
 * Usage:
 * ```tsx
 * const form = useForm({ defaultValues });
 * const { clearDraft, hasDraft } = useFormDraft(form, { key: 'contact-new' });
 * // On successful submit:
 * clearDraft();
 * ```
 */
export function useFormDraft<T extends FieldValues>(
  form: UseFormReturn<T>,
  { key, debounceMs = 1000, enabled = true }: UseFormDraftOptions
) {
  const storageKey = `relateiq-draft-${key}`;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasDraftRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          hasDraftRef.current = true;
          // Only restore non-empty values to avoid overwriting defaults
          const currentValues = form.getValues();
          const mergedValues: Record<string, unknown> = {};
          
          for (const [fieldKey, value] of Object.entries(parsed)) {
            // Only restore if current value is empty/default
            const currentVal = currentValues[fieldKey as keyof T];
            if (!currentVal || currentVal === '' || currentVal === null) {
              mergedValues[fieldKey] = value;
            }
          }
          
           if (Object.keys(mergedValues).length > 0) {
             form.reset({ ...currentValues, ...mergedValues } as T);
             toast.info('Rascunho restaurado automaticamente', {
               description: 'Continuando de onde você parou.',
               duration: 3000,
             });
           }
        }
      }
    } catch {
      // Silently fail if localStorage is unavailable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, enabled]);

  // Watch and save changes
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((data) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        try {
          // Only save if there's meaningful data
          const hasData = Object.values(data).some(v => v !== '' && v !== null && v !== undefined);
          if (hasData) {
            localStorage.setItem(storageKey, JSON.stringify(data));
          }
        } catch {
          // Silently fail
        }
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [form, storageKey, debounceMs, enabled]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      hasDraftRef.current = false;
    } catch {
      // Silently fail
    }
  }, [storageKey]);

  return {
    clearDraft,
    hasDraft: hasDraftRef.current,
  };
}
