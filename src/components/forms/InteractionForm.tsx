 import { useMemo } from 'react';
 import { useForm } from 'react-hook-form';
 import { zodResolver } from '@hookform/resolvers/zod';
 import { z } from 'zod';
 import { motion } from 'framer-motion';
 import { cn } from '@/lib/utils';
import { useFormDraft } from '@/hooks/useFormDraft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
  import { MessageSquare, Loader2, Mic, Tag, Lightbulb, Paperclip, X as CloseIcon, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
 import { NLPRealtimeCoach } from '@/components/nlp/NLPRealtimeCoach';
 import { supabase } from '@/integrations/supabase/client';
 import { logger } from '@/lib/logger';
 import { toast } from 'sonner';
 import { VoiceInput } from '@/components/voice/VoiceInput';
 import type { Interaction } from '@/hooks/useInteractions';
import type { Contact } from '@/hooks/useContacts';

const interactionSchema = z.object({
  contact_id: z.string().uuid('Selecione um contato'),
  company_id: z.string().uuid().optional().nullable(),
  type: z.string().min(1, 'Tipo é obrigatório'),
  title: z.string().trim().min(1, 'Título é obrigatório').max(200, 'Máximo 200 caracteres'),
   content: z.string().trim().max(5000, 'Máximo 5000 caracteres').optional().nullable(),
  sentiment: z.string().optional(),
  initiated_by: z.string().optional(),
   duration: z.number().min(0).optional().nullable(),
   response_time: z.number().min(0).optional().nullable(),
  follow_up_required: z.boolean().optional(),
   follow_up_date: z.string().optional().nullable(),
   tags: z.array(z.string()).optional(),
   key_insights: z.array(z.string()).optional(),
   audio_url: z.string().optional().nullable(),
   transcription: z.string().optional().nullable(),
   attachments: z.array(z.string()).optional(),
   neuro_pnl_technique: z.string().optional().nullable(),
   neuro_pnl_result: z.string().optional().nullable(),
 });

type InteractionFormData = z.infer<typeof interactionSchema>;

interface InteractionFormProps {
  interaction?: Interaction | null;
  contacts: Contact[];
  defaultContactId?: string;
  defaultCompanyId?: string;
  onSubmit: (data: InteractionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const typeOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Ligação' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'note', label: 'Nota' },
  { value: 'social', label: 'Rede Social' },
];

const sentimentOptions = [
  { value: 'positive', label: 'Positivo' },
  { value: 'neutral', label: 'Neutro' },
  { value: 'negative', label: 'Negativo' },
];

const initiatedByOptions = [
  { value: 'us', label: 'Nós' },
  { value: 'them', label: 'Contato' },
];

export function InteractionForm({ 
  interaction, 
  contacts, 
  defaultContactId,
  defaultCompanyId,
  onSubmit, 
  onCancel, 
  isSubmitting 
}: InteractionFormProps) {
  const form = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    mode: 'onBlur',
    defaultValues: {
      contact_id: interaction?.contact_id || defaultContactId || '',
      company_id: interaction?.company_id || defaultCompanyId || null,
      type: interaction?.type || 'whatsapp',
      title: interaction?.title || '',
      content: interaction?.content || '',
      sentiment: interaction?.sentiment || 'neutral',
      initiated_by: interaction?.initiated_by || 'us',
       duration: interaction?.duration || null,
       response_time: interaction?.response_time || null,
      follow_up_required: interaction?.follow_up_required || false,
       follow_up_date: interaction?.follow_up_date || '',
       tags: (interaction?.tags as string[]) || [],
       key_insights: (interaction?.key_insights as string[]) || [],
       audio_url: interaction?.audio_url || null,
        transcription: interaction?.transcription || null,
        attachments: (interaction?.attachments as string[]) || [],
         neuro_pnl_technique: (interaction as { neuro_pnl_technique?: string } | undefined)?.neuro_pnl_technique || '',
         neuro_pnl_result: (interaction as { neuro_pnl_result?: string } | undefined)?.neuro_pnl_result || '',
     },
  });

  // Auto-save draft (only for new interactions)
  const draftKey = interaction ? `interaction-edit-${interaction.id}` : 'interaction-new';
  const { clearDraft } = useFormDraft(form, {
    key: draftKey,
    enabled: !interaction,
  });

    const selectedContactId = form.watch('contact_id');
    const content = form.watch('content');
    const sentiment = form.watch('sentiment');
    const followUpRequired = form.watch('follow_up_required');
    // Relationship Impact Predictor Logic (10/10 Excellence)
    const impactPrediction = useMemo(() => {
      if (!content || content.length < 10) return { impact: 0, label: 'Neutro', icon: Minus, color: 'text-muted-foreground' };
      
      let score = 0;
      const lowerContent = content.toLowerCase();
      
      if (sentiment === 'positive') score += 5;
      if (sentiment === 'negative') score -= 10;
      
      if (lowerContent.includes('fechado') || lowerContent.includes('contrato') || lowerContent.includes('sucesso')) score += 8;
      if (lowerContent.includes('obrigado') || lowerContent.includes('elogio')) score += 3;
      if (lowerContent.includes('problema') || lowerContent.includes('atraso') || lowerContent.includes('reclamação')) score -= 5;
      if (lowerContent.includes('cancelar') || lowerContent.includes('caro')) score -= 7;
      
      if (score > 2) return { impact: score, label: 'Positivo', icon: TrendingUp, color: 'text-success' };
      if (score < -2) return { impact: score, label: 'Crítico', icon: TrendingDown, color: 'text-destructive' };
      return { impact: score, label: 'Estável', icon: Minus, color: 'text-muted-foreground' };
    }, [content, sentiment]);

   const attachments = form.watch('attachments') || [];
 
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     try {
       const fileName = `${Date.now()}-${file.name}`;
       const { data: uploadData, error: uploadError } = await supabase.storage
         .from('interaction-attachments')
         .upload(`${(await supabase.auth.getUser()).data.user?.id}/${fileName}`, file);
 
       if (uploadError) throw uploadError;
 
       if (uploadData) {
         const { data: urlData } = supabase.storage
           .from('interaction-attachments')
           .getPublicUrl(uploadData.path);
         const currentAttachments = form.getValues('attachments') || [];
         form.setValue('attachments', [...currentAttachments, urlData.publicUrl]);
         toast.success('Anexo enviado com sucesso');
       }
     } catch (error) {
       logger.error('Error uploading attachment:', error);
       toast.error('Erro ao enviar anexo');
     }
   };

  // Update company_id when contact changes
  const handleContactChange = (contactId: string) => {
    form.setValue('contact_id', contactId);
    const contact = contacts.find(c => c.id === contactId);
    if (contact?.company_id) {
      form.setValue('company_id', contact.company_id);
    }
  };

  const handleSubmit = async (data: InteractionFormData) => {
    const cleanedData = {
      ...data,
      content: data.content || null,
       duration: data.duration || null,
       response_time: data.response_time || null,
      follow_up_date: data.follow_up_required && data.follow_up_date ? data.follow_up_date : null,
      company_id: data.company_id || null,
    };
    await onSubmit(cleanedData as InteractionFormData);
    clearDraft();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">
              {interaction ? 'Editar Interação' : 'Nova Interação'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {interaction ? 'Atualize os detalhes da interação' : 'Registre uma nova interação'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contato *</FormLabel>
                <Select onValueChange={handleContactChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Título *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Discussão sobre proposta comercial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Detalhes</FormLabel>
                   <VoiceInput
                     uploadAudio
                     onTranscription={(text, audioUrl) => {
                       const currentContent = field.value || '';
                       const newContent = currentContent 
                         ? `${currentContent}\n\n${text}` 
                         : text;
                       field.onChange(newContent);
                       if (audioUrl) form.setValue('audio_url', audioUrl);
                       form.setValue('transcription', text);
                     }}
                     placeholder="Gravar por voz"
                     className="text-xs"
                   />
                </div>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva os detalhes da interação ou use o microfone para gravar..."
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="flex items-center gap-1 text-xs">
                  <Mic className="w-3 h-3" />
                  Use o microfone para adicionar notas por voz
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

            <div className="md:col-span-2 space-y-4">
              {/* Impact Predictor UI */}
              {content && content.length > 10 && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="p-3 bg-muted/40 rounded-xl border border-dashed border-border flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full bg-background shadow-sm", impactPrediction.color)}>
                      <impactPrediction.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Impacto Estimado</p>
                      <p className={cn("text-sm font-semibold", impactPrediction.color)}>{impactPrediction.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-lg font-mono font-bold", impactPrediction.color)}>
                      {impactPrediction.impact > 0 ? '+' : ''}{impactPrediction.impact}
                    </span>
                    <p className="text-[10px] text-muted-foreground">pontos score</p>
                  </div>
                </motion.div>
              )}

              <NLPRealtimeCoach 
                content={form.watch('content') || ''} 
                contactId={selectedContactId} 
                onApplySuggestion={(suggestion) => {
                   const currentContent = form.getValues('content') || '';
                   form.setValue('content', currentContent ? `${currentContent}\n\n${suggestion}` : suggestion);
                   toast.success('Sugestão aplicada à interação!');
                 }}
               />
             </div>
 
          <FormField
            control={form.control}
            name="sentiment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sentimento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sentimentOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initiated_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Iniciado por</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {initiatedByOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

           <div className="grid grid-cols-2 gap-4">
             <FormField
               control={form.control}
               name="duration"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Duração (min)</FormLabel>
                   <FormControl>
                     <Input 
                       type="number" 
                       placeholder="15" 
                       {...field}
                       value={field.value ? field.value / 60 : ''}
                       onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) * 60 : null)}
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="response_time"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Tempo Resposta (min)</FormLabel>
                   <FormControl>
                     <Input 
                       type="number" 
                       placeholder="10" 
                       {...field}
                       value={field.value || ''}
                       onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
           </div>

          <FormField
            control={form.control}
            name="follow_up_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Requer follow-up</FormLabel>
                  <FormDescription>
                    Marque se precisa de acompanhamento
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

           {followUpRequired && (
             <FormField
               control={form.control}
               name="follow_up_date"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Data do Follow-up</FormLabel>
                   <FormControl>
                     <Input type="date" {...field} value={field.value || ''} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
           )}
 
           <FormField
             control={form.control}
             name="tags"
             render={({ field }) => (
               <FormItem>
                 <FormLabel className="flex items-center gap-1">
                   <Tag className="w-3 h-3" /> Tags
                 </FormLabel>
                 <FormControl>
                   <Input 
                     placeholder="venda, proposta, suporte (separe por vírgula)" 
                     value={(field.value || []).join(', ')} 
                     onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
 
           <FormField
             control={form.control}
             name="key_insights"
             render={({ field }) => (
               <FormItem className="md:col-span-2">
                 <FormLabel className="flex items-center gap-1">
                   <Lightbulb className="w-3 h-3" /> Insights-chave
                 </FormLabel>
                 <FormControl>
                   <Input 
                     placeholder="Digite os principais aprendizados (separe por vírgula)" 
                     value={(field.value || []).join(', ')} 
                     onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
 
           <div className="md:col-span-2 p-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30 space-y-4">
             <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase text-xs">
               <Sparkles className="h-4 w-4" /> Sessão de Neuro-PNL
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="neuro_pnl_technique"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel className="text-[10px] uppercase text-indigo-600">Técnica Utilizada</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                       <FormControl>
                         <SelectTrigger className="h-8 text-xs border-indigo-200">
                           <SelectValue placeholder="Selecione a técnica" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="swish">Padrão Swish</SelectItem>
                         <SelectItem value="reframing">Ressignificação</SelectItem>
                         <SelectItem value="anchoring">Ancoragem</SelectItem>
                         <SelectItem value="meta_model">Meta-Modelo</SelectItem>
                         <SelectItem value="milton_model">Modelo Milton</SelectItem>
                       </SelectContent>
                     </Select>
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="neuro_pnl_result"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel className="text-[10px] uppercase text-indigo-600">Resultado da Sessão</FormLabel>
                     <FormControl>
                       <Input {...field} value={field.value || ''} placeholder="Ex: Quebra de objeção limitante" className="h-8 text-xs border-indigo-200" />
                     </FormControl>
                   </FormItem>
                 )}
               />
             </div>
           </div>
 
           <div className="md:col-span-2 space-y-3">
             <FormLabel className="flex items-center gap-1">
               <Paperclip className="w-3 h-3" /> Anexos
             </FormLabel>
             <div className="flex flex-wrap gap-2">
               {attachments.map((url, i) => (
                 <div key={i} className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-xs">
                   <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[150px]">
                     {url.split('/').pop()}
                   </a>
                   <button 
                     type="button" 
                     onClick={() => form.setValue('attachments', attachments.filter((_, idx) => idx !== i))}
                     className="text-muted-foreground hover:text-destructive"
                   >
                     <CloseIcon className="w-3 h-3" />
                   </button>
                 </div>
               ))}
               <label className="cursor-pointer">
                 <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs hover:bg-primary/20 transition-colors">
                   <Paperclip className="w-3 h-3" /> Adicionar anexo
                 </div>
                 <input type="file" className="hidden" onChange={handleFileUpload} />
               </label>
             </div>
           </div>
         </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {interaction ? 'Salvar Alterações' : 'Registrar Interação'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
