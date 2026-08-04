import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDuplicateContacts } from '@/hooks/useDuplicateContacts';
import { MergeContactsDialog } from './MergeContactsDialog';
import { AlertTriangle, Users, GitMerge } from 'lucide-react';

export const DuplicateContactsPanel = React.memo(function DuplicateContactsPanel() {
  const { data: duplicates, isLoading, refetch } = useDuplicateContacts();
  const [mergeState, setMergeState] = useState<{ open: boolean; primaryId: string; secondaryId: string }>({
    open: false,
    primaryId: '',
    secondaryId: ''
  });

  if (isLoading) return <Card className="border-warning/30"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Contatos Duplicados</CardTitle></CardHeader><CardContent><Skeleton className="h-24" /></CardContent></Card>;
  if (!duplicates || duplicates.length === 0) return null;

  return (
    <Card className="border-warning/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />Contatos Duplicados
          <Badge variant="outline" className="text-[10px] ml-auto text-warning border-warning/30">{duplicates.length} encontrados</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Contatos com dados semelhantes que podem ser mesclados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {duplicates.map((dup, i) => (
            <div key={dup.id || dup.contact_id || i} className="flex items-center justify-between p-2.5 rounded-lg bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0"><Users className="h-4 w-4 text-warning" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{dup.full_name || dup.contact_name || `${dup.first_name || ''} ${dup.last_name || ''}`.trim() || 'N/A'}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {dup.email && <span className="truncate">{dup.email}</span>}
                    {dup.phone && <span>{dup.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dup.similarity_score != null && <Badge variant="outline" className="text-[10px] shrink-0">{(dup.similarity_score * 100).toFixed(0)}% similar</Badge>}
                {dup.duplicate_of && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-2 text-xs gap-1.5 hover:bg-warning/20 hover:text-warning"
                    onClick={() => setMergeState({ open: true, primaryId: dup.duplicate_of!, secondaryId: dup.id || dup.contact_id! })}
                  >
                    <GitMerge className="h-3.5 w-3.5" />
                    Mesclar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <MergeContactsDialog 
          open={mergeState.open} 
          onOpenChange={(open) => setMergeState(prev => ({ ...prev, open }))}
          primaryId={mergeState.primaryId}
          secondaryId={mergeState.secondaryId}
          onSuccess={() => refetch()}
        />
      </CardContent>
    </Card>
  );
});

export default DuplicateContactsPanel;
