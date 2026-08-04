---
name: Landing Pages Module
description: Módulo de landing pages com builder de blocos visuais, slug público em /lp/:slug, captura de leads com UTMs e RLS por dono
type: feature
---
- Tabelas: `landing_pages` (slug único, blocks jsonb, theme, is_published, view_count, submission_count, redirect_url) e `landing_page_submissions` (name/email/phone, utm_*, data jsonb, user_agent)
- RLS: donos gerenciam suas páginas e veem submissions; público lê apenas páginas `is_published=true` e pode inserir submissions só em páginas publicadas (validação por subquery)
- Hook `useLandingPages` (CRUD + togglePublish) e `useLandingPageSubmissions(pageId)`
- Página admin `/landing-pages` com stats, lista, switch publicar, botão copiar URL, drawer leads e drawer editor (reusa `EmailBuilder`)
- Página pública `/lp/:slug` (rota fora do RequireAuth) renderiza HTML em iframe sandbox + form de captura com persistência de UTMs vindos da query string e auto-incremento de view_count
