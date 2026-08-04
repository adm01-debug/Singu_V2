import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllTags } from '@/hooks/useCompanyIntelligence';
import { Tags } from 'lucide-react';

export const TagCloudWidget = React.memo(function TagCloudWidget() {
  const { data: tags, isLoading } = useAllTags();

  if (isLoading) return <Skeleton className="h-20 rounded-lg" />;
  if (!tags || tags.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tags className="h-4 w-4 text-primary" />Tags do Portfólio
          <Badge variant="outline" className="text-[10px] ml-auto">{tags.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
          {tags.slice(0, 50).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default TagCloudWidget;
