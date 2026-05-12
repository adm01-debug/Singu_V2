/**
 * Componente de Card de Interação otimizado com React.memo
 * Evita re-renders desnecessários em listas grandes
 */

import { memo, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Video, 
  Users, 
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
   Clock,
   Tag,
   ArrowUpRight,
   ArrowDownLeft,
   Zap,
   Lightbulb,
   Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { cn } from '@/lib/utils';
import type { Interaction } from '@/hooks/useInteractions';
import type { SentimentType } from '@/types';

interface InteractionCardMemoProps {
  interaction: Interaction;
  contactName: string;
  companyName?: string;
  index: number;
  isHighlighted?: boolean;
  onEdit?: (interaction: Interaction) => void;
  onDelete?: (interaction: Interaction) => void;
  viewMode?: 'grid' | 'list';
}

const TYPE_CONFIG = {
  call: { icon: Phone, label: 'Ligação', color: 'text-info bg-info/10' },
  email: { icon: Mail, label: 'Email', color: 'text-secondary bg-secondary/10' },
  meeting: { icon: Users, label: 'Reunião', color: 'text-success bg-success/10' },
  video_call: { icon: Video, label: 'Videochamada', color: 'text-accent bg-accent/10' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-success bg-success/10' },
  other: { icon: Calendar, label: 'Outro', color: 'text-muted-foreground bg-muted' },
} as const;

// Função de comparação customizada
function arePropsEqual(
  prevProps: InteractionCardMemoProps,
  nextProps: InteractionCardMemoProps
): boolean {
  if (
    prevProps.isHighlighted !== nextProps.isHighlighted ||
    prevProps.index !== nextProps.index ||
    prevProps.contactName !== nextProps.contactName ||
    prevProps.companyName !== nextProps.companyName ||
    prevProps.viewMode !== nextProps.viewMode
  ) {
    return false;
  }

  if (prevProps.interaction !== nextProps.interaction) {
    const prev = prevProps.interaction;
    const next = nextProps.interaction;
    
    if (
      prev.id !== next.id ||
      prev.title !== next.title ||
      prev.type !== next.type ||
      prev.content !== next.content ||
      prev.sentiment !== next.sentiment ||
      prev.created_at !== next.created_at ||
       prev.duration !== next.duration ||
       prev.response_time !== next.response_time ||
       prev.initiated_by !== next.initiated_by ||
      prev.follow_up_required !== next.follow_up_required ||
      prev.follow_up_date !== next.follow_up_date
    ) {
      return false;
    }
    
     // Comparar arrays de tags e insights
     const prevTags = prev.tags ?? [];
     const nextTags = next.tags ?? [];
     if (prevTags.length !== nextTags.length || !prevTags.every((t, i) => t === nextTags[i])) {
       return false;
     }

     const prevInsights = prev.key_insights ?? [];
     const nextInsights = next.key_insights ?? [];
     if (prevInsights.length !== nextInsights.length || !prevInsights.every((t, i) => t === nextInsights[i])) {
       return false;
     }
  }

  return true;
}

/**
 * InteractionCardMemo - Versão otimizada do InteractionCard com memoização
 */
export const InteractionCardMemo = memo(function InteractionCardMemo({
  interaction,
  contactName,
  companyName,
  index,
  isHighlighted = false,
  onEdit,
  onDelete,
  viewMode = 'list',
}: InteractionCardMemoProps) {
  const handleEdit = useCallback(() => {
    onEdit?.(interaction);
  }, [onEdit, interaction]);

  const handleDelete = useCallback(() => {
    onDelete?.(interaction);
  }, [onDelete, interaction]);

  const config = TYPE_CONFIG[interaction.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.other;
  const Icon = config.icon;

  const formattedDate = format(new Date(interaction.created_at), "d 'de' MMM 'às' HH:mm", {
    locale: ptBR,
  });

  const isCompact = viewMode === 'list';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          isHighlighted && 'ring-2 ring-primary',
          isCompact ? 'p-3' : ''
        )}
      >
        {isCompact ? (
          // Layout compacto para lista
          <div className="flex items-center gap-4">
            <div className={cn('p-2 rounded-lg shrink-0', config.color)}>
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{interaction.title}</h4>
                {interaction.sentiment && (
                  <SentimentIndicator sentiment={interaction.sentiment as SentimentType} size="sm" />
                )}
              </div>
               <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                 {interaction.initiated_by === 'us' ? (
                   <ArrowUpRight className="w-3 h-3 text-blue-500" />
                 ) : (
                   <ArrowDownLeft className="w-3 h-3 text-green-500" />
                 )}
                 <span>{contactName}{companyName ? ` · ${companyName}` : ''}</span>
                 <span>·</span>
                 <span>{formattedDate}</span>
               </div>
            </div>

             <div className="flex items-center gap-2 shrink-0">
               {interaction.response_time && (
                 <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1 font-normal border-amber-200 bg-amber-50 text-amber-700">
                   <Zap className="w-2.5 h-2.5" />
                   {interaction.response_time}m
                 </Badge>
               )}
               {interaction.duration && (
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                   <Clock className="w-3 h-3" />
                   {Math.round(interaction.duration / 60)}m
                 </div>
               )}
             </div>

            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ) : (
          // Layout completo para grid
          <>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{interaction.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {contactName}{companyName ? ` · ${companyName}` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {interaction.sentiment && (
                    <SentimentIndicator sentiment={interaction.sentiment as SentimentType} />
                  )}
                  {(onEdit || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={handleEdit}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {interaction.content && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {interaction.content}
                </p>
              )}
              
               <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                 <div className="flex items-center gap-3 flex-wrap">
                   <div className="flex items-center gap-1.5">
                     {interaction.initiated_by === 'us' ? (
                       <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
                     ) : (
                       <ArrowDownLeft className="w-3.5 h-3.5 text-green-500" />
                     )}
                     <span>{formattedDate}</span>
                   </div>
                   {interaction.duration && (
                     <span className="flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {Math.round(interaction.duration / 60)}min
                     </span>
                   )}
                   {interaction.response_time && (
                     <span className="flex items-center gap-1 text-amber-600 font-medium">
                       <Zap className="w-3 h-3" />
                       {interaction.response_time}min resposta
                     </span>
                   )}
                 </div>
                
                {interaction.follow_up_required && (
                  <Badge variant="outline" className="text-xs">
                    Follow-up pendente
                  </Badge>
                )}
              </div>

               <div className="flex flex-wrap gap-2 pt-1">
                 {interaction.key_insights && (interaction.key_insights as string[]).length > 0 && (
                   <div className="flex items-center gap-1.5 w-full mb-1">
                     <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                     <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70">Insights:</span>
                     <span className="text-xs text-muted-foreground italic line-clamp-1">
                       {(interaction.key_insights as string[]).join(' · ')}
                     </span>
                   </div>
                 )}
                 
                 {interaction.tags && (interaction.tags as string[]).length > 0 && (
                   <div className="flex items-center gap-1.5 flex-wrap">
                     <Tag className="w-3 h-3 text-muted-foreground" />
                     {(interaction.tags as string[]).slice(0, 5).map((tag) => (
                       <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-2 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">
                         {tag}
                       </Badge>
                     ))}
                     {(interaction.tags as string[]).length > 5 && (
                       <span className="text-[10px] text-muted-foreground">
                         +{(interaction.tags as string[]).length - 5}
                       </span>
                     )}
                   </div>
                 )}

                 {(interaction as any).emotion_analysis && (
                   <div className="ml-auto flex items-center gap-1 text-[10px] text-indigo-600/80 font-medium">
                     <Activity className="w-3 h-3" />
                     EQ Analisado
                   </div>
                 )}
               </div>
            </CardContent>
          </>
        )}
      </Card>
    </motion.div>
  );
}, arePropsEqual);

export default InteractionCardMemo;
