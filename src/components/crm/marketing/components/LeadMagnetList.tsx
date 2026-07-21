 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Switch } from '@/components/ui/switch';
 import { Badge } from '@/components/ui/badge';
 import { Copy, Trash2, ExternalLink, Settings2 } from 'lucide-react';
 import { Link } from 'react-router-dom';
 import { LeadMagnet } from '@/hooks/useLeadMagnets';
 import { motion, AnimatePresence } from 'framer-motion';
 
 interface LeadMagnetListProps {
   magnets: LeadMagnet[];
   onTogglePublish: (id: string, is_published: boolean) => void;
   onCopyUrl: (slug: string) => void;
   onRemove: (id: string) => void;
 }
 
 const magnetColors: Record<LeadMagnet['type'], string> = {
   ebook: 'bg-blue-500',
   webinar: 'bg-purple-500',
   template: 'bg-emerald-500',
   video: 'bg-rose-500',
   whitepaper: 'bg-amber-500',
   checklist: 'bg-cyan-500',
   other: 'bg-slate-500',
 };
 
 export function LeadMagnetList({ magnets, onTogglePublish, onCopyUrl, onRemove }: LeadMagnetListProps) {
   return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       <AnimatePresence mode="popLayout">
         {magnets.map((magnet) => (
           <motion.div
             key={magnet.id}
             layout
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
           >
             <Card className="h-full border-border/50 hover:border-primary/50 transition-all group overflow-hidden">
               <div className={`h-1 w-full ${magnetColors[magnet.type] || 'bg-primary'}`} />
               <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                 <div className="space-y-1 min-w-0 pr-4">
                   <div className="flex items-center gap-2 mb-1">
                     <Badge variant="outline" className="text-[10px] capitalize font-semibold tracking-wide">
                       {magnet.type}
                     </Badge>
                   </div>
                   <CardTitle className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                     {magnet.title}
                   </CardTitle>
                 </div>
                 <Switch 
                   checked={magnet.is_published} 
                   onCheckedChange={(v) => onTogglePublish(magnet.id, v)}
                   className="data-[state=checked]:bg-emerald-500"
                 />
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Views</span>
                     <span className="text-base font-bold">{magnet.view_count}</span>
                   </div>
                   <div className="w-px h-8 bg-border/50" />
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Downloads</span>
                     <span className="text-base font-bold">{magnet.download_count}</span>
                   </div>
                   <div className="w-px h-8 bg-border/50" />
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Conversion</span>
                     <span className="text-base font-bold">
                       {magnet.view_count > 0 ? Math.round((magnet.download_count / magnet.view_count) * 100) : 0}%
                     </span>
                   </div>
                 </div>
 
                 <div className="flex flex-wrap gap-1.5 pt-2">
                   <Button asChild size="sm" variant="secondary" className="flex-1 text-xs h-8 gap-2">
                     <Link to={`/marketing/lead-magnets/${magnet.id}`}>
                       <Settings2 className="w-3.5 h-3.5" /> Editar
                     </Link>
                   </Button>
                   <div className="flex gap-1">
                     <Button 
                       size="icon" aria-label="Copiar" 
                       variant="outline" 
                       className="h-8 w-8 border-border/50 hover:bg-primary/10 hover:text-primary" 
                       onClick={() => onCopyUrl(magnet.slug)}
                       title="Copiar URL"
                     >
                       <Copy className="w-3.5 h-3.5" />
                     </Button>
                     {magnet.is_published && (
   <Button asChild size="icon" aria-label="Abrir em nova aba" variant="outline" className="h-8 w-8 border-border/50 hover:bg-emerald-500/10 hover:text-emerald-600">
                         <a href={`/lm/${magnet.slug}`} target="_blank" rel="noreferrer">
                           <ExternalLink className="w-3.5 h-3.5" />
                         </a>
                       </Button>
                       <Button 
                       size="icon" aria-label="Remover" 
                       variant="outline" 
                       className="h-8 w-8 border-border/50 hover:bg-destructive/10 hover:text-destructive" 
                       onClick={() => onRemove(magnet.id)}
                     >
                       <Trash2 className="w-3.5 h-3.5" />
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