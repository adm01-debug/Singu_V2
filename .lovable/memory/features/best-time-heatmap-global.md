---
name: Best Time Heatmap Global
description: Heatmap 7×17 global do vendedor com taxa de resposta de outbound vs inbound em 48h, top 3 slots e empty state em <20 attempts
type: feature
---
Card `BestTimeHeatmapCard` na aba Inteligência do Dashboard. Hook `useBestTimeHeatmap` agrega `interactions` últimos 90d: outbound = `initiated_by='us'`, resposta = inbound do mesmo `contact_id` em ≤48h após. Grid dom-sab × 6h-22h colorido por taxa (destructive→warning→success), opacity por volume. Top 3 slots exigem mín. 5 tentativas. Empty state se total <20. Tooltip nativo `title` por célula. 100% client-side, sem edge function.
