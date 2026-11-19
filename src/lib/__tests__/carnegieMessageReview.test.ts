import { describe, it, expect } from 'vitest';
import { revisarMensagemCarnegie } from '../carnegieMessageReview';

describe('revisarMensagemCarnegie', () => {
  it('devolve null para texto vazio ou só com espaços', () => {
    expect(revisarMensagemCarnegie('')).toBeNull();
    expect(revisarMensagemCarnegie('   \n ')).toBeNull();
  });

  it('não inventa nota quando o texto não traz nenhum sinal', () => {
    const revisao = revisarMensagemCarnegie('Segue o orçamento em anexo.');
    expect(revisao).not.toBeNull();
    expect(revisao?.empatia.nota).toBeNull();
    expect(revisao?.encorajamento.nota).toBeNull();
    expect(revisao?.critica.frases).toEqual([]);
    expect(revisao?.critica.nota).toBe(100);
    expect(revisao?.critica.reescrita).toBeNull();
    expect(revisao?.ordens.encontradas).toEqual([]);
    expect(revisao?.interesse.indicadores).toBe(0);
    expect(revisao?.pontosDeAtencao).toBe(0);
  });

  it('aponta ordens diretas e conta como ponto de atenção', () => {
    const revisao = revisarMensagemCarnegie('Você precisa assinar o contrato hoje.');
    expect(revisao?.ordens.encontradas.length).toBeGreaterThan(0);
    expect(revisao?.pontosDeAtencao).toBeGreaterThan(0);
  });

  it('só sugere perguntas por perfil quando o perfil DISC é conhecido', () => {
    const texto = 'Você precisa assinar o contrato hoje.';
    expect(revisarMensagemCarnegie(texto)?.ordens.sugestoesPorPerfil).toEqual([]);
    expect(revisarMensagemCarnegie(texto, 'D')?.ordens.sugestoesPorPerfil.length).toBeGreaterThan(0);
  });

  it('mede empatia quando há frase de empatia no texto', () => {
    const revisao = revisarMensagemCarnegie('Entendo sua preocupação e faz sentido querer mais prazo.');
    expect(revisao?.empatia.frases.length).toBeGreaterThan(0);
    expect(revisao?.empatia.nota).toBeGreaterThan(50);
  });

  it('mede a queda de empatia quando só há sinal negativo', () => {
    const revisao = revisarMensagemCarnegie('Isso não faz sentido para o seu caso.');
    expect(revisao?.empatia.frases).toEqual([]);
    expect(revisao?.empatia.nota).toBeLessThan(50);
  });

  it('aponta frase que desanima e baixa a nota de encorajamento', () => {
    const revisao = revisarMensagemCarnegie('Isso é muito difícil e é arriscado.');
    expect(revisao?.encorajamento.desanimo.length).toBeGreaterThan(0);
    expect(revisao?.encorajamento.nota).toBeLessThan(50);
  });

  it('aponta frase que tira a autoria do cliente e oferece alternativas', () => {
    const revisao = revisarMensagemCarnegie('Na minha opinião a melhor opção é o plano anual.');
    expect(revisao?.autoria.deuAutoria).toBe(false);
    expect(revisao?.autoria.frasesProblematicas.length).toBeGreaterThan(0);
    expect(revisao?.autoria.sugestoes.length).toBeGreaterThan(0);
  });

  it('propõe versão reescrita só quando a troca muda o texto', () => {
    const revisao = revisarMensagemCarnegie('Você deveria rever o prazo.');
    expect(revisao?.critica.reescrita).toBe('você poderia considerar rever o prazo.');
  });

  it('conta perguntas pessoais como sinal de interesse genuíno', () => {
    const revisao = revisarMensagemCarnegie('Como foi a viagem? Você mencionou que ia a Recife.');
    expect(revisao?.interesse.contagens.questionsAsked).toBeGreaterThan(0);
    expect(revisao?.interesse.contagens.followUpsMade).toBeGreaterThan(0);
  });

  it('traduz os elementos de narrativa para português', () => {
    const revisao = revisarMensagemCarnegie('Segue o orçamento em anexo.');
    for (const elemento of revisao?.narrativa.elementos ?? []) {
      expect(['Gancho de abertura', 'Transição', 'Linguagem emocional', 'Detalhes sensoriais']).toContain(elemento);
    }
  });

  it('só sugere perguntas de concordância quando há oportunidade no texto', () => {
    expect(revisarMensagemCarnegie('Segue o orçamento em anexo.')?.escadaDoSim.perguntas).toEqual([]);
    const comOportunidade = revisarMensagemCarnegie('É importante resolver esse problema ainda este mês.');
    expect(comOportunidade?.escadaDoSim.oportunidades).toBeGreaterThan(0);
    expect(comOportunidade?.escadaDoSim.perguntas.length).toBeGreaterThan(0);
  });
});
