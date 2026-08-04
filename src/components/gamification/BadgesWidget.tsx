import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserBadges, useCheckAndAwardBadges } from '@/hooks/useGamification';
import { Award, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-muted text-muted-foreground',
  rare: 'bg-info/20 text-info',
  epic: 'bg-accent/20 text-accent',
  legendary: 'bg-warning/20 text-warning',
};

const BADGE_ICONS: Record<string, string> = {
  deals: '🤝',
  contacts: '👥',
  streak: '🔥',
  revenue: '💰',
  speed: '⚡',
  quality: '⭐',
};

function BadgesWidget() {
  const { data: badges, isLoading } = useUserBadges();
  const checkBadges = useCheckAndAwardBadges();

  const handleCheck = async () => {
    try {
      await checkBadges.mutateAsync();
      toast.success('Badges verificados com sucesso!');
    } catch {
      toast.error('Erro ao verificar badges');
    }
  };

  if (isLoading) return <Skeleton className="h-[300px] rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Minhas Conquistas
            {badges && badges.length > 0 && (
              <Badge variant="outline" className="text-[10px]">{badges.length}</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCheck}
            disabled={checkBadges.isPending}
            className="h-7 text-xs gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${checkBadges.isPending ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!badges || badges.length === 0) ? (
          <div className="text-center py-8 space-y-2">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhuma conquista ainda</p>
            <p className="text-[10px] text-muted-foreground">Continue trabalhando para desbloquear badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto">
            {badges.map((badge, i) => {
              const icon = badge.icon || BADGE_ICONS[badge.category || ''] || '🏅';
              const rarityClass = RARITY_COLORS[badge.rarity || 'common'] || RARITY_COLORS.common;
              return (
                <div
                  key={badge.id || i}
                  className="flex flex-col items-center p-3 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/20 transition-colors text-center"
                >
                  <span className="text-2xl mb-1.5">{icon}</span>
                  <p className="text-xs font-medium text-foreground line-clamp-1">
                    {badge.badge_name || badge.badge_key || 'Badge'}
                  </p>
                  {badge.description && (
                    <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{badge.description}</p>
                  )}
                  {badge.rarity && (
                    <Badge variant="outline" className={`text-[8px] mt-1.5 ${rarityClass}`}>
                      {badge.rarity}
                    </Badge>
                  )}
                  {badge.earned_at && (
                    <p className="text-[8px] text-muted-foreground mt-1">
                      {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(BadgesWidget);
