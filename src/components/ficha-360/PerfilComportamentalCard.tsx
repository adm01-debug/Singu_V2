 import { memo, useMemo } from 'react';
 import { Brain, Eye, Ear, Hand, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InlineEmptyState } from '@/components/ui/empty-state';
import type { ContactView360 } from '@/hooks/useContactView360';

interface Props {
  profile: ContactView360 | null;
}

const DISC_LABELS: Record<string, string> = {
  D: 'Dominante',
  I: 'Influente',
  S: 'Estável',
  C: 'Conformista',
};

 export const PerfilComportamentalCard = memo(({ profile }: Props) => {
   const hasDisc = profile?.disc_primary;
   const confidence = profile?.disc_confidence ?? 0;
 
   const vakIcon = useMemo(() => {
     const vak = (profile as any)?.vak_dominant?.toLowerCase();
     if (vak === 'visual') return <Eye className="h-3 w-3" />;
     if (vak === 'auditivo') return <Ear className="h-3 w-3" />;
     if (vak === 'cinestesico') return <Hand className="h-3 w-3" />;
     return <Brain className="h-3 w-3" />;
   }, [profile]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          Perfil Comportamental
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasDisc ? (
          <InlineEmptyState
            icon={Brain}
            title="Perfil DISC não analisado"
            description="A análise comportamental aparecerá conforme as interações forem processadas."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="text-sm">
                {profile?.disc_primary} — {DISC_LABELS[profile?.disc_primary ?? ''] ?? 'Perfil'}
              </Badge>
              {profile?.disc_secondary && (
                <Badge variant="outline" className="text-sm">
                  Secundário: {profile.disc_secondary}
                </Badge>
              )}
              {profile?.disc_blend && (
                <Badge variant="secondary" className="text-xs">
                  Mistura: {profile.disc_blend}
                </Badge>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Confiança da análise</span>
                <span className="font-medium text-foreground">{Math.round(confidence * 100)}%</span>
              </div>
              <Progress value={confidence * 100} className="h-2" />
            </div>

             <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
               <div>
                 <p className="text-xs text-muted-foreground">VAK Dominante</p>
                 <div className="flex items-center gap-1.5 mt-0.5">
                   {vakIcon}
                   <p className="text-sm font-medium capitalize">
                     {(profile as any)?.vak_dominant || 'Não analisado'}
                   </p>
                 </div>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">Motivação</p>
                 <div className="flex items-center gap-1.5 mt-0.5">
                   <Info className="h-3 w-3 text-muted-foreground" />
                   <p className="text-sm font-medium capitalize">
                     {(profile as any)?.motivation_direction === 'toward' ? 'Ganhos' : (profile as any)?.motivation_direction === 'away_from' ? 'Riscos' : 'Equilibrado'}
                   </p>
                 </div>
               </div>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
PerfilComportamentalCard.displayName = 'PerfilComportamentalCard';
