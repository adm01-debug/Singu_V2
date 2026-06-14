import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface ModuleHelpProps {
  title: string;
  description: string;
  benefits?: readonly string[];
  howToUse?: readonly string[];
  className?: string;
}

export function ModuleHelp({ title, description, benefits, howToUse, className }: ModuleHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn('gap-1.5 text-xs text-muted-foreground hover:text-primary h-7 px-2', className)}
        onClick={() => setOpen(true)}
        aria-label={`Saiba mais sobre ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">O que é isso?</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-lg">{title}</SheetTitle>
            <SheetDescription className="text-sm leading-relaxed">
              {description}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {benefits && benefits.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  ✨ Benefícios
                </h4>
                <ul className="space-y-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {howToUse && howToUse.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  📖 Como usar
                </h4>
                <ol className="space-y-2">
                  {howToUse.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Pre-configured help for each advanced module
export const moduleHelpContent = {
  disc: {
    title: 'Análise DISC',
    description: 'O DISC é um modelo comportamental que classifica pessoas em 4 perfis: Dominante, Influente, Estável e Conforme. Entender o perfil do seu contato ajuda a adaptar sua comunicação.',
    benefits: [
      'Comunique-se de forma mais eficaz com cada perfil',
      'Adapte sua abordagem de vendas automaticamente',
      'Preveja reações e objeções comuns',
    ],
    howToUse: [
      'Registre interações com seus contatos normalmente',
      'O sistema analisa padrões de comunicação e detecta o perfil DISC',
      'Use as dicas de comunicação antes de cada reunião',
    ],
  },
  nlp: {
    title: 'Análise PNL (Programação Neurolinguística)',
    description: 'Identifica sistemas representacionais (Visual, Auditivo, Cinestésico), valores pessoais e padrões linguísticos dos seus contatos para comunicação mais persuasiva.',
    benefits: [
      'Descubra o canal preferido de comunicação do cliente',
      'Identifique valores e motivações ocultas',
      'Adapte sua linguagem ao estilo do interlocutor',
    ],
    howToUse: [
      'Inclua detalhes das conversas ao registrar interações',
      'O sistema detecta padrões VAK e valores automaticamente',
      'Consulte as sugestões antes de cada abordagem',
    ],
  },
  neuromarketing: {
    title: 'Neuromarketing & Vieses Cognitivos',
    description: 'Detecta vieses cognitivos e âncoras emocionais nos seus contatos, permitindo estratégias de persuasão éticas baseadas em neurociência.',
    benefits: [
      'Entenda como seu cliente toma decisões',
      'Use gatilhos mentais de forma ética e eficaz',
      'Identifique resistências inconscientes à compra',
    ],
    howToUse: [
      'Registre reações e objeções durante as interações',
      'O sistema mapeia vieses cognitivos predominantes',
      'Aplique as estratégias sugeridas na sua próxima reunião',
    ],
  },
  carnegie: {
    title: 'Princípios de Dale Carnegie',
    description: 'Aplica os princípios de Dale Carnegie para construir rapport, influenciar e liderar conversas. Analisa o nível de calor humano em cada interação.',
    benefits: [
      'Construa relacionamentos mais profundos e genuínos',
      'Acompanhe a evolução do rapport ao longo do tempo',
      'Receba dicas práticas de como ser mais memorável',
    ],
    howToUse: [
      'Registre suas interações com observações pessoais',
      'O sistema avalia o nível de warmth e conexão',
      'Siga as recomendações para fortalecer o vínculo',
    ],
  },
} as const;
