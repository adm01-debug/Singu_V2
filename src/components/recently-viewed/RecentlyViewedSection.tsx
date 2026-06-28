import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { useRecentlyViewed, type RecentlyViewedItem } from '@/hooks/useRecentlyViewed';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toTitleCase } from '@/lib/formatters';

/** Strip leading numeric prefix like "05 - " from names */
function cleanName(name: string): string {
  return name.replace(/^\d+\s*[-–—]\s*/, '');
}

interface RecentlyViewedSectionProps {
  type: 'contact' | 'company';
}

export function RecentlyViewedSection({ type }: RecentlyViewedSectionProps) {
  const { recentItems } = useRecentlyViewed(type);
  const navigate = useNavigate();

  if (recentItems.length === 0) return null;

  const handleClick = (item: RecentlyViewedItem) => {
    const path = item.type === 'company' ? `/empresas/${item.id}` : `/contatos/${item.id}`;
    navigate(path);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>Vistos recentemente</span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {recentItems.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleClick(item)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors min-w-[180px] max-w-[240px] text-left group"
            >
              <OptimizedAvatar
                alt={item.name}
                fallback={(cleanName(item.name)[0] || 'E').toUpperCase()}
                src={item.avatarUrl}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {toTitleCase(cleanName(item.name))}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                )}
                <p className="text-[10px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(item.viewedAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
