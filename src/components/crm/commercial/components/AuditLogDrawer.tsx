import { 
  History, 
  Clock, 
  User, 
  Settings,
   Tag,
   Eye
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  change_type: string;
  created_at: string;
  changed_fields?: string[];
  new_values?: { interests?: string[]; keywords?: string[] } & Record<string, unknown>;
  previous_values?: Record<string, unknown>;
}

interface Props {
  logs: AuditLogEntry[];
}

export function AuditLogDrawer({ logs }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
          <History className="h-3.5 w-3.5" />
          Histórico Psicográfico
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Audit Log Psicográfico
          </SheetTitle>
          <SheetDescription>
            Rastreabilidade completa de mudanças no perfil e rotinas de IA.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-6">
            {!logs || logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed">
                <History className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum registro de alteração encontrado.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="relative pl-6 pb-6 border-l-2 border-muted last:pb-0">
                  <div className="absolute -left-[9px] top-0 p-1 rounded-full bg-background border-2 border-primary">
                    {log.change_type === 'manual' ? <User className="h-2 w-2 text-primary" /> : <Settings className="h-2 w-2 text-primary" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {log.change_type}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-muted/50 space-y-3">
                       <div className="flex flex-wrap gap-1.5 mb-2">
                         {log.changed_fields?.map((field: string) => (
                           <Badge key={field} variant="secondary" className="text-[9px] h-4 bg-primary/10 text-primary border-none gap-1">
                             <Tag className="h-2.5 w-2.5 opacity-50" />
                             {field}
                           </Badge>
                         ))}
                       </div>

                       {log.new_values && (
                         <div className="mb-3">
                           <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                             <Eye className="h-3 w-3" />
                             Preview de Interesses
                           </div>
                           <div className="flex flex-wrap gap-1">
                             {(log.new_values.interests || log.new_values.keywords || []).slice(0, 5).map((item: string, i: number) => (
                               <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                 {item}
                               </span>
                             ))}
                             {(log.new_values.interests?.length > 5 || log.new_values.keywords?.length > 5) && (
                               <span className="text-[10px] text-slate-400 font-medium">...</span>
                             )}
                           </div>
                         </div>
                       )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">Anterior</span>
                          <div className="text-[11px] font-mono bg-background/50 p-1.5 rounded border leading-tight truncate">
                            {JSON.stringify(log.previous_values) === '{}' ? 'Vazio' : JSON.stringify(log.previous_values)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-emerald-600">Novo</span>
                          <div className="text-[11px] font-mono bg-emerald-50/30 p-1.5 rounded border border-emerald-100 leading-tight truncate">
                            {JSON.stringify(log.new_values)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
