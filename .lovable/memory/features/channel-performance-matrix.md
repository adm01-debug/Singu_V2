---
name: Channel Performance Matrix
description: Matriz canal × estágio do funil com taxa de avanço, tempo médio e canal vencedor por estágio
type: feature
---
Card no Dashboard→Inteligência (`ChannelPerformanceMatrixCard`) que cruza 4 canais (whatsapp/email/call/meeting) × 5 estágios (lead→fechamento) mostrando taxa de avanço de stage em até 30 dias após interação, total de interações e tempo médio em dias por célula. Hook `useChannelPerformanceMatrix` busca interactions locais (180d) + deals via external-data, normaliza canais por substring (whats/mail/call/meet) e estágios (lead/qualif/propos/negoc/fech). Heurística de stage no momento da interação: se deal.updated_at > interaction.created_at, assume stage anterior. Vencedor por estágio = maior taxa com mín 3 interações. Insight global = melhor cell com mín 5 interações que não esteja em "fechamento". Empty state se <30 interações totais. StaleTime 15min.
