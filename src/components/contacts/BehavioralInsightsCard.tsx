import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkles, Heart, MessageCircle, Palette, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBehavioralProfile, useGenerateBehavioralProfile } from '@/hooks/useBehavioralProfile';

interface Props { contactId: string }

const SENTIMENT_LABEL: Record<string, string> = {
  positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo', mixed: 'Misto',
};

export function BehavioralInsightsCard({ contactId }: Props) {
  const { data: profile, isLoading } = useBehavioralProfile(contactId);
  const generate = useGenerateBehavioralProfile();

  const isBusy = generate.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Perfil Comportamental
          </CardTitle>
          <CardDescription>
            Insights gerados por IA a partir do histórico de interações.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" disabled={isBusy} onClick={() => generate.mutate(contactId)}>
          {isBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
          {profile ? 'Reanalisar' : 'Gerar perfil'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && !profile && !isBusy && (
          <p className="text-sm text-muted-foreground">
            Nenhum perfil gerado ainda. Clique em <span className="font-medium">Gerar perfil</span> para analisar o histórico.
          </p>
        )}

        {isBusy && !profile && (
          <p className="text-sm text-muted-foreground">Analisando histórico com IA...</p>
        )}

        {profile && (
          <>
            {profile.summary && (
              <p className="text-sm leading-relaxed text-foreground">{profile.summary}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {profile.tone && (
                <Badge variant="secondary" className="gap-1">
                  <MessageCircle className="h-3 w-3" /> Tom: {profile.tone}
                </Badge>
              )}
              {profile.communication_style && (
                <Badge variant="secondary" className="gap-1">
                  <Palette className="h-3 w-3" /> Estilo: {profile.communication_style}
                </Badge>
              )}
              {profile.sentiment_trend && (
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" /> {SENTIMENT_LABEL[profile.sentiment_trend] ?? profile.sentiment_trend}
                </Badge>
              )}
            </div>

            {(profile.preferences.length > 0 || profile.hobbies.length > 0) && <Separator />}

            {profile.preferences.length > 0 && (
              <section className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Preferências
                </h4>
                <ul className="space-y-1.5">
                  {profile.preferences.map((p, i) => (
                    <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      <span className="font-medium">{p.label}</span>
                      {p.evidence && <p className="mt-0.5 text-xs text-muted-foreground">{p.evidence}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {profile.hobbies.length > 0 && (
              <section className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-sm font-medium">
                  <Heart className="h-3.5 w-3.5 text-primary" /> Hobbies e interesses
                </h4>
                <ul className="space-y-1.5">
                  {profile.hobbies.map((h, i) => (
                    <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      <span className="font-medium">{h.label}</span>
                      {h.evidence && <p className="mt-0.5 text-xs text-muted-foreground">{h.evidence}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {profile.recurrent_topics.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-sm font-medium">Tópicos recorrentes</h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.recurrent_topics.map((t, i) => (
                    <Badge key={i} variant="outline">{t}</Badge>
                  ))}
                </div>
              </section>
            )}

            <p className="pt-1 text-xs text-muted-foreground">
              Baseado em {profile.based_on_count} interações · atualizado{' '}
              {formatDistanceToNow(new Date(profile.last_updated_at), { addSuffix: true, locale: ptBR })}
              {profile.model && ` · ${profile.model}`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
