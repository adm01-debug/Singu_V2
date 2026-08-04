import { AppLayout } from '@/components/layout/AppLayout';
import { Typography, Heading, DisplayText } from '@/components/ui/typography';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers3, Orbit, ShieldCheck, Sparkles, Zap } from 'lucide-react';

const nexusPalette = [
  {
    name: 'Glow',
    token: '--nexus-glow',
    swatchClassName: 'bg-nexus-glow',
    description: 'Luz principal e highlights do sistema.',
  },
  {
    name: 'Cyan',
    token: '--nexus-cyan',
    swatchClassName: 'bg-nexus-cyan',
    description: 'Acento tecnológico para foco e contraste.',
  },
  {
    name: 'Emerald',
    token: '--nexus-emerald',
    swatchClassName: 'bg-nexus-emerald',
    description: 'Estados positivos e saúde visual.',
  },
  {
    name: 'Amber',
    token: '--nexus-amber',
    swatchClassName: 'bg-nexus-amber',
    description: 'Avisos e atenção contextual.',
  },
  {
    name: 'Rose',
    token: '--nexus-rose',
    swatchClassName: 'bg-nexus-rose',
    description: 'Risco, erro e pontos críticos.',
  },
  {
    name: 'Teal',
    token: '--nexus-teal',
    swatchClassName: 'bg-nexus-teal',
    description: 'Suporte para variações de interface.',
  },
] as const;

const entityTokens = [
  { name: 'Contato', className: 'bg-entity-contact' },
  { name: 'Empresa', className: 'bg-entity-company' },
  { name: 'Interação', className: 'bg-entity-interaction' },
  { name: 'Insight', className: 'bg-entity-insight' },
] as const;

const utilityCards = [
  {
    title: 'nexus-card',
    description: 'Container premium para blocos de conteúdo principais.',
    badgeClassName: 'nexus-badge-primary',
    cardClassName: 'nexus-card',
    icon: Layers3,
  },
  {
    title: 'nexus-card-elevated',
    description: 'Elevação extra para áreas estratégicas e destaques.',
    badgeClassName: 'nexus-badge-info',
    cardClassName: 'nexus-card-elevated',
    icon: Sparkles,
  },
  {
    title: 'nexus-card-interactive',
    description: 'Feedback tátil e hover refinado para elementos clicáveis.',
    badgeClassName: 'nexus-badge-success',
    cardClassName: 'nexus-card-interactive',
    icon: Zap,
  },
] as const;

const motionCards = [
  {
    title: 'animate-card-enter',
    description: 'Entrada sutil para cards e módulos.',
    className: 'animate-card-enter nexus-card',
  },
  {
    title: 'animate-border-glow',
    description: 'Pulso de borda para estados de foco ou destaque.',
    className: 'animate-border-glow nexus-card',
  },
  {
    title: 'sidebar-active-glow',
    description: 'Glow lateral para navegação ativa.',
    className: 'sidebar-active-glow nexus-card',
  },
] as const;

const surfaceLevels = [0, 1, 2, 3, 4] as const;

function SwatchCard({
  name,
  token,
  swatchClassName,
  description,
}: {
  name: string;
  token: string;
  swatchClassName: string;
  description: string;
}) {
  return (
    <Surface level={1} bordered className="overflow-hidden rounded-2xl">
      <div className={`h-24 w-full ${swatchClassName}`} />
      <div className="space-y-2 p-4">
        <Typography variant="small" className="font-medium text-foreground">
          {name}
        </Typography>
        <Typography variant="caption" className="normal-case tracking-normal text-muted-foreground">
          {token}
        </Typography>
        <Typography variant="small">{description}</Typography>
      </div>
    </Surface>
  );
}

export default function DesignSystem() {
  return (
    <AppLayout title="Nexus Design System">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-strong md:p-10">
          <div className="pointer-events-none absolute inset-0 nexus-gradient-bg opacity-10" />
          <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative z-10 max-w-4xl space-y-5">
            <span className="nexus-badge-primary">Nexus Design System ativo</span>
            <div className="space-y-3">
              <DisplayText className="nexus-gradient-text">
                O visual legado saiu. Esta página agora é Nexus puro.
              </DisplayText>
              <Typography variant="lead" className="max-w-3xl text-muted-foreground">
                Mantive os tokens de domínio do SINGU e substituí a vitrine antiga por uma linguagem visual focada em
                Nexus: glow, glass, gradientes, motion e contraste premium.
              </Typography>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="nexus-btn-press">Primary action</Button>
              <Button variant="outline" className="nexus-btn-press">
                Secondary action
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <Typography variant="eyebrow">Palette</Typography>
            <Heading level={2}>Tokens Nexus que comandam a identidade</Heading>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {nexusPalette.map((color) => (
              <SwatchCard key={color.token} {...color} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Surface level={1} bordered className="rounded-[2rem] p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <Typography variant="eyebrow">Merge preservado</Typography>
                <Heading level={2}>Tokens de domínio do SINGU continuam vivos</Heading>
                <Typography variant="small">
                  Roles, entities, surfaces e glass seguem intactos — só a camada visual antiga foi removida.
                </Typography>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <Typography variant="small" className="font-medium text-foreground">
                  Roles
                </Typography>
                <div className="flex flex-wrap gap-2">
                  <span className="role-owner rounded-full border px-3 py-1 text-xs font-medium">Owner</span>
                  <span className="role-manager rounded-full border px-3 py-1 text-xs font-medium">Manager</span>
                  <span className="role-buyer rounded-full border px-3 py-1 text-xs font-medium">Buyer</span>
                  <span className="role-contact rounded-full border px-3 py-1 text-xs font-medium">Contact</span>
                </div>
              </div>

              <div className="space-y-3">
                <Typography variant="small" className="font-medium text-foreground">
                  Entities
                </Typography>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {entityTokens.map((entity) => (
                    <div key={entity.name} className="rounded-2xl border border-border p-3">
                      <div className={`h-12 rounded-xl ${entity.className}`} />
                      <Typography variant="caption" className="mt-2 block normal-case tracking-normal">
                        {entity.name}
                      </Typography>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Surface>

          <Surface level={1} bordered className="rounded-[2rem] p-6 md:p-8">
            <Typography variant="eyebrow">Surfaces + Glass</Typography>
            <Heading level={2} className="mt-2">
              Escada de profundidade Nexus
            </Heading>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {surfaceLevels.map((level) => (
                <Surface key={level} level={level} bordered className="flex min-h-24 items-end justify-center rounded-2xl p-3">
                  <Typography variant="caption" className="normal-case tracking-normal">
                    S{level}
                  </Typography>
                </Surface>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <div className="glass rounded-2xl p-4">
                <Typography variant="small" className="font-medium text-foreground">
                  glass
                </Typography>
                <Typography variant="small">Blur e borda translúcida preservados.</Typography>
              </div>
              <div className="nexus-glass rounded-2xl p-4">
                <Typography variant="small" className="font-medium text-foreground">
                  nexus-glass
                </Typography>
                <Typography variant="small">Versão limpa para cards e painéis premium.</Typography>
              </div>
            </div>
          </Surface>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <Typography variant="eyebrow">Utilities</Typography>
            <Heading level={2}>Classes Nexus ativas no lugar da vitrine antiga</Heading>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {utilityCards.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className={`${item.cardClassName} h-full`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <Typography variant="small" className="font-medium text-foreground">
                          {item.title}
                        </Typography>
                        <Typography variant="small" className="mt-2">
                          {item.description}
                        </Typography>
                      </div>
                    </div>
                    <span className={item.badgeClassName}>ativo</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Surface level={1} bordered className="rounded-[2rem] p-6 md:p-8">
              <Typography variant="small" className="font-medium text-foreground">
                Gradientes e badges
              </Typography>
              <div className="mt-4 rounded-[1.5rem] nexus-gradient-bg p-6 shadow-strong">
                <Typography variant="eyebrow" className="text-primary-foreground/80">
                  Gradient background
                </Typography>
                <DisplayText className="mt-2 text-primary-foreground">Nexus visual language</DisplayText>
                <Typography variant="small" className="mt-3 max-w-xl text-primary-foreground/80">
                  Gradiente, contraste e leitura forte sem resgatar o layout antigo.
                </Typography>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="nexus-badge-primary">Primary</span>
                <span className="nexus-badge-info">Info</span>
                <span className="nexus-badge-success">Success</span>
                <span className="nexus-badge-warning">Warning</span>
                <span className="nexus-badge-danger">Danger</span>
              </div>
            </Surface>

            <Surface level={1} bordered className="rounded-[2rem] p-6 md:p-8">
              <Typography variant="small" className="font-medium text-foreground">
                Focus, input e ação
              </Typography>
              <div className="mt-4 space-y-3">
                <Input className="nexus-focus-ring" placeholder="Campo com focus ring Nexus" />
                <Button className="w-full nexus-btn-press">Salvar configuração</Button>
                <Button variant="outline" className="w-full nexus-btn-press">
                  Ver documentação visual
                </Button>
              </div>
            </Surface>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <Typography variant="eyebrow">Motion</Typography>
            <Heading level={2}>Feedback visual Nexus</Heading>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Surface level={1} bordered className="rounded-[2rem] p-6 md:p-8">
              <div className="grid gap-3">
                {motionCards.map((motion) => (
                  <div key={motion.title} className={motion.className}>
                    <Typography variant="small" className="font-medium text-foreground">
                      {motion.title}
                    </Typography>
                    <Typography variant="small" className="mt-2">
                      {motion.description}
                    </Typography>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface level={1} bordered className="rounded-[2rem] p-6 md:p-8">
              <div className="group nexus-card-hover rounded-[1.5rem] border border-border p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Orbit className="icon-hover-bounce h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <Typography variant="small" className="font-medium text-foreground">
                      Hover, pulse e stagger
                    </Typography>
                    <Typography variant="small">
                      Ícones, listas e indicadores agora usam motion Nexus em vez dos efeitos antigos da página.
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="mt-4 stagger-children grid gap-3 md:grid-cols-2">
                <div className="nexus-card">
                  <div className="flex items-center gap-3">
                    <span className="nexus-pulse-ring inline-flex h-3 w-3 rounded-full bg-success text-success" />
                    <Typography variant="small">Status pulsando com glow</Typography>
                  </div>
                </div>
                <div className="nexus-card">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-3 w-3 rounded-full bg-warning animate-glow-pulse" />
                    <Typography variant="small">Indicador com glow contínuo</Typography>
                  </div>
                </div>
              </div>

              <ul className="mt-4 stagger-list space-y-3">
                <li className="rounded-2xl border border-border px-4 py-3">Card entrance</li>
                <li className="rounded-2xl border border-border px-4 py-3">List stagger</li>
                <li className="rounded-2xl border border-border px-4 py-3">Hover bounce</li>
                <li className="rounded-2xl border border-border px-4 py-3">Border glow</li>
              </ul>
            </Surface>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
