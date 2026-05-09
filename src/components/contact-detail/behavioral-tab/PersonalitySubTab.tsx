import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Props {
  behavior: Record<string, unknown> | null;
}

export function PersonalitySubTab({ behavior }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Big Five */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Big Five (OCEAN)</CardTitle>
        </CardHeader>
        <CardContent>
          {behavior?.bigFiveProfile ? (
            <div className="space-y-2">
              {[
                { key: 'openness', label: 'Abertura' },
                { key: 'conscientiousness', label: 'Conscienciosidade' },
                { key: 'extraversion', label: 'Extroversão' },
                { key: 'agreeableness', label: 'Amabilidade' },
                { key: 'neuroticism', label: 'Neuroticismo' },
              ].map(({ key, label }) => {
                const profile = behavior.bigFiveProfile as Record<string, number>;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-32 text-xs text-muted-foreground">{label}</span>
                    <Progress value={profile[key] || 0} className="h-2 flex-1" />
                    <span className="w-8 text-right text-xs">{profile[key] || 0}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Não analisado</p>
          )}
        </CardContent>
      </Card>

      {/* MBTI */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">MBTI</CardTitle>
        </CardHeader>
        <CardContent>
          {behavior?.mbtiProfile ? (() => {
            const mbti = behavior.mbtiProfile as Record<string, unknown>;
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="text-lg font-bold">{String(mbti.type || '?')}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Confiança: {String(mbti.confidence || 0)}%
                  </span>
                </div>
              </div>
            );
          })() : (
            <p className="text-xs text-muted-foreground italic">Não analisado</p>
          )}
        </CardContent>
      </Card>

      {/* Enneagram */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Eneagrama</CardTitle>
        </CardHeader>
        <CardContent>
          {behavior?.enneagramProfile ? (() => {
            const enn = behavior.enneagramProfile as Record<string, unknown>;
            return (
              <div className="flex items-center gap-2">
                <Badge className="text-lg font-bold">Tipo {String(enn.type || '?')}</Badge>
                {enn.wing && (
                  <span className="text-xs text-muted-foreground">
                    Asa {String(enn.wing)}
                  </span>
                )}
              </div>
            );
          })() : (
            <p className="text-xs text-muted-foreground italic">Não analisado</p>
          )}
        </CardContent>
      </Card>

      {/* Communication & Response */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-accent" />
            Comunicação & Resposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {behavior?.preferredChannel && (
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-muted-foreground text-xs">Canal preferido</span>
              <Badge variant="outline" className="capitalize text-[10px]">{String(behavior.preferredChannel)}</Badge>
            </div>
          )}
          {behavior?.messageStyle && (
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-muted-foreground text-xs">Estilo de msg</span>
              <Badge variant="outline" className="text-[10px]">{String(behavior.messageStyle)}</Badge>
            </div>
          )}
          <div className="flex items-center justify-between border-b pb-1">
            <span className="text-muted-foreground text-xs">Tempo méd. resposta</span>
            <span className="text-[10px] font-medium">{behavior?.avgResponseTimeHours || '?'}h</span>
          </div>
          <div className="flex items-center justify-between border-b pb-1">
            <span className="text-muted-foreground text-xs">Melhor janela</span>
            <span className="text-[10px] font-medium">{behavior?.bestContactWindow || 'Comercial'}</span>
          </div>
          {behavior?.formalityLevel && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Nível de Formalidade</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div 
                    key={level} 
                    className={cn(
                      "h-1.5 w-3 rounded-full",
                      level <= Number(behavior.formalityLevel) ? "bg-primary" : "bg-muted"
                    )} 
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
