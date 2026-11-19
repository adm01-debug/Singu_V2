// Aba "Roteiros": pacote de gatilhos pronto por cenário de venda, com frases
// por sistema representacional e por metaprograma quando o perfil é informado.

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Clock, Copy, LifeBuoy, X } from 'lucide-react';
import { TRIGGER_BUNDLES, type TriggerBundle } from '@/data/triggerBundles';
import type { MetaprogramType } from '@/data/triggerTemplatesMetaprograms';
import { montarRoteiro, type PerfilDisc, type PerfilVak } from '@/lib/triggerPlaybook';
import type { PersuasionScenario } from '@/types/triggers';

interface BundlesTabProps {
  /** Perfil DISC do contato real, quando houver; o vendedor pode trocar. */
  discInicial?: PerfilDisc | null;
}

const DIFICULDADE: Record<TriggerBundle['difficultyLevel'], string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  expert: 'Especialista',
};

const PERFIS_DISC: { valor: PerfilDisc; label: string }[] = [
  { valor: 'D', label: 'D · Dominante' },
  { valor: 'I', label: 'I · Influente' },
  { valor: 'S', label: 'S · Estável' },
  { valor: 'C', label: 'C · Conforme' },
];

const PERFIS_VAK: { valor: PerfilVak; label: string }[] = [
  { valor: 'V', label: 'Visual' },
  { valor: 'A', label: 'Auditivo' },
  { valor: 'K', label: 'Cinestésico' },
];

const METAPROGRAMAS: { valor: MetaprogramType; label: string }[] = [
  { valor: 'toward', label: 'Busca ganho' },
  { valor: 'away_from', label: 'Evita perda' },
  { valor: 'internal', label: 'Decide por si' },
  { valor: 'external', label: 'Ouve os outros' },
  { valor: 'proactive', label: 'Age primeiro' },
  { valor: 'reactive', label: 'Analisa antes' },
  { valor: 'options', label: 'Quer opções' },
  { valor: 'procedures', label: 'Quer passo a passo' },
];

function Escolha<T extends string>({
  titulo,
  opcoes,
  valor,
  aoEscolher,
}: {
  titulo: string;
  opcoes: { valor: T; label: string }[];
  valor: T | null;
  aoEscolher: (valor: T | null) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <div className="flex flex-wrap gap-1" role="group" aria-label={titulo}>
        {opcoes.map(opcao => (
          <Button
            key={opcao.valor}
            type="button"
            size="sm"
            variant={valor === opcao.valor ? 'default' : 'outline'}
            aria-pressed={valor === opcao.valor}
            className="h-7 text-xs"
            onClick={() => aoEscolher(valor === opcao.valor ? null : opcao.valor)}
          >
            {opcao.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function FraseCopiavel({ titulo, frase }: { titulo: string; frase: string }) {
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(frase);
      toast.success('Frase copiada');
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.');
    }
  };

  return (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={copiar}>
          <Copy className="h-3 w-3" />
          Copiar
        </Button>
      </div>
      <p className="text-sm">{frase}</p>
    </div>
  );
}

export function BundlesTab({ discInicial = null }: BundlesTabProps) {
  const [cenario, setCenario] = useState<PersuasionScenario>('price_objection');
  const [disc, setDisc] = useState<PerfilDisc | null>(discInicial);
  const [vak, setVak] = useState<PerfilVak | null>(null);
  const [metaprograma, setMetaprograma] = useState<MetaprogramType | null>(null);

  const roteiro = montarRoteiro(cenario, { disc, vak, metaprograma });

  return (
    <ScrollArea className="h-[420px] pr-4">
      <div className="space-y-4">
        <Escolha
          titulo="Situação"
          opcoes={TRIGGER_BUNDLES.map(pacote => ({ valor: pacote.scenario, label: pacote.name }))}
          valor={cenario}
          aoEscolher={escolhido => escolhido && setCenario(escolhido)}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <Escolha titulo="Perfil DISC (opcional)" opcoes={PERFIS_DISC} valor={disc} aoEscolher={setDisc} />
          <Escolha titulo="Como percebe (opcional)" opcoes={PERFIS_VAK} valor={vak} aoEscolher={setVak} />
          <Escolha
            titulo="Como decide (opcional)"
            opcoes={METAPROGRAMAS}
            valor={metaprograma}
            aoEscolher={setMetaprograma}
          />
        </div>

        {!roteiro ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Não há roteiro pronto para essa situação e esse perfil.
          </p>
        ) : (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium">{roteiro.pacote.name}</h4>
                <Badge variant="outline">{DIFICULDADE[roteiro.pacote.difficultyLevel]}</Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  cerca de {roteiro.pacote.estimatedDurationMinutes} min
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{roteiro.pacote.description}</p>
              {roteiro.trocadoPeloPerfil && (
                <p className="text-xs text-warning">
                  O roteiro dessa situação não é indicado para o perfil {disc}; este é o mais próximo para ele.
                </p>
              )}
            </div>

            <FraseCopiavel titulo="Abertura" frase={roteiro.pacote.openingTemplate} />

            <ol className="space-y-2">
              {roteiro.passos.map(passo => (
                <li key={`${passo.ordem}-${passo.gatilho}`} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {passo.ordem}. {passo.nome}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {passo.minuto === 0 ? 'no início' : `aos ${passo.minuto} min`} · intensidade{' '}
                      {passo.intensidade}/5
                    </span>
                  </div>
                  {passo.modeloVak && (
                    <FraseCopiavel titulo="Frase para como ele percebe" frase={passo.modeloVak.template} />
                  )}
                  {passo.modeloMetaprograma && (
                    <FraseCopiavel
                      titulo="Frase para como ele decide"
                      frase={passo.modeloMetaprograma.template}
                    />
                  )}
                  {(passo.modeloVak || passo.modeloMetaprograma) && (
                    <ul className="text-xs text-muted-foreground list-disc pl-4">
                      {[...(passo.modeloVak?.tips ?? []), ...(passo.modeloMetaprograma?.tips ?? [])].map(dica => (
                        <li key={dica}>{dica}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>

            <FraseCopiavel titulo="Fechamento" frase={roteiro.pacote.closingTemplate} />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-success">Faça</p>
                <ul className="space-y-1 text-sm">
                  {roteiro.pacote.doList.map(item => (
                    <li key={item} className="flex gap-2">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-destructive">Evite</p>
                <ul className="space-y-1 text-sm">
                  {roteiro.pacote.dontList.map(item => (
                    <li key={item} className="flex gap-2">
                      <X className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {roteiro.reserva && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => roteiro.reserva && setCenario(roteiro.reserva.scenario)}
              >
                <LifeBuoy className="h-4 w-4" />
                Se não funcionar: {roteiro.reserva.name}
              </Button>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
