 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Switch } from '@/components/ui/switch';
 import { Copy, Trash2, ExternalLink, Settings2 } from 'lucide-react';
 import { Link } from 'react-router-dom';
 import { MarketingForm } from '@/hooks/useForms';
 import { motion, AnimatePresence } from 'framer-motion';
 
 interface FormListProps {
   forms: MarketingForm[];
   onTogglePublish: (id: string, is_published: boolean) => void;
   onCopyUrl: (slug: string) => void;
   onRemove: (id: string) => void;
 }
 
 export function FormList({ forms, onTogglePublish, onCopyUrl, onRemove }: FormListProps) {
   return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       <AnimatePresence mode="popLayout">
         {forms.map((form) => (
           <motion.div
             key={form.id}
             layout
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
           >
             <Card className="h-full border-border/50 hover:border-primary/50 transition-colors group">
               <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                 <div className="space-y-1 min-w-0 pr-4">
                   <CardTitle className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                     {form.name}
                   </CardTitle>
                   <div className="flex items-center gap-2">
                     <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                       /f/{form.slug}
                     </code>
                   </div>
                 </div>
                 <Switch 
                   checked={form.is_published} 
                   onCheckedChange={(v) => onTogglePublish(form.id, v)}
                   className="data-[state=checked]:bg-emerald-500"
                 />
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4 py-2">
                   <div className="space-y-0.5">
                     <p className="text-[10px] text-muted-foreground uppercase font-medium">Views</p>
                     <p className="text-lg font-bold">{form.view_count}</p>
                   </div>
                   <div className="space-y-0.5">
                     <p className="text-[10px] text-muted-foreground uppercase font-medium">Envios</p>
                     <p className="text-lg font-bold">{form.submission_count}</p>
                   </div>
                 </div>
 
                 <div className="flex flex-wrap gap-1.5">
                   <Button asChild size="sm" variant="secondary" className="flex-1 text-xs h-8 gap-2">
                     <Link to={`/marketing/forms/${form.id}`}>
                       <Settings2 className="w-3.5 h-3.5" /> Configurar
                     </Link>
                   </Button>
                   <div className="flex gap-1">
                     <Button 
                       size="icon" aria-label="Copiar" 
                       variant="outline" 
                       className="h-8 w-8 hover:bg-primary/10 hover:text-primary border-border/50" 
                       onClick={() => onCopyUrl(form.slug)}
                       title="Copiar URL"
                     >
                       <Copy className="w-3.5 h-3.5" />
                     </Button>
                     {form.is_published && (
   <Button asChild size="icon" aria-label="Abrir em nova aba" variant="outline" className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600 border-border/50">
                         <a href={`/f/${form.slug}`} target="_blank" rel="noreferrer">
                           <ExternalLink className="w-3.5 h-3.5" />
                         </a>
                       </Button>           </Bu<Button 
                       size="icon" aria-label="Remover" 
                       variant="outline" 
                       className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive border-border/50" 
                       onClick={() => onRemove(form.id)}
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                     </Button>ame="w-3.5 h-3.5" />
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </motion.div>
         ))}
       </AnimatePresence>
     </div>
   );
 }