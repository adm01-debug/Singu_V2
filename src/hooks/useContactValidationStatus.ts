import { useMemo } from 'react';
import { useEmailVerifications, usePhoneValidations } from '@/hooks/useEnrichmentSuite';

export type ValidationStatus = 'valid' | 'invalid' | 'risky' | 'unreachable' | 'catchall' | 'unknown';

export interface EmailStatus {
  status: ValidationStatus;
  score: number;
  verified_at: string;
}

export interface PhoneStatus {
  status: ValidationStatus;
  line_type: string | null;
  validated_at: string;
}

/**
 * Retorna o último status de verificação por email e telefone do contato.
 * Mapas indexados por valor (lowercase email / dígitos do telefone).
 */
export function useContactValidationStatus(contactId?: string) {
  const { data: emails = [], isLoading: emailsLoading } = useEmailVerifications(contactId);
  const { data: phones = [], isLoading: phonesLoading } = usePhoneValidations(contactId);

  const emailMap = useMemo(() => {
    const m = new Map<string, EmailStatus>();
    for (const e of emails) {
      const key = (e.email ?? '').toLowerCase().trim();
      if (!key || m.has(key)) continue;
      m.set(key, {
        status: (e.status as ValidationStatus) ?? 'unknown',
        score: Number(e.score ?? 0),
        verified_at: e.verified_at ?? '',
      });
    }
    return m;
  }, [emails]);

  const phoneMap = useMemo(() => {
    const m = new Map<string, PhoneStatus>();
    for (const p of phones) {
      const digits = (p.phone_e164 ?? '').replace(/\D/g, '');
      if (!digits || m.has(digits)) continue;
      m.set(digits, {
        status: (p.status as ValidationStatus) ?? 'unknown',
        line_type: p.line_type ?? null,
        validated_at: p.validated_at ?? '',
      });
    }
    return m;
  }, [phones]);

  return {
    emailMap,
    phoneMap,
    isLoading: emailsLoading || phonesLoading,
    getEmail: (email?: string | null): EmailStatus | undefined => {
      if (!email) return undefined;
      return emailMap.get(email.toLowerCase().trim());
    },
    getPhone: (phone?: string | null): PhoneStatus | undefined => {
      if (!phone) return undefined;
      const digits = phone.replace(/\D/g, '');
      // tenta match exato e por sufixo (E.164 vs local)
      if (phoneMap.has(digits)) return phoneMap.get(digits);
      for (const [k, v] of phoneMap) {
        if (k.endsWith(digits) || digits.endsWith(k)) return v;
      }
      return undefined;
    },
  };
}
