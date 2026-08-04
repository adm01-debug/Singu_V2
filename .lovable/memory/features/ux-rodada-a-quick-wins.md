---
name: Quick Wins UX (Rodada A)
description: Onboarding 7 marcos, View Transitions+celebrações, densidade global e WhyScoreDrawer reutilizável
type: feature
---

# Rodada A — Quick Wins de Product Design (Fev 2026)

## Entregas

1. **Onboarding "Primeiros 7 Dias"** — `OnboardingChecklist` expandido para 7 marcos
   (perfil, empresa, contato, interação, deal, lead score, sequência) com:
   - Grid responsivo 2/4/7 colunas
   - Auto-collapse após 4 marcos
   - Celebração via `celebrate()` ao completar 7 (uma única vez, persistida em
     `singu_onboarding_celebrated_v2`)
   - Trofeu visual quando ≥5 marcos concluídos

2. **View Transitions + Celebrações** —
   - `useViewTransitions()` hook em `AnimatedRoutes` ativa `data-vt-active` no
     html durante mudança de rota; respeita `prefers-reduced-motion`
   - CSS `@supports (view-transition-name)` registra fade/slide suave
   - `lib/celebrate.ts` dispara confetti CSS-only + toast premium para
     marcos: `deal-won | goal-reached | streak | level-up | milestone`

3. **Densidade Global (Theme System v2)** —
   - `useGlobalDensity()` persiste em `singu-global-density-v1`
   - Aplica `html.density-compact` que reduz padding/gap de elementos com
     `[data-density-aware]`
   - `<GlobalDensityToggle />` no Header (desktop) — independente do toggle
     interno do Intelligence Hub

4. **WhyScoreDrawer reutilizável** —
   - `src/components/intelligence/WhyScoreDrawer.tsx`
   - Drawer universal com: gauge 0-100, banda (low/mid/high), fatores
     ponderados ordenados por impacto, recomendações e feedback loop 👍/👎
   - Feedback persistido em `singu-score-feedback-v1` por `scoreKey`
     (formato `<modulo>:<entidade>:<id>`) — base para retraining local

## Arquitetura

- Sem novos backends, sem dependências externas (confetti CSS puro)
- Tokens HSL semânticos preservados (sucesso/aviso/destrutivo)
- Acessibilidade: `prefers-reduced-motion` desativa confetti e VT
- Constraints: max 400 linhas por arquivo, sem `any`, TanStack Query intacto

## Próximas rodadas planejadas

- **Rodada B (Game Changers)**: Command Bar global ⌘K unificada, Daily
  Briefing IA ao login, Saved Views compartilháveis
- **Rodada C (Transformação)**: `/inbox` unificada, Workspace Modes, Bulk
  Actions universais, Keyboard-first nav, Mobile audit
