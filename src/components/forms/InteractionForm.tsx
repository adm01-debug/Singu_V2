import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
 import { MessageSquare, Loader2, Mic, Tag, Lightbulb, Paperclip } from 'lucide-react';
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
  follow_up_required: z.boolean().optional(),
   follow_up_date: z.string().optional().nullable(),
   tags: z.array(z.string()).optional(),
   key_insights: z.array(z.string()).optional(),
   audio_url: z.string().optional().nullable(),
   transcription: z.string().optional().nullable(),
   attachments: z.array(z.string()).optional(),
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
      follow_up_required: interaction?.follow_up_required || false,
       follow_up_date: interaction?.follow_up_date || '',
       tags: (interaction?.tags as string[]) || [],
       key_insights: (interaction?.key_insights as string[]) || [],
       audio_url: interaction?.audio_url || null,
       transcription: interaction?.transcription || null,
       attachments: (interaction?.attachments as string[]) || [],
    },
  });

  // Auto-save draft (only for new interactions)
  const draftKey = interaction ? `interaction-edit-${interaction.id}` : 'interaction-new';
  const { clearDraft } = useFormDraft(form, {
    key: draftKey,
    enabled: !interaction,
  });

  const selectedContactId = form.watch('contact_id');
  const followUpRequired = form.watch('follow_up_required');

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

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="15" 
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) * 60 : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
