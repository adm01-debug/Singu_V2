import { memo, useMemo } from 'react';
import { Tag, Brain, Check, X, MessageSquare, Phone, Linkedin, Instagram, Twitter, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import type { RapportIntel } from '@/hooks/useRapportIntelView';
import type { RapportPoints } from '@/hooks/useRapportPoints';
import { useFicha360Filters } from '@/hooks/useFicha360Filters';
import { useAIApprovals } from '@/hooks/useAIApprovals';
import { Button } from '@/components/ui/button';
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
  const { suggestions, approve, reject } = useAIApprovals(rapportIntel?.contact_id);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <MessageSquare className="h-3 w-3 text-green-500" />;
      case 'call': return <Phone className="h-3 w-3 text-blue-500" />;
      case 'linkedin': return <Linkedin className="h-3 w-3 text-blue-600" />;
      case 'instagram': return <Instagram className="h-3 w-3 text-pink-500" />;
      case 'twitter': return <Twitter className="h-3 w-3 text-sky-400" />;
      default: return <Globe className="h-3 w-3 text-muted-foreground" />;
    }
  };
  
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
      <CardContent className="space-y-4">
        {/* Sugestões pendentes para revisão */}
        {suggestions.length > 0 && (
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider">
              <Brain className="h-3 w-3" /> Sugestões para Revisão
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-background rounded border border-border/50 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {getSourceIcon(s.source)}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">"{s.value}"</p>
                      <p className="text-[10px] text-muted-foreground">
                        {s.type === 'hobby' ? 'Hobby' : 'Interesse'} · {s.source}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 text-green-500 hover:bg-green-50" 
                      onClick={() => approve.mutate(s)}
                      disabled={approve.isPending}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 text-destructive hover:bg-red-50" 
                      onClick={() => reject.mutate(s.id)}
                      disabled={reject.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    const source = (rapportIntel?.rapport_metadata as { hobbies?: Record<string, string>; interests?: Record<string, string> } | null | undefined)?.[g.type === 'hobby' ? 'hobbies' : 'interests']?.[item];
                    
                    return (
                      <Badge 
                        key={`${g.label}-${item}`} 
                        variant={isActive ? 'default' : g.variant} 
                        className={cn(
                          "text-xs font-normal cursor-pointer transition-all hover:scale-105 active:scale-95 gap-1",
                          isActive && "ring-2 ring-primary ring-offset-1 bg-primary text-primary-foreground",
                          !isActive && g.variant === 'outline' && "hover:bg-accent hover:text-accent-foreground",
                          !isActive && g.variant === 'secondary' && "hover:bg-secondary/80",
                          !isActive && g.variant === 'default' && "hover:bg-primary/90"
                        )}
                        onClick={() => handleTagClick(item)}
                      >
                        {source && getSourceIcon(source)}
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
