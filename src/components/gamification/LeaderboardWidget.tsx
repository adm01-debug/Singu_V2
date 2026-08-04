import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard } from '@/hooks/useGamification';
import { Crown, Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const rankIcons: Record<number, React.ReactNode> = {
  1: <Crown className="h-4 w-4 text-warning" />,
  2: <Medal className="h-4 w-4 text-muted-foreground" />,
  3: <Medal className="h-4 w-4 text-accent" />,
};

function LeaderboardWidget() {
  const { data: entries, isLoading } = useLeaderboard();

  if (isLoading) return <Skeleton className="h-[300px] rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!entries || entries.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">Ranking não disponível</p>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {entries.map((entry, i) => {
              const rank = entry.rank ?? i + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={entry.user_id || i}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                    isTop3 ? "bg-primary/5 border border-primary/10" : "bg-muted/30"
                  )}
                >
                  <div className="w-7 flex items-center justify-center">
                    {rankIcons[rank] || (
                      <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
                    )}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {(entry.user_name || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.user_name || 'Usuário'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.deals_closed != null ? `${entry.deals_closed} deals` : ''}
                      {entry.badges_count != null ? ` · ${entry.badges_count} badges` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">{entry.score ?? 0}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(LeaderboardWidget);
