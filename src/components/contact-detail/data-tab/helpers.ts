import type { ExternalPhone } from '@/hooks/useContactRelationalData';

export const PHONE_TYPE_LABELS: Record<string, string> = {
  fixo_comercial: 'Fixo Comercial',
  celular_corporativo: 'Celular Corp.',
  celular_pessoal: 'Celular Pessoal',
  fixo_residencial: 'Fixo Residencial',
  fax: 'Fax',
};

export const EMAIL_TYPE_LABELS: Record<string, string> = {
  corporativo: 'Corporativo',
  pessoal: 'Pessoal',
  financeiro: 'Financeiro',
  nfe: 'NF-e',
  marketing: 'Marketing',
};

export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function formatPhoneDisplay(phone: ExternalPhone): string {
  return phone.numero_e164 || phone.numero_normalizado || phone.numero;
}
