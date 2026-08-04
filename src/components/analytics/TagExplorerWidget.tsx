import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllTags, useCompaniesByTag } from '@/hooks/useCompanyIntelligence';
import { Tags, Building2 } from 'lucide-react';

export const TagExplorerWidget = React.memo(function TagExplorerWidget() {
  const { data: tags, isLoading: tagsLoading } = useAllTags();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const { data: companies, isLoading: companiesLoading } = useCompaniesByTag(selectedTag);

  if (tagsLoading) return <Skeleton className="h-24 rounded-lg" />;
  if (!tags || tags.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tags className="h-4 w-4 text-primary" />Explorar por Tag
          <Badge variant="outline" className="text-[10px] ml-auto">{tags.length} tags</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
          {tags.slice(0, 30).map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "default" : "secondary"}
              className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {selectedTag && (
          <div className="pt-2 border-t space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium">
              Empresas com tag "{selectedTag}":
            </p>
            {companiesLoading ? (
              <Skeleton className="h-12" />
            ) : companies && companies.length > 0 ? (
              <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {companies.slice(0, 10).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/30 text-xs">
                    <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </div>
                ))}
                {companies.length > 10 && (
                  <p className="text-[9px] text-muted-foreground text-center">+{companies.length - 10} mais</p>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">Nenhuma empresa encontrada</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default TagExplorerWidget;
