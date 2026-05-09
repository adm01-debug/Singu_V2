import { memo, useMemo } from 'react';
import { Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import type { RapportIntel } from '@/hooks/useRapportIntelView';
import type { RapportPoints } from '@/hooks/useRapportPoints';
import { useFicha360Filters } from '@/hooks/useFicha360Filters';
import { cn } from '@/lib/utils';

interface Props {
  rapportIntel: RapportIntel | null;
  rapportPoints: RapportPoints | null;
}

interface TagGroup {
  label: string;
  items: string[];
  type: 'hobby' | 'interest' | 'value' | 'frequent' | 'shared';
  variant: 'default' | 'secondary' | 'outline';
}

export const TagsInteresseCard = memo(({ rapportIntel, rapportPoints }: Props) => {
  const { q, setQ } = useFicha360Filters();
  
  const groups = useMemo<TagGroup[]>(() => {
    const safe = (arr: unknown): string[] =>
      Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
    return ([
      { label: 'Hobbies', items: safe(rapportIntel?.hobbies), type: 'hobby', variant: 'default' as const },
      { label: 'Interesses', items: safe(rapportIntel?.interests), type: 'interest', variant: 'secondary' as const },
      { label: 'Valores', items: safe(rapportIntel?.top_values), type: 'value', variant: 'outline' as const },
      { label: 'Palavras frequentes', items: safe(rapportPoints?.frequent_words), type: 'frequent', variant: 'outline' as const },
      { label: 'Interesses compartilhados', items: safe(rapportPoints?.shared_interests), type: 'shared', variant: 'secondary' as const },
    ] satisfies TagGroup[]).filter((g) => g.items.length > 0);
  }, [rapportIntel, rapportPoints]);

  const isEmpty = groups.length === 0;

  const handleTagClick = (tag: string) => {
    const currentQ = (q || '').trim();
    if (currentQ.toLowerCase() === tag.toLowerCase()) {
      setQ(''); // Toggle off
    } else {
      setQ(tag);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-primary" />
          Tags de Interesse (Rapport)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <InlineEmptyState
            icon={Tag}
            title="Sem tags registradas"
            description="Hobbies, interesses e valores aparecem conforme você adiciona detalhes do contato."
          />
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{g.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.slice(0, 12).map((item) => {
                    const isActive = q?.toLowerCase().includes(item.toLowerCase());
                    return (
                      <Badge 
                        key={`${g.label}-${item}`} 
                        variant={isActive ? 'default' : g.variant} 
                        className={cn(
                          "text-xs font-normal cursor-pointer transition-all hover:scale-105 active:scale-95",
                          isActive && "ring-2 ring-primary ring-offset-1 bg-primary text-primary-foreground",
                          !isActive && g.variant === 'outline' && "hover:bg-accent hover:text-accent-foreground",
                          !isActive && g.variant === 'secondary' && "hover:bg-secondary/80",
                          !isActive && g.variant === 'default' && "hover:bg-primary/90"
                        )}
                        onClick={() => handleTagClick(item)}
                      >
                        {item}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1 italic">
              * Clique em uma tag para filtrar as atividades relacionadas a esse tema.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
TagsInteresseCard.displayName = 'TagsInteresseCard';
