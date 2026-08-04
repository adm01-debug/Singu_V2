// ============================================
// UX MESSAGES - Mensagens Variadas e Empáticas
// ============================================

// Loading Messages por contexto
export const loadingMessages = {
  dashboard: [
    "Carregando seu dashboard...",
    "Preparando seus insights...",
    "Buscando suas métricas...",
    "Montando seu panorama...",
    "Organizando seus dados...",
  ],
  contacts: [
    "Carregando seus contatos...",
    "Buscando relacionamentos...",
    "Preparando a lista...",
    "Atualizando informações...",
    "Sincronizando dados...",
  ],
  companies: [
    "Carregando empresas...",
    "Buscando organizações...",
    "Preparando dados corporativos...",
    "Atualizando portfólio...",
  ],
  interactions: [
    "Carregando interações...",
    "Buscando histórico...",
    "Preparando timeline...",
    "Sincronizando conversas...",
  ],
  analytics: [
    "Processando análises...",
    "Calculando métricas...",
    "Gerando insights...",
    "Analisando tendências...",
    "Preparando relatórios...",
  ],
  calendar: [
    "Carregando agenda...",
    "Buscando eventos...",
    "Preparando calendário...",
    "Sincronizando datas...",
  ],
  network: [
    "Carregando rede...",
    "Mapeando conexões...",
    "Visualizando relacionamentos...",
  ],
  general: [
    "Carregando...",
    "Um momento...",
    "Preparando...",
    "Processando...",
    "Quase lá...",
  ],
};

// Success Messages variadas
export const successMessages = {
  save: [
    "Salvo com sucesso! ✓",
    "Dados salvos! ✓",
    "Alterações salvas! ✓",
    "Tudo salvo! ✓",
    "Pronto! Dados salvos ✓",
  ],
  create: [
    "Criado com sucesso! 🎉",
    "Novo registro adicionado! ✓",
    "Adicionado com sucesso! ✓",
    "Criação concluída! 🎉",
  ],
  update: [
    "Atualizado com sucesso! ✓",
    "Alterações aplicadas! ✓",
    "Dados atualizados! ✓",
    "Modificações salvas! ✓",
  ],
  delete: [
    "Removido com sucesso",
    "Exclusão concluída",
    "Registro removido",
    "Operação concluída",
  ],
  send: [
    "Enviado com sucesso! ✓",
    "Mensagem enviada! ✓",
    "Envio concluído! ✓",
  ],
  copy: [
    "Copiado para a área de transferência! 📋",
    "Texto copiado! 📋",
    "Copiado! ✓",
  ],
  favorite: [
    "Adicionado aos favoritos! ⭐",
    "Favoritado! ⭐",
    "Marcado como favorito! ⭐",
  ],
  unfavorite: [
    "Removido dos favoritos",
    "Favorito removido",
    "Desmarcado",
  ],
};

// Error Messages empáticas
export const errorMessages = {
  network: [
    "Ops! Problema de conexão. Verificando...",
    "Não conseguimos conectar. Tentando novamente...",
    "Falha na conexão. Vamos tentar mais uma vez?",
    "Conexão instável. Por favor, aguarde...",
  ],
  save: [
    "Não foi possível salvar. Tentando novamente...",
    "Erro ao salvar. Vamos tentar de novo?",
    "Ops! Falha ao salvar. Verificando...",
  ],
  load: [
    "Não conseguimos carregar os dados. Tentando...",
    "Erro ao buscar informações. Aguarde...",
    "Falha ao carregar. Vamos tentar novamente...",
  ],
  auth: [
    "Sessão expirada. Faça login novamente.",
    "Sua sessão terminou. Por favor, reconecte.",
    "Precisamos que você faça login novamente.",
  ],
  permission: [
    "Você não tem permissão para esta ação.",
    "Acesso negado a este recurso.",
    "Esta ação requer permissões adicionais.",
  ],
  validation: [
    "Alguns campos precisam de atenção.",
    "Por favor, verifique os dados informados.",
    "Há informações que precisam ser corrigidas.",
  ],
  generic: [
    "Algo deu errado. Estamos verificando...",
    "Ops! Um erro inesperado ocorreu.",
    "Encontramos um problema. Tentando resolver...",
    "Erro inesperado. Por favor, tente novamente.",
  ],
};

// Empty State Messages
export const emptyStateMessages = {
  contacts: {
    title: "Nenhum contato encontrado",
    descriptions: [
      "Comece adicionando seu primeiro contato!",
      "Sua lista de contatos está vazia. Vamos começar?",
      "Adicione contatos para começar a construir relacionamentos.",
    ],
  },
  companies: {
    title: "Nenhuma empresa encontrada",
    descriptions: [
      "Adicione sua primeira empresa para começar!",
      "Sua lista de empresas está vazia.",
      "Comece cadastrando uma empresa.",
    ],
  },
  interactions: {
    title: "Nenhuma interação registrada",
    descriptions: [
      "Registre sua primeira interação!",
      "Comece a documentar suas conversas.",
      "Adicione interações para acompanhar seus relacionamentos.",
    ],
  },
  search: {
    title: "Nenhum resultado encontrado",
    descriptions: [
      "Tente termos diferentes ou menos específicos.",
      "Ajuste sua busca para encontrar mais resultados.",
      "Nenhum item corresponde à sua pesquisa.",
    ],
  },
};

// Greeting Messages
export const greetingMessages = {
  morning: [
    "Bom dia",
    "Ótima manhã",
    "Bom dia, que tal um café",
  ],
  afternoon: [
    "Boa tarde",
    "Ótima tarde",
    "Boa tarde, como está indo",
  ],
  evening: [
    "Boa noite",
    "Boa noite, finalizando o dia",
  ],
};

// Helper functions
export function getRandomMessage<T>(messages: T[]): T {
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getLoadingMessage(context: keyof typeof loadingMessages = 'general'): string {
  const messages = loadingMessages[context] || loadingMessages.general;
  return getRandomMessage(messages);
}

export function getSuccessMessage(type: keyof typeof successMessages = 'save'): string {
  const messages = successMessages[type] || successMessages.save;
  return getRandomMessage(messages);
}

export function getErrorMessage(type: keyof typeof errorMessages = 'generic'): string {
  const messages = errorMessages[type] || errorMessages.generic;
  return getRandomMessage(messages);
}

export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let period: keyof typeof greetingMessages;
  
  if (hour < 12) {
    period = 'morning';
  } else if (hour < 18) {
    period = 'afternoon';
  } else {
    period = 'evening';
  }
  
  const greeting = getRandomMessage(greetingMessages[period]);
  return name ? `${greeting}, ${name}!` : `${greeting}!`;
}

export function getEmptyStateMessage(type: keyof typeof emptyStateMessages) {
  const state = emptyStateMessages[type];
  return {
    title: state.title,
    description: getRandomMessage(state.descriptions),
  };
}
