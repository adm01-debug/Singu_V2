import { AlertCircle, User, MessageSquare, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useContactsSemApelido } from '@/hooks/useContactsSemApelidoView';
import { useInteracoesSemApelido } from '@/hooks/useInteracoesSemApelidoView';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DataQualityWidget() {
  const { data: semApelido = [], isLoading: l1, error: e1, refetch: r1 } = useContactsSemApelido(10);
  const { data: interacoesSA = [], isLoading: l2, error: e2, refetch: r2 } = useInteracoesSemApelido(10);

  const isLoading = l1 || l2;
  const error = e1 || e2;
  const refetch = () => { r1(); r2(); };
  const hasData = semApelido.length > 0 || interacoesSA.length > 0;

  return (
    <ExternalDataCard
      title="Qualidade de Dados"
      icon={<AlertCircle className="h-4 w-4 text-warning" />}
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      emptyMessage="Todos os contatos possuem apelidos configurados ✓"
      onRetry={refetch}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Qualidade de Dados
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {semApelido.length + interacoesSA.length} pendências
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contacts without nickname */}
          {semApelido.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                <User className="h-3 w-3" />
                Contatos sem Apelido ({semApelido.length})
              </p>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1">
                  {semApelido.map((c) => (
                    <div key={c.contact_id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{c.full_name}</p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {c.empresa && (
                            <span className="flex items-center gap-0.5 truncate">
                              <Building2 className="h-2.5 w-2.5" />{c.empresa}
                            </span>
                          )}
                          {c.cargo && <span>{c.cargo}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {c.total_interacoes != null && (
                          <Badge variant="outline" className="text-[9px]">{c.total_interacoes} int.</Badge>
                        )}
                        {c.prioridade_preenchimento && (
                          <Badge
                            variant={c.prioridade_preenchimento === 'alta' ? 'destructive' : 'secondary'}
                            className="text-[9px]"
                          >
                            {c.prioridade_preenchimento}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Interactions without nickname */}
          {interacoesSA.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                <MessageSquare className="h-3 w-3" />
                Interações sem Apelido ({interacoesSA.length})
              </p>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1">
                  {interacoesSA.map((i) => (
                    <div key={i.interaction_id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{i.full_name}</p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {i.canal && <Badge variant="outline" className="text-[9px]">{i.canal}</Badge>}
                          {i.vendedor && <span>{i.vendedor}</span>}
                        </div>
                      </div>
                      {i.data_interacao && (
                        <span className="text-muted-foreground text-[10px] flex-shrink-0">
                          {formatDistanceToNow(new Date(i.data_interacao), { addSuffix: true, locale: ptBR })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
