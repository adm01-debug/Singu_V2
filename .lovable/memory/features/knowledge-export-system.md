---
name: Knowledge Export System
description: Sistema de exportação de knowledge base para handoff em /admin/knowledge-export com preview, busca, filtros e export MD/JSON/PDF.
type: feature
---
- Página `/admin/knowledge-export` com preview de todas as seções de conhecimento
- Filtro por categorias (architecture, features, technical, standards, etc.)
- Busca full-text dentro das seções
- Exportação em 3 formatos: Markdown, JSON, PDF (via browser print)
- TOC lateral navegável com scroll
- Botão de cópia por seção
- HANDOFF.md na raiz do projeto: compilação estática para referência rápida
- Dados compilados client-side (sem edge function) a partir de constantes tipadas
- 22+ seções organizadas em 10 categorias
