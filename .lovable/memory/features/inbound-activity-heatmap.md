---
name: Inbound Activity Heatmap
description: Heatmap 7×17 no Dashboard→Inteligência mostrando quando clientes iniciam contato (initiated_by='them') últimos 90d, com toggle de canal (WhatsApp/Email/Call), top 3 picos, stat cards e insight textual
type: feature
---
Card `InboundActivityHeatmapCard` ao lado do `BestTimeHeatmapCard` na aba Inteligência. Hook `useInboundActivityHeatmap(channel)` agrega `interactions` últimos 90d com `initiated_by='them'` e filtro opcional por tipo (whatsapp/email/call/all). Grid dom-sáb × 6h-22h colorido por intensidade relativa ao máximo (gradiente primary). Top 3 picos destacados com ring warning + badge "#N". Stat cards: total, dia top, hora top. Insight textual sugere janela ideal de disponibilidade. Empty state se total <10. 100% client-side, sem edge function. Diferencia-se do `BestTimeHeatmapCard` (outbound→resposta) e `ActivityHeatmapChart` (volume bruto) por focar exclusivamente em sinais inbound de intenção do cliente.
