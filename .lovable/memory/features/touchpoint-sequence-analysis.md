---
name: Touchpoint Sequence Analysis
description: Análise de sequências temporais de canais (ex: Email→WhatsApp→Call) que mais convertem deals, com filtro por tamanho 2-5
type: feature
---
Card no Dashboard→Inteligência (`TouchpointSequenceCard`) que extrai a ordem cronológica dos primeiros canais únicos usados em cada deal fechado (won/lost) nos últimos 180d e calcula taxa de conversão por sequência. Hook `useTouchpointSequences` agrupa interactions por contact_id (já ordenadas asc), monta sequência canônica de até 5 toques únicos entre `created_at` (-7d tolerância) e `closed_at` (+1d). Para cada deal gera sub-sequências de prefixo de tamanho 2..N e agrega total/won/lost/winRate/avgTicket. Filtro UI 2/3/4/5 toques. Ranking top 5 por sequência (mín 3 deals), badge "🏆 Top" no #1, insight global = melhor winRate (mín 3 deals). Empty state se <10 deals fechados. StaleTime 15min.
