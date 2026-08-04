---
name: Email Builder Visual
description: Editor de email por blocos (heading/text/button/image/divider/spacer) com preview iframe e exportação para HTML+texto, integrado em Campanhas e Landing Pages
type: feature
---
- Tipos em `src/components/email-builder/types.ts` (EmailBlock discriminated union, factory `createBlock`)
- Renderer em `src/lib/emailBuilderRenderer.ts` produz HTML inline-styled compatível com clientes de email + versão texto
- Componente `EmailBuilder` (3 colunas: paleta · canvas com tabs Visual/Preview/HTML · inspector) — preview via iframe `sandbox=""`
- Integrado no diálogo "Nova Campanha" (`/campanhas`) com tabs Editor visual / Apenas texto — salva `content_html` + `content_text`
- Reutilizado pelo módulo de Landing Pages para o corpo da página
