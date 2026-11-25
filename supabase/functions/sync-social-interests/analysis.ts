// Derivacao de interesse social a partir do texto real das interacoes do contato.
//
// A versao anterior gravava rotulos fixos ('AI', 'Productivity', 'automation',
// 'efficiency') em toda sincronizacao: interesses que nao vieram de dado nenhum do
// cliente e que ainda cresciam a cada clique. Agora o que se grava sai do texto das
// interacoes reais do contato.

const MIN_TOKEN_LENGTH = 4;
const MAX_KEYWORDS = 15;
const MAX_INTERESTS = 10;
const MIN_INTEREST_HITS = 2;
const MAX_ARRAY_LENGTH = 30;

// Ruido de conversa de CRM: palavras longas o bastante para passar no filtro de
// tamanho, mas que nao dizem nada sobre o que o cliente quer comprar.
const STOPWORDS = new Set([
  'aqui', 'ainda', 'algum', 'alguma', 'apenas', 'antes', 'ate', 'atencao', 'bom', 'boa',
  'caso', 'certamente', 'cliente', 'clientes', 'coisa', 'comercial', 'como', 'confirmar',
  'confirmado', 'conforme', 'conosco', 'contato', 'depois', 'desde', 'durante', 'email',
  'empresa', 'enviado', 'enviar', 'entao', 'entre', 'essa', 'esse', 'esta', 'estao',
  'este', 'favor', 'fazer', 'feito', 'ficou', 'forma', 'frente', 'gente', 'gostaria',
  'hoje', 'isso', 'ligacao', 'mandar', 'mais', 'mesmo', 'mensagem', 'muito', 'nada',
  'nosso', 'nossa', 'obrigado', 'obrigada', 'orcamento', 'outro', 'outra', 'para',
  'parte', 'pedido', 'pediu', 'pelo', 'pela', 'podem', 'pode', 'preciso', 'precisamos',
  'proposta', 'quando', 'queria', 'reuniao', 'segue', 'seguir', 'semana', 'seria',
  'sobre', 'tambem', 'tarde', 'temos', 'tenho', 'tipo', 'todos', 'todas', 'tudo',
  'vamos', 'verificar', 'whatsapp',
]);

/** Sem acento e sem caixa, para "Café" e "cafe" contarem como a mesma evidencia. */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Tokens com significado do texto: descarta palavra curta, ruido de conversa e numero solto. */
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((token) =>
      token.length >= MIN_TOKEN_LENGTH
      && !STOPWORDS.has(token)
      && !/^\d+$/.test(token));
}

/** Conta em quantas interacoes distintas cada token aparece (nao quantas vezes repete). */
export function rankTokens(texts: readonly string[]): Array<{ token: string; hits: number }> {
  const hits = new Map<string, number>();
  for (const text of texts) {
    for (const token of new Set(tokenize(text))) {
      hits.set(token, (hits.get(token) ?? 0) + 1);
    }
  }
  return [...hits.entries()]
    .map(([token, count]) => ({ token, hits: count }))
    .sort((a, b) => b.hits - a.hits || a.token.localeCompare(b.token));
}

export function deriveKeywords(texts: readonly string[], limit: number = MAX_KEYWORDS): string[] {
  return rankTokens(texts).slice(0, limit).map((entry) => entry.token);
}

/** Interesse e o que voltou em mais de uma conversa; aparencia unica e so palavra solta. */
export function deriveInterests(texts: readonly string[], limit: number = MAX_INTERESTS): string[] {
  return rankTokens(texts)
    .filter((entry) => entry.hits >= MIN_INTEREST_HITS)
    .slice(0, limit)
    .map((entry) => entry.token);
}

/** Junta sem repetir e corta pelo mais recente, para o array nao crescer a cada sincronizacao. */
export function mergeUnique(
  base: readonly string[] | null | undefined,
  extra: readonly string[],
  limit: number = MAX_ARRAY_LENGTH,
): string[] {
  const merged: string[] = [];
  for (const value of [...(base ?? []), ...extra]) {
    const token = value.trim().toLowerCase();
    if (token.length > 0 && !merged.includes(token)) merged.push(token);
  }
  return merged.slice(-limit);
}