/**
 * Tags temáticas curadas para interações (Ficha 360).
 *
 * Aplica dicionário de palavras-chave (com sinônimos PT-BR) ao texto livre
 * de `assunto + resumo` da view `vw_interaction_timeline`. Sem mudança de
 * schema — extração 100% client-side, normalizando acentos e caixa.
 */

export const TAG_DICTIONARY = {
  orcamento: {
    label: 'Orçamento',
    keywords: ['orçamento', 'orcamento', 'cotação', 'cotacao', 'preço', 'preco', 'valor', 'quanto custa'],
  },
  proposta: {
    label: 'Proposta',
    keywords: ['proposta', 'contrato', 'minuta', 'termos'],
  },
  followup: {
    label: 'Follow-up',
    keywords: ['follow-up', 'followup', 'follow up', 'retomar', 'retomada', 'lembrete'],
  },
  reuniao: {
    label: 'Reunião',
    keywords: ['reunião', 'reuniao', 'call', 'agenda', 'agendar', 'marcar'],
  },
  duvida: {
    label: 'Dúvida',
    keywords: ['dúvida', 'duvida', 'pergunta', 'esclarecer'],
  },
  objecao: {
    label: 'Objeção',
    keywords: ['objeção', 'objecao', 'caro', 'não tenho interesse', 'nao tenho interesse', 'não posso', 'nao posso'],
  },
  fechamento: {
    label: 'Fechamento',
    keywords: ['fechado', 'assinou', 'assinado', 'aprovado', 'ganhamos'],
  },
  suporte: {
    label: 'Suporte',
    keywords: ['suporte', 'problema', 'erro', 'bug', 'reclamação', 'reclamacao'],
  },
  familia: {
    label: 'Família',
    keywords: ['família', 'familia', 'esposa', 'marido', 'filho', 'filha', 'crianças', 'aniversário', 'aniversario', 'casa', 'viagem'],
  },
  hobbies: {
    label: 'Hobbies & Lazer',
    keywords: ['futebol', 'leitura', 'viagem', 'vinho', 'restaurante', 'corrida', 'tênis', 'tenis', 'academia', 'musica', 'música', 'hobby', 'hobbies'],
  },
} as const;

export type InteractionTag = keyof typeof TAG_DICTIONARY;

export const ALL_TAGS = Object.keys(TAG_DICTIONARY) as InteractionTag[];
const ALL_TAGS_SET = new Set<string>(ALL_TAGS);

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Pré-normaliza keywords uma única vez (módulo carregado uma vez).
const NORMALIZED_KEYWORDS: Record<InteractionTag, string[]> = ALL_TAGS.reduce(
  (acc, tag) => {
    acc[tag] = TAG_DICTIONARY[tag].keywords.map((k) => normalize(k));
    return acc;
  },
  {} as Record<InteractionTag, string[]>,
);

/** Retorna o array de tags detectadas em um texto livre. */
export function extractTags(text: string): InteractionTag[] {
  if (!text) return [];
  const haystack = normalize(text);
  const out: InteractionTag[] = [];
  for (const tag of ALL_TAGS) {
    const kws = NORMALIZED_KEYWORDS[tag];
    for (let i = 0; i < kws.length; i++) {
      if (haystack.includes(kws[i])) {
        out.push(tag);
        break;
      }
    }
  }
  return out;
}

interface TaggableInteraction {
  assunto?: string | null;
  resumo?: string | null;
}

/** Retorna true se a interação contém PELO MENOS UMA das tags selecionadas (OR). */
export function interactionMatchesTags(
  interaction: TaggableInteraction,
  selected: InteractionTag[],
): boolean {
  if (!selected || selected.length === 0) return true;
  const text = `${interaction.assunto ?? ''} ${interaction.resumo ?? ''}`;
  if (!text.trim()) return false;
  const haystack = normalize(text);
  for (const tag of selected) {
    const kws = NORMALIZED_KEYWORDS[tag];
    for (let i = 0; i < kws.length; i++) {
      if (haystack.includes(kws[i])) return true;
    }
  }
  return false;
}

/** Conta quantas interações batem com cada tag (eixo independente — mesma interação pode contar para várias tags). */
export function countByTag(items: TaggableInteraction[]): Record<InteractionTag, number> {
  const counts = ALL_TAGS.reduce(
    (acc, tag) => {
      acc[tag] = 0;
      return acc;
    },
    {} as Record<InteractionTag, number>,
  );
  if (!Array.isArray(items)) return counts;
  for (const it of items) {
    const text = `${it.assunto ?? ''} ${it.resumo ?? ''}`;
    if (!text.trim()) continue;
    const haystack = normalize(text);
    for (const tag of ALL_TAGS) {
      const kws = NORMALIZED_KEYWORDS[tag];
      for (let i = 0; i < kws.length; i++) {
        if (haystack.includes(kws[i])) {
          counts[tag] += 1;
          break;
        }
      }
    }
  }
  return counts;
}

/** Whitelist usada por hooks/setters de URL. */
export function sanitizeTags(raw: unknown): InteractionTag[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: InteractionTag[] = [];
  for (const v of raw) {
    if (typeof v !== 'string') continue;
    const norm = v.trim().toLowerCase();
    if (!ALL_TAGS_SET.has(norm) || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm as InteractionTag);
  }
  return out;
}
