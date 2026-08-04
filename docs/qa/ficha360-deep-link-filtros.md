# Teste manual: Sincronização URL → UI dos filtros da Ficha 360

Roteiro de QA para validar que a seção "Últimas Interações" da Ficha 360 restaura corretamente o estado dos filtros (período e canais) a partir de query params na URL.

Componentes envolvidos:
- Hook: `src/hooks/useFicha360Filters.ts`
- UI: `src/components/ficha-360/FiltrosInteracoesBar.tsx`, `FiltrosAtivosChips.tsx`, `UltimasInteracoesCard.tsx`
- Página: `src/pages/Ficha360.tsx`

---

## 1. Pré-requisitos

- Estar autenticado na preview do projeto.
- Existir ao menos 1 contato acessível em `/contatos`.
- Copiar o UUID de um contato real e usá-lo no lugar de `<contactId>` nas URLs abaixo.
- Navegador moderno (Chrome/Edge/Firefox atualizado), DevTools disponível para inspecionar console.

---

## 2. Roteiro principal (caminho feliz)

### Passo 1 — Acessar o deep link

Abrir no navegador:

```
/ficha-360/<contactId>?periodo=7&canais=whatsapp,email
```

### Passo 2 — Validar seletor de período (`FiltrosInteracoesBar`)

Esperado:
- Botão `7d` ativo: classes `bg-primary text-primary-foreground` e `aria-pressed="true"`.
- Botões `30d`, `90d`, `1a` inativos: cor `text-muted-foreground` e `aria-pressed="false"`.

### Passo 3 — Validar seletor de canais (`FiltrosInteracoesBar`)

Esperado:
- Badge `WhatsApp`: variant `default`, `aria-pressed="true"`, ícone de mensagem visível.
- Badge `Email`: variant `default`, `aria-pressed="true"`, ícone de envelope visível.
- Badges `Ligação`, `Reunião`, `Nota`: variant `outline`, `aria-pressed="false"`.
- Botão `Todos os canais` visível (porque há ≥ 1 canal ativo).

### Passo 4 — Validar chips de filtros ativos (`FiltrosAtivosChips`)

Esperado:
- Chip `Período: 7d` com ícone calendário e botão `X` de fechar.
- Chip `WhatsApp` com ícone de mensagem e botão `X`.
- Chip `Email` com ícone de envelope e botão `X`.
- Botão `Limpar tudo` visível à direita (porque há ≥ 2 chips).
- Contador no formato `<N> de <T> interação(ões)` reflete a contagem após filtragem.

### Passo 5 — Validar lista (`UltimasInteracoesCard`)

Esperado:
- Apenas interações dos últimos 7 dias com canal `whatsapp` ou `email`.
- Cada item mostra ícone do canal correto, título, sentimento (bullet colorido), canal, direção e data formatada `pt-BR`.
- Caso a query retorne vazio: empty state contextual com título "Nenhuma interação nos filtros" e descrição "Ajuste o período ou os canais selecionados acima."

---

## 3. Cenários complementares

### 3.1 Recarregar a página (F5)

Pressionar `F5` na URL do Passo 1. Os 4 pontos do roteiro principal devem permanecer idênticos. A URL é a fonte única de verdade — não deve haver perda de estado.

### 3.2 Voltar/avançar do navegador

A partir do estado do Passo 1:
1. Clicar no botão `30d` da barra (URL passa a `?periodo=30&canais=whatsapp,email`).
2. Pressionar o botão Voltar do navegador.

Esperado: URL volta a `?periodo=7&canais=whatsapp,email` e seletor + chips refletem `7d` novamente, sem reload manual.

### 3.3 Compartilhar o link (aba anônima logada)

1. Copiar a URL completa da barra do navegador no estado do Passo 1.
2. Abrir uma aba anônima, autenticar-se com o mesmo usuário, colar a URL.

Esperado: estado visual idêntico ao do Passo 1.

### 3.4 Remover chip pela UI

A partir do Passo 1, clicar no `X` do chip `Email`.

Esperado:
- URL passa a `?periodo=7&canais=whatsapp` (sem reload).
- Badge `Email` na barra volta para variant `outline`.
- Chip `Email` desaparece da lista de chips ativos.
- Lista re-filtra mantendo apenas interações de WhatsApp dos últimos 7 dias.

### 3.5 Clicar "Limpar tudo"

A partir do Passo 1, clicar no botão `Limpar tudo` à direita dos chips.

Esperado:
- URL perde `periodo` e `canais` (volta a `/ficha-360/<contactId>`).
- Seletor de período volta para `90d` ativo (default).
- Todos os badges de canal voltam para variant `outline`.
- Linha de chips ativos desaparece (ou mostra apenas o contador, se houver interações).

### 3.6 Comportamento esperado de "Limpar" / "Limpar tudo" (referência consolidada)

Tanto o botão `Limpar` da `FiltrosInteracoesBar` (visível quando `activeCount > 0`) quanto o botão `Limpar tudo` dos `FiltrosAtivosChips` (visível quando há ≥ 2 chips ativos) disparam o mesmo handler `clear()` do hook `useFicha360Filters`. Comportamento garantido em ambos os casos:

1. URL: remove apenas `periodo` e `canais`, preservando quaisquer outros query params eventualmente presentes.
2. Histórico: usa `replace: true` — não empilha entrada nova no histórico do navegador.
3. Período: `days` retorna a `90` (default) e o botão `90d` fica ativo no seletor.
4. Canais: `channels` retorna a `[]`, todos os badges voltam para variant `outline` e o botão `Todos os canais` deixa de ser exibido.
5. Chips + lista: a linha de chips ativos some (ou mantém apenas o contador `X de Y`), e a query `useFicha360` é refeita sem filtros, repopulando a lista com a janela padrão de 90 dias e todos os canais.

---

## 4. Casos de borda

### 4.1 Período inválido

URL: `?periodo=999`

Esperado: fallback para `90d` (default). Nenhum chip de período é exibido. Sem erro no console.

### 4.2 Canais vazios

URL: `?canais=` ou `?canais=,,,`

Esperado: tratado como nenhum canal ativo. Todos os badges `outline`, sem chips de canal, botão `Todos os canais` oculto.

### 4.3 Case misto

URL: `?canais=WHATSAPP,Email`

Esperado: normalizado para lowercase pelo hook. Badges `WhatsApp` e `Email` ficam ativos corretamente.

### 4.4 Canal desconhecido

URL: `?canais=invalido`

Esperado: nenhum badge fica ativo na barra (não há `invalido` em `CHANNEL_OPTIONS`). O chip em `FiltrosAtivosChips` exibe o label cru `invalido` com ícone genérico `FileText` (fallback atual). Sem erro no console.

---

## 5. Checklist de aprovação

Marcar cada item após validação visual:

- [ ] Botão `7d` ativo e demais inativos no seletor de período.
- [ ] Badges `WhatsApp` e `Email` ativos; `Ligação`, `Reunião`, `Nota` inativos.
- [ ] Chip `Período: 7d` presente com ícone calendário.
- [ ] Chips `WhatsApp` e `Email` presentes com ícones corretos.
- [ ] Contador `X de Y interação(ões)` exibido corretamente.
- [ ] Lista exibe apenas interações dos últimos 7 dias com canal whatsapp/email (ou empty state contextual).
- [ ] F5 preserva integralmente o estado do roteiro principal.
- [ ] Back/forward do navegador restaura o estado anterior dos filtros.
- [ ] Deep link aberto em aba anônima logada reproduz o mesmo estado.
- [ ] Remover chip via `X` atualiza URL, badge e lista sem reload.
- [ ] `Limpar tudo` reseta URL para limpa, período para `90d` e remove todos os chips.
- [ ] Casos de borda (período inválido, canais vazios, case misto, canal desconhecido) não geram erros no console.

---

## 6. Como reportar falha

Caso algum item falhe, abrir um report contendo:

- URL exata utilizada (com query params).
- Passo do roteiro em que a falha ocorreu.
- Valor esperado vs valor observado.
- Screenshot da barra de filtros + chips + topo da lista.
- Erros relevantes do console do navegador (DevTools > Console), se houver.
- Navegador e versão.
