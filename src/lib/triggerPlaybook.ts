// Roteiro de gatilhos por cenário de venda.
//
// Junta três módulos de `src/data` que não tinham tela: os pacotes prontos por
// cenário (`triggerBundles`) e os modelos de frase por sistema representacional
// (`triggerTemplatesVAK`) e por metaprograma (`triggerTemplatesMetaprograms`).
// Função pura: devolve só o que os módulos trazem para o cenário e o perfil
// escolhidos. A "taxa de sucesso" dos pacotes é um número fixo do arquivo, não
// uma medição, e por isso não entra no roteiro.

import { getBundleById, getRecommendedBundle, type TriggerBundle } from '@/data/triggerBundles';
import { getVAKTemplatesForTrigger, type VAKTriggerTemplate } from '@/data/triggerTemplatesVAK';
import {
  getMetaprogramTemplatesForTrigger,
  type MetaprogramTriggerTemplate,
  type MetaprogramType,
} from '@/data/triggerTemplatesMetaprograms';
import { ADVANCED_MENTAL_TRIGGERS } from '@/data/triggersAdvancedData';
import { MENTAL_TRIGGERS, type PersuasionScenario } from '@/types/triggers';

export type PerfilDisc = 'D' | 'I' | 'S' | 'C';
export type PerfilVak = 'V' | 'A' | 'K';

export interface PerfilDoCliente {
  disc?: PerfilDisc | null;
  vak?: PerfilVak | null;
  metaprograma?: MetaprogramType | null;
}

export interface PassoDoRoteiro {
  ordem: number;
  gatilho: string;
  nome: string;
  minuto: number;
  intensidade: number;
  /** Frase pronta para o sistema representacional escolhido; `null` se o módulo não tem. */
  modeloVak: VAKTriggerTemplate | null;
  /** Frase pronta para o metaprograma escolhido; `null` se o módulo não tem. */
  modeloMetaprograma: MetaprogramTriggerTemplate | null;
}

export interface RoteiroDeGatilhos {
  pacote: TriggerBundle;
  /** O pacote do cenário não atende o perfil DISC e outro foi escolhido no lugar. */
  trocadoPeloPerfil: boolean;
  passos: PassoDoRoteiro[];
  reserva: TriggerBundle | null;
}

const NOMES_AVANCADOS: Record<string, { name: string } | undefined> = ADVANCED_MENTAL_TRIGGERS;
const NOMES_BASE: Record<string, { name: string } | undefined> = MENTAL_TRIGGERS;

export function nomeDoGatilho(gatilho: string): string {
  return NOMES_BASE[gatilho]?.name ?? NOMES_AVANCADOS[gatilho]?.name ?? gatilho;
}

export function montarRoteiro(cenario: PersuasionScenario, perfil: PerfilDoCliente = {}): RoteiroDeGatilhos | null {
  const pacote = getRecommendedBundle(cenario, perfil.disc ?? undefined, perfil.vak ?? undefined);
  if (!pacote) return null;

  const passos = pacote.timing.map((passo, indice) => ({
    ordem: indice + 1,
    gatilho: passo.trigger,
    nome: nomeDoGatilho(passo.trigger),
    minuto: passo.delayMinutes,
    intensidade: passo.intensityLevel,
    modeloVak: perfil.vak ? getVAKTemplatesForTrigger(passo.trigger, perfil.vak)[0] ?? null : null,
    modeloMetaprograma: perfil.metaprograma
      ? getMetaprogramTemplatesForTrigger(passo.trigger, perfil.metaprograma)[0] ?? null
      : null,
  }));

  return {
    pacote,
    trocadoPeloPerfil: pacote.scenario !== cenario,
    passos,
    reserva: pacote.fallbackBundle ? getBundleById(pacote.fallbackBundle) ?? null : null,
  };
}
