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
// Base real do CRM: 4.729 contatos, 2.318 com interacao, mas so 2 com mais de uma.
// Exigir recorrencia entre conversas deixaria `interests` vazio para quase toda a
// carteira, entao tres mencoes no mesmo historico tambem contam como evidencia.
const MIN_INTEREST_MENTIONS = 3;
const MAX_ARRAY_LENGTH = 30;

// Ruido de conversa de CRM: palavras longas o bastante para passar no filtro de
// tamanho, mas que nao dizem nada sobre o que o cliente quer comprar.
const STOPWORDS = new Set([
  'aqui', 'ainda', 'algum', 'alguma', 'apenas', 'antes', 'ate', 'atencao', 'ativo', 'bom', 'boa',
  'caso', 'certamente', 'cliente', 'clientes', 'coisa', 'comercial', 'como', 'confirmar',
  'confirmado', 'conforme', 'conosco', 'contato', 'depois', 'desde', 'durante', 'email',
  'empresa', 'enviado', 'enviar', 'entao', 'entre', 'essa', 'esse', 'esta', 'estao',
  'este', 'favor', 'fazer', 'feito', 'ficou', 'forma', 'frente', 'gente', 'gostaria',
  'hoje', 'isso', 'ligacao', 'mandar', 'mais', 'mesmo', 'mensagem', 'muito', 'nada',
  'nosso', 'nossa', 'obrigado', 'obrigada', 'orcamento', 'outro', 'outra', 'para',
  'parte', 'pedido', 'pediu', 'pelo', 'pela', 'podem', 'pode', 'preciso', 'precisamos',
  'proposta', 'quando', 'queria', 'registrado', 'reuniao', 'segue', 'seguir', 'semana', 'seria',
  'sobre', 'tambem', 'tarde', 'temos', 'tenho', 'tipo', 'todos', 'todas', 'tudo',
  'vamos', 'verificar', 'whatsapp',
  // Rotulos de cadastro e provedores que o tokenizador transformava em "interesse".
  'facebook', 'gmail', 'hotmail', 'instagram', 'linkedin', 'outlook', 'quero', 'rede',
  'telefone', 'yahoo',
]);

// O texto real das interacoes do CRM e majoritariamente cadastro, nao conversa:
// "Email registrado: lucianapassos@sicoobcredindaia.com.br", "Rede: linkedin |
// @trapani-industria-de-maquinas", "WhatsApp ativo: 16991565481". Sem remover esses
// trechos antes de tokenizar, nome de pessoa, dominio e telefone viram palavra-chave
// e o motor de ofertas passa a sugerir produto a partir do nome do contato.
const CONTACT_NOISE = /https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+|@[\w.%-]+|\+?\d[\d\s().-]{7,}/gi;

/** Tira email, URL, @handle e telefone do texto antes de separar palavras. */
function stripContactNoise(text: string): string {
  return text.replace(CONTACT_NOISE, ' ');
}

/** Sem acento e sem caixa, para "Café" e "cafe" contarem como a mesma evidencia. */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Tokens com significado do texto: descarta palavra curta, ruido de conversa e numero solto. */
export function tokenize(text: string): string[] {
  return normalize(stripContactNoise(text))
    .split(/[^a-z0-9]+/)
    .filter((token) =>
      token.length >= MIN_TOKEN_LENGTH
      && !STOPWORDS.has(token)
      && !/^\d+$/.test(token));
}

/** Conta em quantas interacoes distintas cada token aparece e quantas mencoes somou. */
export function rankTokens(texts: readonly string[]): Array<{ token: string; hits: number; mentions: number }> {
  const hits = new Map<string, number>();
  const mentions = new Map<string, number>();
  for (const text of texts) {
    const tokens = tokenize(text);
    for (const token of new Set(tokens)) {
      hits.set(token, (hits.get(token) ?? 0) + 1);
    }
    for (const token of tokens) {
      mentions.set(token, (mentions.get(token) ?? 0) + 1);
    }
  }
  return [...hits.entries()]
    .map(([token, count]) => ({ token, hits: count, mentions: mentions.get(token) ?? 0 }))
    .sort((a, b) => b.hits - a.hits || b.mentions - a.mentions || a.token.localeCompare(b.token));
}

export function deriveKeywords(texts: readonly string[], limit: number = MAX_KEYWORDS): string[] {
  return rankTokens(texts).slice(0, limit).map((entry) => entry.token);
}

/** Interesse e o que voltou em mais de uma conversa ou o que o contato repetiu no historico. */
export function deriveInterests(texts: readonly string[], limit: number = MAX_INTERESTS): string[] {
  return rankTokens(texts)
    .filter((entry) => entry.hits >= MIN_INTEREST_HITS || entry.mentions >= MIN_INTEREST_MENTIONS)
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