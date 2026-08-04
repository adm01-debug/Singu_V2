import type { VAKProfile } from '@/types/vak';
import type { MetaprogramProfile } from '@/types/metaprograms';
import type { DISCProfile } from '@/types';

export function generateCombinedMessage(
  vakProfile: VAKProfile,
  metaProfile: MetaprogramProfile,
  discProfile: DISCProfile | undefined,
  type: 'opening' | 'objection' | 'closing' | 'followup'
): string {
  const vakWords = {
    V: { ver: 'ver', mostrar: 'mostrar', claro: 'claro', visualizar: 'visualizar', perspectiva: 'perspectiva' },
    A: { ver: 'ouvir', mostrar: 'contar', claro: 'ressoar', visualizar: 'sintonizar', perspectiva: 'harmonia' },
    K: { ver: 'sentir', mostrar: 'compartilhar', claro: 'confortável', visualizar: 'experimentar', perspectiva: 'sensação' },
    D: { ver: 'analisar', mostrar: 'apresentar dados', claro: 'lógico', visualizar: 'calcular', perspectiva: 'análise' },
  };

  const vak = vakWords[vakProfile.primary];
  const isToward = metaProfile.motivationDirection === 'toward';
  const isInternal = metaProfile.referenceFrame === 'internal';
  const isOptions = metaProfile.workingStyle === 'options';

  const messages = {
    opening: {
      toward: `{nome}, quero ${vak.mostrar} como {empresa} pode alcançar {beneficio}. ${isInternal ? 'Tenho certeza que você vai perceber o valor' : 'Nossos clientes confirmam os resultados'}. ${isOptions ? 'Temos várias formas de trabalhar juntos.' : 'O processo é claro e estruturado.'}`,
      away: `{nome}, quero ${vak.mostrar} como resolver {problema} definitivamente. ${isInternal ? 'Você vai ${vak.ver} que faz sentido' : 'Os dados comprovam a eficácia'}. ${isOptions ? 'Podemos adaptar à sua necessidade.' : 'Siga o passo a passo e elimine o problema.'}`,
    },
    objection: {
      toward: `Entendo sua preocupação. Deixa eu ${vak.mostrar} o retorno: {beneficio}. ${isInternal ? 'Avalie por você mesmo' : 'Empresas similares confirmam'}. ${isOptions ? 'Temos opções de investimento.' : 'O processo de retorno é claro.'}`,
      away: `Compreendo. Mas ${vak.ver} o custo de NÃO resolver {problema}. ${isInternal ? 'Você sabe o impacto' : 'Os números mostram o prejuízo'}. ${isOptions ? 'Várias formas de viabilizar.' : 'Estruturamos o pagamento em etapas.'}`,
    },
    closing: {
      toward: `{nome}, está tudo ${vak.claro} para conquistar {beneficio}. ${isInternal ? 'Sinto que você está pronto' : 'Assim como outros clientes'}. ${isOptions ? 'Escolha o plano ideal.' : 'Vamos seguir o próximo passo.'}`,
      away: `{nome}, cada dia sem resolver {problema} custa mais. ${isInternal ? 'Você já sabe disso' : 'Os dados confirmam'}. ${isOptions ? 'Várias formas de começar.' : 'O processo de início é simples.'}`,
    },
    followup: {
      toward: `{nome}, lembrei de você e como {empresa} pode ${vak.ver} {beneficio}. ${isInternal ? 'O que você está pensando?' : 'Temos novidades que outros aprovaram.'}`,
      away: `{nome}, como está a situação com {problema}? Quero ${vak.mostrar} uma solução. ${isInternal ? 'Você já percebeu o impacto' : 'Clientes similares resolveram assim.'}`,
    },
  };

  return isToward ? messages[type].toward : messages[type].away;
}
