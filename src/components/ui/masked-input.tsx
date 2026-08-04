import { forwardRef, useCallback, ChangeEvent, InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';

// ============================================
// PHONE MASK
// ============================================

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string, formattedValue: string) => void;
  countryCode?: 'BR' | 'US';
}

function formatPhoneBR(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatPhoneUS(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, countryCode = 'BR', className, ...props }, ref) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      const formatted = countryCode === 'BR' ? formatPhoneBR(rawValue) : formatPhoneUS(rawValue);
      onChange?.(rawValue, formatted);
    }, [onChange, countryCode]);

    const displayValue = countryCode === 'BR' ? formatPhoneBR(value) : formatPhoneUS(value);

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={countryCode === 'BR' ? '(11) 99999-9999' : '(555) 555-5555'}
        className={className}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = 'PhoneInput';

// ============================================
// CPF MASK (Brazilian)
// ============================================

interface CPFInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string, formattedValue: string) => void;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export const CPFInput = forwardRef<HTMLInputElement, CPFInputProps>(
  ({ value = '', onChange, className, ...props }, ref) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '').slice(0, 11);
      const formatted = formatCPF(rawValue);
      onChange?.(rawValue, formatted);
    }, [onChange]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={formatCPF(value)}
        onChange={handleChange}
        placeholder="000.000.000-00"
        className={className}
        {...props}
      />
    );
  }
);
CPFInput.displayName = 'CPFInput';

// ============================================
// CNPJ MASK (Brazilian)
// ============================================

interface CNPJInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string, formattedValue: string) => void;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export const CNPJInput = forwardRef<HTMLInputElement, CNPJInputProps>(
  ({ value = '', onChange, className, ...props }, ref) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '').slice(0, 14);
      const formatted = formatCNPJ(rawValue);
      onChange?.(rawValue, formatted);
    }, [onChange]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={formatCNPJ(value)}
        onChange={handleChange}
        placeholder="00.000.000/0000-00"
        className={className}
        {...props}
      />
    );
  }
);
CNPJInput.displayName = 'CNPJInput';

// ============================================
// CURRENCY MASK
// ============================================

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number;
  onChange?: (value: number, formattedValue: string) => void;
  currency?: 'BRL' | 'USD';
}

function formatCurrency(value: number, currency: 'BRL' | 'USD'): string {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency,
  }).format(value / 100);
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onChange, currency = 'BRL', className, ...props }, ref) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '');
      const numericValue = parseInt(digits || '0', 10);
      const formatted = formatCurrency(numericValue, currency);
      onChange?.(numericValue, formatted);
    }, [onChange, currency]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={formatCurrency(value, currency)}
        onChange={handleChange}
        placeholder={currency === 'BRL' ? 'R$ 0,00' : '$0.00'}
        className={className}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = 'CurrencyInput';

// ============================================
// CEP MASK (Brazilian Postal Code)
// ============================================

interface CEPInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string, formattedValue: string) => void;
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export const CEPInput = forwardRef<HTMLInputElement, CEPInputProps>(
  ({ value = '', onChange, className, ...props }, ref) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '').slice(0, 8);
      const formatted = formatCEP(rawValue);
      onChange?.(rawValue, formatted);
    }, [onChange]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        value={formatCEP(value)}
        onChange={handleChange}
        placeholder="00000-000"
        className={className}
        {...props}
      />
    );
  }
);
CEPInput.displayName = 'CEPInput';

// ============================================
// DATE MASK
// ============================================

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string, formattedValue: string) => void;
  format?: 'DD/MM/YYYY' | 'MM/DD/YYYY';
}

function formatDate(value: string, format: 'DD/MM/YYYY' | 'MM/DD/YYYY'): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value = '', onChange, format = 'DD/MM/YYYY', className, ...props }, ref) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '').slice(0, 8);
      const formatted = formatDate(rawValue, format);
      onChange?.(rawValue, formatted);
    }, [onChange, format]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={formatDate(value, format)}
        onChange={handleChange}
        placeholder={format.toLowerCase()}
        className={className}
        {...props}
      />
    );
  }
);
DateInput.displayName = 'DateInput';

// Export all formatters for external use
export const formatters = {
  phone: {
    BR: formatPhoneBR,
    US: formatPhoneUS,
  },
  cpf: formatCPF,
  cnpj: formatCNPJ,
  currency: formatCurrency,
  cep: formatCEP,
  date: formatDate,
};
