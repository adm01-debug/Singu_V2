// ==============================================
// VAK-SPECIFIC TRIGGER TEMPLATES
// Templates adaptados por Sistema Representacional (Visual, Auditivo, Cinestésico)
// ==============================================

import { TriggerType } from '@/types/triggers';
import { VAKType } from '@/types/vak';

export interface VAKTriggerTemplate {
  id: string;
  triggerId: TriggerType | string;
  vakType: VAKType;
  template: string;
  keywords: string[];
  tips: string[];
}

// ============================================
// TEMPLATES POR TRIGGER E VAK
// ============================================
export const VAK_TRIGGER_TEMPLATES: VAKTriggerTemplate[] = [
  // ========== URGÊNCIA ==========
  // Scarcity
  { id: 'scarcity-v', triggerId: 'scarcity', vakType: 'V', template: '{nome}, olha só: restam apenas {quantidade} vagas - você consegue visualizar o dashboard mostrando "esgotado"?', keywords: ['olha', 'veja', 'visualize', 'imagem'], tips: ['Use imagens de escassez', 'Mostre contadores visuais'] },
  { id: 'scarcity-a', triggerId: 'scarcity', vakType: 'A', template: '{nome}, preciso te dizer: só temos {quantidade} vagas. Ouço isso de todos os lados - está acabando rápido.', keywords: ['ouça', 'dizer', 'falar', 'som'], tips: ['Use tom de urgência na voz', 'Mencione o que outros dizem'] },
  { id: 'scarcity-k', triggerId: 'scarcity', vakType: 'K', template: '{nome}, sinta a pressão: {quantidade} vagas restantes. Não quero que você perca a sensação de estar dentro.', keywords: ['sinta', 'pressão', 'sensação', 'toque'], tips: ['Faça sentir a urgência', 'Use linguagem corporal de pressa'] },

  // Urgency
  { id: 'urgency-v', triggerId: 'urgency', vakType: 'V', template: '{nome}, veja o calendário: temos até {data} para fechar. Consegue ver o prazo se aproximando?', keywords: ['veja', 'calendário', 'prazo', 'visualize'], tips: ['Mostre cronogramas', 'Use cores de alerta'] },
  { id: 'urgency-a', triggerId: 'urgency', vakType: 'A', template: '{nome}, escuta: o relógio está correndo. Até {data} precisamos ter uma resposta - o que você me diz?', keywords: ['escuta', 'relógio', 'diz', 'resposta'], tips: ['Use ritmo acelerado', 'Faça perguntas diretas'] },
  { id: 'urgency-k', triggerId: 'urgency', vakType: 'K', template: '{nome}, sinto que precisamos acelerar. Até {data} - você sente que conseguimos resolver isso juntos?', keywords: ['sinto', 'acelerar', 'juntos', 'consegue'], tips: ['Crie senso de parceria', 'Use aperto de mão virtual'] },

  // FOMO
  { id: 'fomo-v', triggerId: 'fomo', vakType: 'V', template: '{nome}, imagina ver seus concorrentes usando isso enquanto você fica de fora. Que imagem isso te passa?', keywords: ['imagina', 'ver', 'imagem', 'fora'], tips: ['Pinte o cenário de perda', 'Mostre comparativos visuais'] },
  { id: 'fomo-a', triggerId: 'fomo', vakType: 'A', template: '{nome}, já ouvi de outros clientes: "deveria ter entrado antes". Não quer ser o próximo a dizer isso?', keywords: ['ouvi', 'dizer', 'próximo', 'clientes'], tips: ['Cite depoimentos', 'Use voz de arrependimento'] },
  { id: 'fomo-k', triggerId: 'fomo', vakType: 'K', template: '{nome}, você sente quando está perdendo uma oportunidade? Outros já estão experimentando os resultados.', keywords: ['sente', 'experimentando', 'perdendo'], tips: ['Faça sentir a perda', 'Use linguagem experiencial'] },

  // ========== PROVA SOCIAL ==========
  // Social Proof
  { id: 'social_proof-v', triggerId: 'social_proof', vakType: 'V', template: '{nome}, olha esse gráfico: {quantidade} empresas já adotaram. Consegue ver a tendência clara?', keywords: ['olha', 'gráfico', 'ver', 'tendência'], tips: ['Mostre dados visuais', 'Use gráficos de crescimento'] },
  { id: 'social_proof-a', triggerId: 'social_proof', vakType: 'A', template: '{nome}, todo mundo está comentando: {quantidade} empresas já entraram. O que o mercado está dizendo é claro.', keywords: ['comentando', 'dizendo', 'claro', 'mercado'], tips: ['Cite conversas do mercado', 'Use tom de consenso'] },
  { id: 'social_proof-k', triggerId: 'social_proof', vakType: 'K', template: '{nome}, sinta o movimento: {quantidade} empresas já experimentaram isso. A energia do mercado é essa.', keywords: ['sinta', 'movimento', 'experimentaram', 'energia'], tips: ['Transmita a energia coletiva', 'Faça sentir parte do grupo'] },

  // Authority
  { id: 'authority-v', triggerId: 'authority', vakType: 'V', template: '{nome}, veja esses dados da {fonte}: {estatística}. A imagem que se forma é clara.', keywords: ['veja', 'dados', 'imagem', 'clara'], tips: ['Mostre certificados', 'Use logos de autoridades'] },
  { id: 'authority-a', triggerId: 'authority', vakType: 'A', template: '{nome}, {fonte} afirma que {estatística}. Quando especialistas falam assim, vale a pena escutar.', keywords: ['afirma', 'falam', 'escutar', 'especialistas'], tips: ['Cite quotes de especialistas', 'Use tom de expertise'] },
  { id: 'authority-k', triggerId: 'authority', vakType: 'K', template: '{nome}, pega essa: {fonte} comprovou que {estatística}. Você sente a solidez dessa base?', keywords: ['pega', 'comprovou', 'sente', 'solidez'], tips: ['Transmita segurança', 'Use linguagem de fundação'] },

  // Testimonial
  { id: 'testimonial-v', triggerId: 'testimonial', vakType: 'V', template: '{nome}, veja o que {cliente} mostrou nos resultados: {resultado}. A transformação é visível.', keywords: ['veja', 'mostrou', 'visível', 'transformação'], tips: ['Mostre antes/depois', 'Use fotos de clientes'] },
  { id: 'testimonial-a', triggerId: 'testimonial', vakType: 'A', template: '{nome}, escuta o que {cliente} me disse: "{depoimento}". Palavras que falam por si.', keywords: ['escuta', 'disse', 'palavras', 'falam'], tips: ['Grave depoimentos em áudio', 'Use citações diretas'] },
  { id: 'testimonial-k', triggerId: 'testimonial', vakType: 'K', template: '{nome}, {cliente} sentiu na pele: {resultado}. A experiência deles pode ser sua.', keywords: ['sentiu', 'pele', 'experiência', 'sua'], tips: ['Descreva a experiência', 'Use linguagem sensorial'] },

  // ========== EMOCIONAL ==========
  // Storytelling
  { id: 'storytelling-v', triggerId: 'storytelling', vakType: 'V', template: '{nome}, deixa eu te pintar um cenário: {cliente} estava assim... Veja como a história se desenrolou.', keywords: ['pintar', 'cenário', 'veja', 'desenrolou'], tips: ['Use metáforas visuais', 'Descreva cenas'] },
  { id: 'storytelling-a', triggerId: 'storytelling', vakType: 'A', template: '{nome}, deixa eu te contar uma história: {cliente} me disse... Escuta como isso soa familiar.', keywords: ['contar', 'disse', 'escuta', 'soa'], tips: ['Use diálogos', 'Varie o tom da narrativa'] },
  { id: 'storytelling-k', triggerId: 'storytelling', vakType: 'K', template: '{nome}, vou te levar numa jornada: {cliente} sentiu exatamente isso... Você vai se conectar.', keywords: ['jornada', 'sentiu', 'conectar', 'levar'], tips: ['Crie experiência imersiva', 'Use pausas dramáticas'] },

  // Empathy
  { id: 'empathy-v', triggerId: 'empathy', vakType: 'V', template: '{nome}, eu vejo claramente a situação que você está passando. A perspectiva que você tem faz total sentido.', keywords: ['vejo', 'claramente', 'perspectiva', 'situação'], tips: ['Mostre que enxerga o problema', 'Valide a visão do cliente'] },
  { id: 'empathy-a', triggerId: 'empathy', vakType: 'A', template: '{nome}, eu ouço você. O que você está me dizendo ressoa muito - já escutei isso de outros também.', keywords: ['ouço', 'dizendo', 'ressoa', 'escutei'], tips: ['Demonstre escuta ativa', 'Repita o que ouviu'] },
  { id: 'empathy-k', triggerId: 'empathy', vakType: 'K', template: '{nome}, eu sinto o peso do que você está passando. Consigo tocar nessa dor porque já vivi isso.', keywords: ['sinto', 'peso', 'tocar', 'dor'], tips: ['Mostre vulnerabilidade', 'Conecte emocionalmente'] },

  // Future Pacing
  { id: 'future_pacing-v', triggerId: 'future_pacing', vakType: 'V', template: '{nome}, feche os olhos e visualize: daqui 6 meses, você olha para os resultados e vê...', keywords: ['visualize', 'olha', 'vê', 'olhos'], tips: ['Guie visualização', 'Use descrições vívidas'] },
  { id: 'future_pacing-a', triggerId: 'future_pacing', vakType: 'A', template: '{nome}, imagine-se daqui 6 meses, ouvindo seu time dizer: "conseguimos!" O som do sucesso.', keywords: ['imagine', 'ouvindo', 'dizer', 'som'], tips: ['Crie diálogos futuros', 'Use sons de celebração'] },
  { id: 'future_pacing-k', triggerId: 'future_pacing', vakType: 'K', template: '{nome}, sinta agora como vai ser daqui 6 meses: a sensação de conquista, o peso saindo dos ombros...', keywords: ['sinta', 'sensação', 'peso', 'conquista'], tips: ['Evoque sensações físicas', 'Use relaxamento guiado'] },

  // ========== LÓGICA ==========
  // Specificity
  { id: 'specificity-v', triggerId: 'specificity', vakType: 'V', template: '{nome}, olha esses números: {dados}. O quadro que se forma é claro e objetivo.', keywords: ['olha', 'números', 'quadro', 'claro'], tips: ['Use tabelas e gráficos', 'Destaque visualmente os dados'] },
  { id: 'specificity-a', triggerId: 'specificity', vakType: 'A', template: '{nome}, deixa eu explicar com precisão: {dados}. Faz sentido quando você ouve assim?', keywords: ['explicar', 'precisão', 'ouve', 'sentido'], tips: ['Explique passo a passo', 'Faça perguntas de confirmação'] },
  { id: 'specificity-k', triggerId: 'specificity', vakType: 'K', template: '{nome}, vou te dar algo concreto: {dados}. Sinta o peso desses números - são reais.', keywords: ['concreto', 'sinta', 'peso', 'reais'], tips: ['Torne os dados tangíveis', 'Use exemplos práticos'] },

  // Guarantee
  { id: 'guarantee-v', triggerId: 'guarantee', vakType: 'V', template: '{nome}, veja nossa garantia por escrito: {garantia}. Está claro e transparente - sem letras miúdas.', keywords: ['veja', 'escrito', 'claro', 'transparente'], tips: ['Mostre o documento', 'Use selos visuais'] },
  { id: 'guarantee-a', triggerId: 'guarantee', vakType: 'A', template: '{nome}, escuta bem: {garantia}. Quando digo isso, é minha palavra - você pode confiar no que está ouvindo.', keywords: ['escuta', 'digo', 'palavra', 'ouvindo'], tips: ['Fale com convicção', 'Use tom de promessa'] },
  { id: 'guarantee-k', triggerId: 'guarantee', vakType: 'K', template: '{nome}, sinta a segurança: {garantia}. Você pode relaxar - não há risco, só conforto.', keywords: ['sinta', 'segurança', 'relaxar', 'conforto'], tips: ['Transmita tranquilidade', 'Use linguagem de proteção'] },

  // ========== NOVOS TRIGGERS ESTENDIDOS ==========
  // Priming
  { id: 'priming-v', triggerId: 'priming', vakType: 'V', template: '{nome}, antes de mostrar a proposta, olha essa imagem de sucesso: {referência}. Agora veja o que preparei...', keywords: ['olha', 'imagem', 'veja', 'mostrar'], tips: ['Use imagens inspiradoras antes', 'Crie contexto visual positivo'] },
  { id: 'priming-a', triggerId: 'priming', vakType: 'A', template: '{nome}, falando em resultados extraordinários... ouvi algo que vai ressoar com você: {referência}. Agora...', keywords: ['falando', 'ouvi', 'ressoar', 'resultados'], tips: ['Use palavras de sucesso antes', 'Crie atmosfera sonora positiva'] },
  { id: 'priming-k', triggerId: 'priming', vakType: 'K', template: '{nome}, sinta essa energia de conquista: {referência}. Com isso em mente, vamos tocar no que importa...', keywords: ['sinta', 'energia', 'tocar', 'conquista'], tips: ['Evoque sensações positivas primeiro', 'Crie estado emocional receptivo'] },

  // Anchoring
  { id: 'anchoring-v', triggerId: 'anchoring', vakType: 'V', template: '{nome}, veja o panorama: empresas pagam até R$ {valor_alto} por isso. Agora olha nosso investimento: R$ {valor}. A diferença é visível.', keywords: ['veja', 'panorama', 'olha', 'visível'], tips: ['Mostre comparativo visual', 'Use cores de destaque'] },
  { id: 'anchoring-a', triggerId: 'anchoring', vakType: 'A', template: '{nome}, escuta esses valores: mercado cobra R$ {valor_alto}. Agora ouve o nosso: R$ {valor}. Soa diferente, né?', keywords: ['escuta', 'valores', 'ouve', 'soa'], tips: ['Enfatize a diferença na voz', 'Use pausas entre valores'] },
  { id: 'anchoring-k', triggerId: 'anchoring', vakType: 'K', template: '{nome}, sinta o peso: mercado pede R$ {valor_alto}. Agora segura nosso valor: R$ {valor}. Leve, né?', keywords: ['sinta', 'peso', 'segura', 'leve'], tips: ['Use metáforas de peso', 'Faça o valor parecer "manuseável"'] },

  // Curiosity Gap
  { id: 'curiosity_gap-v', triggerId: 'curiosity_gap', vakType: 'V', template: '{nome}, você ainda não viu o que descobrimos... Quando eu mostrar, sua perspectiva vai mudar completamente.', keywords: ['viu', 'mostrar', 'perspectiva', 'descobrimos'], tips: ['Crie suspense visual', 'Prometa revelação'] },
  { id: 'curiosity_gap-a', triggerId: 'curiosity_gap', vakType: 'A', template: '{nome}, ainda não te contei a parte mais interessante... Quando você ouvir, tudo vai fazer sentido.', keywords: ['contei', 'ouvir', 'interessante', 'sentido'], tips: ['Use tom misterioso', 'Prometa informação valiosa'] },
  { id: 'curiosity_gap-k', triggerId: 'curiosity_gap', vakType: 'K', template: '{nome}, você ainda não experimentou o que tenho guardado... Quando sentir, vai entender por que estou animado.', keywords: ['experimentou', 'sentir', 'guardado', 'animado'], tips: ['Crie expectativa tátil', 'Prometa experiência'] },

  // Unity
  { id: 'unity-v', triggerId: 'unity', vakType: 'V', template: '{nome}, como {identidade}, você enxerga o mercado de um ângulo que poucos veem. Eu vejo isso também.', keywords: ['enxerga', 'ângulo', 'vejo', 'veem'], tips: ['Compartilhe a mesma visão', 'Use "nós vemos"'] },
  { id: 'unity-a', triggerId: 'unity', vakType: 'A', template: '{nome}, nós, {identidade}, falamos a mesma língua. Quando você diz isso, eu entendo perfeitamente.', keywords: ['falamos', 'língua', 'diz', 'entendo'], tips: ['Use jargão do grupo', 'Valide a linguagem comum'] },
  { id: 'unity-k', triggerId: 'unity', vakType: 'K', template: '{nome}, como {identidade}, a gente sente as mesmas dores. Essa conexão é real - estamos juntos nisso.', keywords: ['sente', 'dores', 'conexão', 'juntos'], tips: ['Compartilhe experiências', 'Crie vínculo emocional'] },

  // Endowment Effect
  { id: 'endowment_effect-v', triggerId: 'endowment_effect', vakType: 'V', template: '{nome}, olha: isso aqui já é seu. Veja como ficou personalizado para vocês - consegue se ver usando?', keywords: ['olha', 'veja', 'ver', 'personalizado'], tips: ['Mostre já configurado', 'Use nome/logo do cliente'] },
  { id: 'endowment_effect-a', triggerId: 'endowment_effect', vakType: 'A', template: '{nome}, escuta: isso já é seu. Me conta - como soa ter isso à disposição quando precisar?', keywords: ['escuta', 'seu', 'conta', 'soa'], tips: ['Fale como se já fosse dele', 'Pergunte sobre uso'] },
  { id: 'endowment_effect-k', triggerId: 'endowment_effect', vakType: 'K', template: '{nome}, segura isso: já é seu. Sinta a sensação de ter isso na mão, pronto para usar quando quiser.', keywords: ['segura', 'sinta', 'mão', 'sensação'], tips: ['Faça "pegar" o produto', 'Use linguagem de posse'] },

  // Loss Aversion
  { id: 'loss_aversion-v', triggerId: 'loss_aversion', vakType: 'V', template: '{nome}, imagine ver seus números caindo: R$ {valor}/mês escorrendo pelo ralo. Consegue visualizar isso?', keywords: ['imagine', 'ver', 'visualizar', 'números'], tips: ['Mostre gráficos de queda', 'Use vermelho'] },
  { id: 'loss_aversion-a', triggerId: 'loss_aversion', vakType: 'A', template: '{nome}, escuta: cada dia custa R$ {valor}. Ouve o barulho do dinheiro indo embora? Silêncio onde deveria haver lucro.', keywords: ['escuta', 'ouve', 'barulho', 'silêncio'], tips: ['Use metáforas sonoras', 'Crie contraste'] },
  { id: 'loss_aversion-k', triggerId: 'loss_aversion', vakType: 'K', template: '{nome}, sinta o peso dessa perda: R$ {valor}/mês. Dói, não dói? É dinheiro que você pode parar de perder.', keywords: ['sinta', 'peso', 'dói', 'perda'], tips: ['Faça a perda ser física', 'Use dor como motivador'] },

  // Contrast Principle
  { id: 'contrast_principle-v', triggerId: 'contrast_principle', vakType: 'V', template: '{nome}, veja a diferença: cenário A (sem nós) vs cenário B (conosco). O contraste é gritante - você consegue ver?', keywords: ['veja', 'diferença', 'contraste', 'ver'], tips: ['Mostre lado a lado', 'Use cores contrastantes'] },
  { id: 'contrast_principle-a', triggerId: 'contrast_principle', vakType: 'A', template: '{nome}, escuta os dois cenários: sem nós você ouve reclamações. Conosco, aplausos. Qual som prefere?', keywords: ['escuta', 'cenários', 'ouve', 'som'], tips: ['Crie contraste sonoro', 'Use onomatopeias'] },
  { id: 'contrast_principle-k', triggerId: 'contrast_principle', vakType: 'K', template: '{nome}, sinta a diferença: de um lado, estresse pesado. Do outro, leveza. Qual sensação você quer carregar?', keywords: ['sinta', 'diferença', 'pesado', 'leveza'], tips: ['Contraste sensações', 'Use peso vs leveza'] },

  // Pattern Interrupt
  { id: 'pattern_interrupt-v', triggerId: 'pattern_interrupt', vakType: 'V', template: '{nome}, para tudo! Olha isso aqui - aposto que você nunca viu nada parecido. Deixa eu te mostrar.', keywords: ['para', 'olha', 'viu', 'mostrar'], tips: ['Use visual impactante', 'Quebre a expectativa visual'] },
  { id: 'pattern_interrupt-a', triggerId: 'pattern_interrupt', vakType: 'A', template: '{nome}, espera! Antes de você dizer qualquer coisa, preciso que escute isso por 30 segundos.', keywords: ['espera', 'dizer', 'escute', 'segundos'], tips: ['Mude o tom abruptamente', 'Peça atenção total'] },
  { id: 'pattern_interrupt-k', triggerId: 'pattern_interrupt', vakType: 'K', template: '{nome}, segura aí! Antes de sentir que já sabe a resposta, experimenta algo diferente comigo.', keywords: ['segura', 'sentir', 'experimenta', 'diferente'], tips: ['Quebre o padrão físico', 'Proponha ação inesperada'] },

  // Identity Shift
  { id: 'identity_shift-v', triggerId: 'identity_shift', vakType: 'V', template: '{nome}, você se vê como líder ou seguidor? A imagem que você projeta define os resultados que atrai.', keywords: ['vê', 'imagem', 'projeta', 'líder'], tips: ['Mostre a identidade visualmente', 'Use espelhamento'] },
  { id: 'identity_shift-a', triggerId: 'identity_shift', vakType: 'A', template: '{nome}, como você se define? Quando você diz "sou [identidade]", o mundo ouve e responde.', keywords: ['define', 'diz', 'sou', 'ouve'], tips: ['Use autodeclaração', 'Faça cliente verbalizar'] },
  { id: 'identity_shift-k', triggerId: 'identity_shift', vakType: 'K', template: '{nome}, você sente que é do tipo que lidera ou que segue? Esse sentimento determina seu impacto.', keywords: ['sente', 'tipo', 'sentimento', 'impacto'], tips: ['Conecte identidade a sensação', 'Use linguagem de essência'] },

  // Tribal Belonging
  { id: 'tribal_belonging-v', triggerId: 'tribal_belonging', vakType: 'V', template: '{nome}, veja quem está no nosso grupo: {referências}. A imagem é clara - são os melhores. Você se vê aqui?', keywords: ['veja', 'grupo', 'imagem', 'vê'], tips: ['Mostre o "clube"', 'Use fotos de membros'] },
  { id: 'tribal_belonging-a', triggerId: 'tribal_belonging', vakType: 'A', template: '{nome}, escuta o que os membros dizem: "{quote}". O tom é de sucesso. Quer ser parte dessa conversa?', keywords: ['escuta', 'dizem', 'tom', 'conversa'], tips: ['Compartilhe vozes do grupo', 'Use linguagem de insider'] },
  { id: 'tribal_belonging-k', triggerId: 'tribal_belonging', vakType: 'K', template: '{nome}, sinta a energia do grupo: {referências}. A conexão é real. Você pertence aqui - você sente?', keywords: ['sinta', 'energia', 'conexão', 'pertence'], tips: ['Crie senso de pertencimento', 'Use linguagem inclusiva'] },

  // Cognitive Ease
  { id: 'cognitive_ease-v', triggerId: 'cognitive_ease', vakType: 'V', template: '{nome}, olha como é simples: {passos}. Você vê? Um clique e pronto. Claro e direto.', keywords: ['olha', 'simples', 'vê', 'claro'], tips: ['Mostre interface clean', 'Use poucos elementos'] },
  { id: 'cognitive_ease-a', triggerId: 'cognitive_ease', vakType: 'A', template: '{nome}, escuta como é fácil: {passos}. Soa simples, não soa? Porque é.', keywords: ['escuta', 'fácil', 'soa', 'simples'], tips: ['Use linguagem simples', 'Fale devagar e claro'] },
  { id: 'cognitive_ease-k', triggerId: 'cognitive_ease', vakType: 'K', template: '{nome}, sinta a facilidade: {passos}. Leve, sem peso, sem complicação. Você pode relaxar.', keywords: ['sinta', 'facilidade', 'leve', 'relaxar'], tips: ['Transmita tranquilidade', 'Use ritmo calmo'] },

  // Double Bind
  { id: 'paradox_double_bind-v', triggerId: 'paradox_double_bind', vakType: 'V', template: '{nome}, olha as opções: A ou B? Qual você se vê escolhendo?', keywords: ['olha', 'opções', 'vê', 'escolhendo'], tips: ['Mostre as opções lado a lado', 'Ambas visualmente atraentes'] },
  { id: 'paradox_double_bind-a', triggerId: 'paradox_double_bind', vakType: 'A', template: '{nome}, me diz: prefere A ou B? O que soa melhor pra você?', keywords: ['diz', 'prefere', 'soa', 'melhor'], tips: ['Apresente as opções claramente', 'Pergunte preferência'] },
  { id: 'paradox_double_bind-k', triggerId: 'paradox_double_bind', vakType: 'K', template: '{nome}, sinta as duas opções: A tem essa sensação, B tem essa. Qual te pega mais?', keywords: ['sinta', 'opções', 'sensação', 'pega'], tips: ['Dê peso emocional a cada opção', 'Use linguagem de preferência'] },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getVAKTemplatesForTrigger(triggerId: string, vakType: VAKType): VAKTriggerTemplate[] {
  return VAK_TRIGGER_TEMPLATES.filter(t => t.triggerId === triggerId && t.vakType === vakType);
}

export function getVAKKeywords(vakType: VAKType): string[] {
  const keywordSets: Record<VAKType, string[]> = {
    V: ['veja', 'olha', 'visualize', 'imagine', 'claro', 'brilhante', 'perspectiva', 'foco', 'imagem', 'aparência', 'mostre', 'observe'],
    A: ['escuta', 'ouça', 'diga', 'soa', 'ressoa', 'silêncio', 'barulho', 'tom', 'voz', 'fale', 'conte', 'explique'],
    K: ['sinta', 'toque', 'pegue', 'peso', 'leve', 'pesado', 'confortável', 'firme', 'suave', 'pressão', 'energia', 'sensação'],
    D: ['analise', 'processo', 'sistema', 'lógica', 'dados', 'estrutura', 'metodologia', 'padrão', 'conceito', 'categoria'],
  };
  return keywordSets[vakType];
}

export function adaptTemplateToVAK(template: string, vakType: VAKType): string {
  const replacements: Record<VAKType, Record<string, string>> = {
    V: { 
      'entenda': 'veja', 
      'perceba': 'observe', 
      'considere': 'visualize',
      'pense': 'imagine',
      'note': 'olhe'
    },
    A: { 
      'veja': 'escute', 
      'olhe': 'ouça', 
      'visualize': 'escute como soa',
      'imagine': 'pense em como soa',
      'observe': 'perceba o tom'
    },
    K: { 
      'veja': 'sinta', 
      'olhe': 'toque', 
      'visualize': 'experimente',
      'imagine': 'sinta como seria',
      'escute': 'sinta a energia'
    },
    D: { 
      'veja': 'analise', 
      'olhe': 'examine', 
      'visualize': 'processe',
      'imagine': 'considere logicamente',
      'escute': 'avalie os dados'
    },
  };
  
  let adapted = template;
  Object.entries(replacements[vakType]).forEach(([from, to]) => {
    adapted = adapted.replace(new RegExp(from, 'gi'), to);
  });
  
  return adapted;
}
