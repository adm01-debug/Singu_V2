/**
 * Converts a string to Title Case, handling special cases for Brazilian naming.
 * "PAC SANTA MÔNICA-PR" → "Pac Santa Mônica - PR"
 * "COOPERATIVA DE CRÉDITO" → "Cooperativa de Crédito"
 * "Pac Guará - Guara/sp" → "Pac Guará - SP"
 */
const LOWERCASE_WORDS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com',
]);

const UPPERCASE_WORDS = new Set([
  'PR', 'SP', 'RJ', 'MG', 'RS', 'SC', 'BA', 'CE', 'PE', 'GO', 'DF', 'ES', 'MA', 'PA',
  'PB', 'PI', 'RN', 'SE', 'AL', 'AM', 'AP', 'AC', 'RO', 'RR', 'TO', 'MT', 'MS',
  'PAC', 'SICOOB', 'SICREDI', 'CRESOL', 'UNICRED', 'CNPJ', 'CPF', 'LTDA', 'SA', 'ME', 'EPP',
]);

/** Normalize to ASCII for comparison (strips accents) */
const normalizeForCompare = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function toTitleCase(str: string): string {
  if (!str) return str;
  
  // Strip leading numeric prefix like "05 - " for cleaner display
  const stripped = str.replace(/^\d+\s*[-–—]\s*/, '');
  let input = stripped || str;

  // Remove redundant city/state suffix after " - " (e.g. "PAC IPUA - IPUA/SP" → "PAC IPUA - SP")
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const dashParts = input.split(/\s+[-–—]\s+/);
  if (dashParts.length >= 2) {
    const lastPart = dashParts[dashParts.length - 1];
    const mainParts = dashParts.slice(0, -1).join(' - ');
    const suffix = normalizeForCompare(lastPart.replace(/[/-]\s*[A-Za-z]{2}$/, '').trim());
    const mainNorm = normalizeForCompare(mainParts);
    if (mainNorm.includes(suffix) && suffix.length >= 3) {
      const ufMatch = lastPart.match(/[/-]\s*([A-Za-z]{2})$/);
      // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      const existingUf = mainParts.match(/\s*[-–—]\s*([A-Z]{2})$/);
      if (existingUf) {
        input = mainParts;
      } else {
        input = mainParts + (ufMatch ? ' - ' + ufMatch[1].toUpperCase() : '');
      }
    }
  }
  
  // ALWAYS normalize — convert to title case regardless of current casing
  return input
    .toLowerCase()
    .split(/(\s+|-+|\/+)/)
    .map((word, index) => {
      const upperWord = word.toUpperCase();
      
      // Keep separators as-is
      if (/^[\s\-/]+$/.test(word)) return word;
      
      // Keep known uppercase words
      if (UPPERCASE_WORDS.has(upperWord)) return upperWord;
      
      // Keep state abbreviations (2-letter after separator)
      if (word.length === 2 && /^[a-z]{2}$/.test(word)) {
        const upper = word.toUpperCase();
        if (UPPERCASE_WORDS.has(upper)) return upper;
      }
      
      // Lowercase articles/prepositions (except first word)
      if (index > 0 && LOWERCASE_WORDS.has(word)) return word;
      
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

/**
 * Format a contact display name, handling edge cases:
 * - "WhatsApp 5518991665844" → "(55) 18991-665844"
 * - Email-only → extract name from local part
 * - Empty / "Sem nome" → "Contato"
 */
export function formatContactName(firstName?: string | null, lastName?: string | null): string {
  const fn = (firstName || '').trim();
  const ln = (lastName || '').trim();
  const full = `${fn} ${ln}`.trim();
  
  if (!full || /^sem\s+nome$/i.test(full)) return 'Contato';
  
  // Placeholder names from CRM import (e.g., "Contato — editar", "Posto — editar")
  if (/[—–-]\s*editar$/i.test(full)) return 'Contato';
  
  // Generic placeholder patterns
  if (/^(contato|posto|cargo|teste?)\b/i.test(full) && full.length < 20) return 'Contato';
  
  // WhatsApp + phone number
  if (/^whatsapp\s+\d{8,}/i.test(full)) {
    const phone = full.replace(/^whatsapp\s+/i, '');
    return formatPhoneDisplay(phone);
  }
  
  // Pure phone number as name
  if (/^\+?\d{10,}$/.test(full.replace(/\s/g, ''))) {
    return formatPhoneDisplay(full.replace(/\s/g, ''));
  }
  
  // Email in firstName — extract readable name from local part
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const emailInFirst = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fn);
  if (emailInFirst) {
    const local = fn.split('@')[0];
    const extracted = local
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    // If there's a real last name that's not part of the email, append it
    // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
    if (ln && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ln)) {
      return `${extracted} ${ln.charAt(0).toUpperCase() + ln.slice(1)}`;
    }
    return extracted;
  }
  
  // Full string is an email (no separate last name)
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(full)) {
    const local = full.split('@')[0];
    return local
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  
  return full;
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length >= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Get smart initials for a contact, handling phone/email/WhatsApp names.
 * Returns up to 2 characters.
 */
export function getContactInitials(firstName?: string | null, lastName?: string | null): string {
  const full = `${firstName || ''} ${lastName || ''}`.trim();
  
  if (!full || /^sem\s+nome$/i.test(full)) return '?';
  
  // WhatsApp or phone number → use phone icon-like initials
  if (/^whatsapp\s+\d{8,}/i.test(full) || /^\+?\d{10,}$/.test(full.replace(/\s/g, ''))) {
    const digits = full.replace(/\D/g, '');
    // Use last 2 digits for unique differentiation
    return digits.slice(-2);
  }
  
  // Email → use first 2 chars of local part
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(full)) {
    const local = full.split('@')[0];
    return local.slice(0, 2).toUpperCase();
  }
  
  // Normal name
  const f = firstName?.[0]?.toUpperCase() || '';
  const l = lastName?.[0]?.toUpperCase() || '';
  return `${f}${l}` || '?';
}

/**
 * Pluralize a word based on count (Portuguese-friendly).
 * pluralize(1, 'interação', 'interações') → '1 interação'
 * pluralize(5, 'interação', 'interações') → '5 interações'
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Returns a color class based on a score (0-10 scale)
 */
export function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  if (score <= 2) return { bg: 'bg-destructive', text: 'text-destructive-foreground', border: 'border-destructive/30', ring: 'ring-destructive/20' };
  if (score <= 4) return { bg: 'bg-warning', text: 'text-warning-foreground', border: 'border-warning/30', ring: 'ring-warning/20' };
  if (score <= 6) return { bg: 'bg-info', text: 'text-info-foreground', border: 'border-info/30', ring: 'ring-info/20' };
  if (score <= 8) return { bg: 'bg-success', text: 'text-success-foreground', border: 'border-success/30', ring: 'ring-success/20' };
  return { bg: 'bg-success', text: 'text-success-foreground', border: 'border-success/30', ring: 'ring-success/20' };
}

/**
 * Returns a score color for relationship scores (0-100)
 */
export function getRelationshipScoreColor(score: number): string {
  if (score <= 20) return 'text-destructive';
  if (score <= 40) return 'text-warning';
  if (score <= 60) return 'text-info';
  if (score <= 80) return 'text-success';
  return 'text-success';
}

/**
 * Format capital social value to compact Brazilian currency.
 * 460000000 → "R$ 460M"
 * 1500000 → "R$ 1,5M"
 * 350000 → "R$ 350K"
 * 1200 → "R$ 1.200"
 */
export function formatCapitalSocial(value: number | null | undefined): string | null {
  if (value === null || value === undefined || value === 0) return null;
  if (value >= 1_000_000_000) {
    const v = value / 1_000_000_000;
    return `R$ ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')}B`;
  }
  if (value >= 1_000_000) {
    const v = value / 1_000_000;
    return `R$ ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    const v = value / 1_000;
    return `R$ ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')}K`;
  }
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

/**
 * Format CNPJ with mask: 00.000.000/0000-00
 */
export function formatCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
}
