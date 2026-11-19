// ==============================================
// MESSAGE REVIEW PANEL
// Revisa um rascunho de mensagem pelos principios de Carnegie
// ==============================================

import { useState, useCallback, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Heart,
  Sparkles,
  Ear,
  Lightbulb,
  BookOpen,
  ThumbsUp,
  Target,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Contact } from '@/types';
import { getDISCProfile } from '@/lib/contact-utils';
import { revisarMensagemCarnegie, type PerfilDisc, type RevisaoMensagem } from '@/lib/carnegieMessageReview';
import { cn } from '@/lib/utils';

interface MessageReviewPanelProps {
  contact?: Contact | null;
  className?: string;
}

const TONS: Record<RevisaoMensagem['critica']['tom'], { label: string; classe: string }> = {
  critical: { label: 'Tom crítico', classe: 'bg-destructive/10 text-destructive' },
  neutral: { label: 'Tom neutro', classe: 'bg-muted text-muted-foreground' },
  positive: { label: 'Tom positivo', classe: 'bg-primary/10 text-primary' },
  very_positive: { label: 'Tom muito positivo', classe: 'bg-success/10 text-success' },
};

const INDICADORES_DE_INTERESSE: { chave: string; label: string }[] = [
  { chave: 'questionsAsked', label: 'Perguntas pessoais' },
  { chave: 'followUpsMade', label: 'Retomadas de conversas anteriores' },
  { chave: 'activeListeningSignals', label: 'Sinais de escuta' },
];

function Secao({
  icone: Icone,
  titulo,
  selo,
  children,
}: {
  icone: LucideIcon;
  titulo: string;
  selo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <Icone className="h-4 w-4 text-muted-foreground" />
          {titulo}
        </h4>
        {selo}
      </div>
      {children}
    </section>
  );
}

function Lista({ itens, vazio }: { itens: string[]; vazio?: string }) {
  if (itens.length === 0) return vazio ? <p className="text-sm text-muted-foreground">{vazio}</p> : null;
  return (
    <ul className="space-y-1 text-sm">
      {itens.map((item, indice) => (
        <li key={`${indice}-${item}`} className="flex gap-2">
          <ArrowRight className="h-3.5 w-3.5 mt-1 shrink-0 text-muted-foreground" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Nota({ valor }: { valor: number | null }) {
  if (valor === null) return <Badge variant="outline">Sem sinais no texto</Badge>;
  return <Badge variant="outline">{valor}/100</Badge>;
}

export function MessageReviewPanel({ contact = null, className }: MessageReviewPanelProps) {
  const [texto, setTexto] = useState('');
  const [revisao, setRevisao] = useState<RevisaoMensagem | null>(null);
  const disc: PerfilDisc | null = contact ? getDISCProfile(contact) : null;

  const revisar = useCallback(
    (mensagem: string) => setRevisao(revisarMensagemCarnegie(mensagem, disc)),
    [disc],
  );

  const usarReescrita = useCallback(
    (novaVersao: string) => {
      setTexto(novaVersao);
      revisar(novaVersao);
    },
    [revisar],
  );

  return (
    <Card variant="elevated" className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Revisor de Mensagem
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cole o rascunho antes de enviar. O revisor aponta críticas, ordens e frases que tiram a autoria do
          cliente, e sugere como reescrever
          {disc ? ` no estilo do perfil ${disc} deste contato.` : '.'}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            aria-label="Rascunho da mensagem"
            placeholder="Cole aqui o rascunho da mensagem que você vai enviar..."
            value={texto}
            onChange={evento => setTexto(evento.target.value)}
            className="min-h-[120px] resize-none"
          />
          <Button onClick={() => revisar(texto)} disabled={!texto.trim()} className="w-full">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Revisar mensagem
          </Button>
        </div>

        {!revisao && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma mensagem revisada ainda. O resultado aparece aqui, só com o que for encontrado no texto.
          </p>
        )}

        {revisao && (
          <div className="space-y-3 pt-4 border-t">
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg p-3 text-sm font-medium',
                revisao.pontosDeAtencao > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success',
              )}
            >
              {revisao.pontosDeAtencao > 0 ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              {revisao.pontosDeAtencao > 0
                ? `${revisao.pontosDeAtencao} ponto(s) de atenção antes de enviar`
                : 'Nenhum ponto de atenção encontrado'}
            </div>

            <Secao
              icone={AlertTriangle}
              titulo="Crítica e tom"
              selo={
                <Badge variant="outline" className={TONS[revisao.critica.tom].classe}>
                  {TONS[revisao.critica.tom].label} · {revisao.critica.nota}/100
                </Badge>
              }
            >
              {revisao.critica.frases.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma frase crítica encontrada.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {revisao.critica.frases.map((frase, indice) => (
                    <li key={`${indice}-${frase.phrase}`} className="rounded-md bg-muted/50 p-2">
                      <p>
                        <span className="font-medium text-destructive">“{frase.phrase}”</span> — {frase.impact}
                      </p>
                      <p className="text-muted-foreground">Prefira: {frase.alternative}</p>
                    </li>
                  ))}
                </ul>
              )}
              {revisao.critica.reescrita && (
                <div className="space-y-2 rounded-md bg-primary/5 p-2">
                  <p className="text-xs font-medium text-muted-foreground">Versão sugerida</p>
                  <p className="text-sm whitespace-pre-wrap">{revisao.critica.reescrita}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => usarReescrita(revisao.critica.reescrita ?? '')}
                  >
                    Usar esta versão
                  </Button>
                </div>
              )}
            </Secao>

            <Secao
              icone={HelpCircle}
              titulo="Ordens e perguntas"
              selo={
                <Badge variant="outline">
                  {revisao.ordens.encontradas.length} ordem(ns) · {revisao.ordens.perguntas} pergunta(s)
                </Badge>
              }
            >
              {revisao.ordens.encontradas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma ordem direta encontrada.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1">
                    {revisao.ordens.encontradas.map((ordem, indice) => (
                      <Badge key={`${indice}-${ordem}`} variant="outline" className="bg-warning/10 text-warning">
                        {ordem}
                      </Badge>
                    ))}
                  </div>
                  <Lista
                    itens={[
                      ...revisao.ordens.alternativas.map(
                        alternativa => `Em vez de “${alternativa.directOrder}”: ${alternativa.questionAlternative}`,
                      ),
                      ...revisao.ordens.sugestoesPorPerfil.filter(
                        sugestao => !revisao.ordens.alternativas.some(a => a.questionAlternative === sugestao),
                      ),
                    ]}
                  />
                </>
              )}
            </Secao>

            <Secao icone={Heart} titulo="Empatia" selo={<Nota valor={revisao.empatia.nota} />}>
              {revisao.empatia.frases.length > 0 && (
                <p className="text-sm">
                  Frases de empatia: {revisao.empatia.frases.map(frase => `“${frase}”`).join(', ')}
                </p>
              )}
              <Lista itens={revisao.empatia.oportunidades} />
              {revisao.empatia.frases.length === 0 && revisao.empatia.oportunidades.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma frase de empatia encontrada.</p>
              )}
            </Secao>

            <Secao icone={Sparkles} titulo="Encorajamento" selo={<Nota valor={revisao.encorajamento.nota} />}>
              {revisao.encorajamento.desanimo.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma frase que desanime foi encontrada.</p>
              ) : (
                <p className="text-sm">
                  Pode desanimar: {revisao.encorajamento.desanimo.map(frase => `“${frase}”`).join(', ')}
                </p>
              )}
              {revisao.encorajamento.roteiro && (
                <p className="text-sm text-muted-foreground">Experimente: {revisao.encorajamento.roteiro}</p>
              )}
            </Secao>

            <Secao
              icone={Ear}
              titulo="Interesse genuíno"
              selo={<Badge variant="outline">{revisao.interesse.indicadores} sinal(is)</Badge>}
            >
              <div className="grid gap-1 text-sm sm:grid-cols-3">
                {INDICADORES_DE_INTERESSE.map(indicador => (
                  <div key={indicador.chave} className="rounded-md bg-muted/50 p-2">
                    <p className="text-lg font-semibold">{revisao.interesse.contagens[indicador.chave] ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{indicador.label}</p>
                  </div>
                ))}
              </div>
              <Lista itens={revisao.interesse.sugestoes.slice(0, 3)} />
            </Secao>

            <Secao
              icone={Lightbulb}
              titulo="Autoria da ideia"
              selo={
                <Badge variant="outline">
                  {revisao.autoria.deuAutoria
                    ? 'Dá autoria ao cliente'
                    : `${revisao.autoria.frasesProblematicas.length} frase(s) impositiva(s)`}
                </Badge>
              }
            >
              {revisao.autoria.frasesProblematicas.length > 0 && (
                <p className="text-sm">
                  Soa imposto: {revisao.autoria.frasesProblematicas.map(frase => `“${frase}”`).join(', ')}
                </p>
              )}
              <Lista itens={revisao.autoria.sugestoes} />
            </Secao>

            <Secao
              icone={BookOpen}
              titulo="Narrativa"
              selo={
                <Badge variant="outline">{revisao.narrativa.usa ? 'Conta uma história' : 'Sem história'}</Badge>
              }
            >
              <Lista itens={revisao.narrativa.elementos} vazio="Nenhum elemento de história encontrado." />
            </Secao>

            <Secao
              icone={ThumbsUp}
              titulo="Escada do sim"
              selo={<Badge variant="outline">{revisao.escadaDoSim.oportunidades} oportunidade(s)</Badge>}
            >
              <Lista
                itens={revisao.escadaDoSim.perguntas}
                vazio="Nenhuma afirmação que possa virar pergunta de concordância."
              />
            </Secao>

            <Secao
              icone={Target}
              titulo="Desejos que a mensagem aciona"
              selo={<Badge variant="outline">{revisao.desejos.length}</Badge>}
            >
              {revisao.desejos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum desejo identificado no texto.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {revisao.desejos.map(desejo => (
                    <li key={desejo.categoria} className="rounded-md bg-muted/50 p-2">
                      <p className="font-medium">{desejo.nome}</p>
                      <p className="text-muted-foreground">{desejo.descricao}</p>
                      {desejo.tecnica && (
                        <p>
                          {desejo.tecnica}
                          {desejo.exemplo ? ` — “${desejo.exemplo}”` : ''}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Secao>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
