 import { Download, Trash2, Tag, FileText, CheckCircle2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { motion, AnimatePresence } from 'framer-motion';
 import { toast } from 'sonner';
 import type { Interaction } from '@/hooks/useInteractions';
 
 interface InteractionBatchActionsProps {
   selectedIds: string[];
   interactions: Interaction[];
   onClearSelection: () => void;
   onDelete?: (ids: string[]) => Promise<void>;
 }
 
 export function InteractionBatchActions({ 
   selectedIds, 
   interactions, 
   onClearSelection,
   onDelete 
 }: InteractionBatchActionsProps) {
   const count = selectedIds.length;
   if (count === 0) return null;
 
   const handleExportCSV = () => {
     const selected = interactions.filter(i => selectedIds.includes(i.id));
     const headers = ['Data', 'Título', 'Tipo', 'Sentimento', 'Conteúdo'];
     const rows = selected.map(i => [
       new Date(i.created_at).toLocaleDateString(),
       i.title,
       i.type,
       i.sentiment || 'neutral',
       (i.content || '').replace(/\n/g, ' ')
     ]);
     
     const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.setAttribute('href', url);
     link.setAttribute('download', `interacoes_export_${Date.now()}.csv`);
     link.click();
     toast.success(`${count} interações exportadas com sucesso!`);
   };
 
   return (
     <AnimatePresence mode="wait">
       <motion.div 
         initial={{ y: 50, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         exit={{ y: 50, opacity: 0 }}
         className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-foreground text-background rounded-full shadow-2xl border border-border flex items-center gap-4 min-w-[300px]"
       >
         <div className="flex items-center gap-2 border-r border-background/20 pr-4">
           <Badge variant="secondary" className="bg-primary text-primary-foreground font-mono">
             {count}
           </Badge>
           <span className="text-sm font-medium">selecionados</span>
         </div>
         
         <div className="flex items-center gap-2">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={handleExportCSV}
             className="h-8 text-background hover:bg-background/10 gap-1.5"
           >
             <Download className="w-4 h-4" />
             CSV
           </Button>
           
           <Button 
             variant="ghost" 
             size="sm" 
             className="h-8 text-background hover:bg-background/10 gap-1.5"
             onClick={() => toast.info('Funcionalidade em desenvolvimento')}
           >
             <Tag className="w-4 h-4" />
             Tag
           </Button>
 
           {onDelete && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => onDelete(selectedIds)}
               className="h-8 text-destructive hover:bg-destructive/10 gap-1.5"
             >
               <Trash2 className="w-4 h-4" />
               Excluir
             </Button>
           )}
         </div>
         
         <Button 
           variant="ghost" 
           size="icon" 
           onClick={onClearSelection}
           className="h-8 w-8 text-background hover:bg-background/20 rounded-full"
         >
           <CheckCircle2 className="w-5 h-5" />
         </Button>
       </motion.div>
     </AnimatePresence>
   );
 }