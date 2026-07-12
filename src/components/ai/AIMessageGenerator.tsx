import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIWritingAssistant } from '@/hooks/useAIWritingAssistant';
import type { MessageType, MessageTone, PersuasionFramework } from '@/hooks/useAIWritingAssistant';
import { useToast } from '@/hooks/use-toast';
 import { Sparkles, Copy, CheckCircle, Loader2, Wand2 } from 'lucide-react';
 const FRAMEWORKS = [
   { value: 'None', label: 'Sem Framework' },
   { value: 'AIDA', label: 'AIDA (Atenção/Interesse)' },
   { value: 'PAS', label: 'PAS (Problema/Solução)' },
   { value: 'FAB', label: 'FAB (Vantagem/Benefício)' },
   { value: '4Ps', label: '4Ps (Promessa/Prova)' },
   { value: 'Storytelling', label: 'Storytelling' },
 ] as const;
 
import { motion, AnimatePresence } from 'framer-motion';
import type { Contact } from '@/hooks/useContacts';

interface AIMessageGeneratorProps {
  contact: Contact;
  companyName?: string;
  discProfile?: string | null;
}

const MESSAGE_TYPES = [
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'introduction', label: 'Apresentação' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'thank_you', label: 'Agradecimento' },
  { value: 'meeting_request', label: 'Solicitar Reunião' },
  { value: 'custom', label: 'Personalizado' },
] as const;

const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Amigável' },
  { value: 'casual', label: 'Casual' },
] as const;

export function AIMessageGenerator({ contact, companyName, discProfile }: AIMessageGeneratorProps) {
  const { suggestions, loading, error, generateSuggestions, clearSuggestions } = useAIWritingAssistant();
  const { toast } = useToast();
   const [messageType, setMessageType] = useState<MessageType>('follow_up');
   const [tone, setTone] = useState<MessageTone>('friendly');
   const [framework, setFramework] = useState<PersuasionFramework>('None');
  const [context, setContext] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    await generateSuggestions({
      contact: {
        firstName: contact.first_name,
        lastName: contact.last_name,
        roleTitle: contact.role_title || undefined,
        companyName: companyName || undefined,
        discProfile: discProfile || undefined,
        hobbies: contact.hobbies || undefined,
        interests: contact.interests || undefined,
      },
       messageType,
       tone,
       framework,
       customContext: context || undefined,
     });
  };

  const copyMessage = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast({ title: 'Copiado!', description: 'Mensagem copiada para a área de transferência.' });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Assistente de Mensagens IA</CardTitle>
          </div>
          {discProfile && (
            <Badge variant="outline" className="text-xs">DISC: {discProfile}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de Mensagem</label>
            <Select value={messageType} onValueChange={(v) => setMessageType(v as MessageType)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div>
             <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tom</label>
             <Select value={tone} onValueChange={(v) => setTone(v as MessageTone)}>
               <SelectTrigger className="h-9">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {TONES.map(t => (
                   <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <div>
             <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Framework</label>
             <Select value={framework} onValueChange={(v) => setFramework(v as PersuasionFramework)}>
               <SelectTrigger className="h-9">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {FRAMEWORKS.map(f => (
                   <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>

        {messageType === 'custom' && (
          <Textarea
            placeholder="Descreva o contexto ou objetivo da mensagem..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[80px]"
          />
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando sugestões...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Gerar Sugestões para {contact.first_name}
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {suggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-muted/40 rounded-lg p-4 space-y-2"
                >
                  {suggestion.subject && (
                    <p className="text-xs font-medium text-muted-foreground">
                      Assunto: {suggestion.subject}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {suggestion.message}
                  </p>
                  {suggestion.reasoning && (
                    <p className="text-xs text-muted-foreground italic">
                      💡 {suggestion.reasoning}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      variant={copiedIdx === idx ? "default" : "outline"}
                      size="sm"
                      onClick={() => copyMessage(suggestion.message, idx)}
                      className="gap-1.5"
                    >
                      {copiedIdx === idx ? (
                        <><CheckCircle className="w-3 h-3" /> Copiado!</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copiar</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearSuggestions}
                className="w-full text-muted-foreground"
              >
                Limpar sugestões
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
