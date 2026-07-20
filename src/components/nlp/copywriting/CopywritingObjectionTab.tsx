 import React, { useState } from 'react';
import { logger } from "@/lib/logger";
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { ShieldAlert, Loader2, Copy, CheckCircle, Brain, AlertCircle } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { logger } from '@/lib/logger';
 import { Contact } from '@/types';
 import { toast } from 'sonner';
 
 interface Props {
   contact: Contact;
 }
 
 interface ObjectionResponse {
   title: string;
   description: string;
   suggested_message: string;
   urgency: string;
   reasoning: string;
   confidence: number;
 }
 
 const COMMON_OBJECTIONS = [
   { id: 'price_too_high', label: 'Está muito caro' },
   { id: 'need_to_think', label: 'Preciso pensar / Falar com sócio' },
   { id: 'not_now', label: 'Agora não é o momento' },
   { id: 'no_budget', label: 'Não tenho orçamento' },
   { id: 'competitor_better', label: 'O concorrente é melhor/mais barato' },
   { id: 'trust_issue', label: 'Não conheço bem sua empresa' },
 ];
 
 export function CopywritingObjectionTab({ contact }: Props) {
   const [loading, setLoading] = useState(false);
   const [selectedObjection, setSelectedObjection] = useState('');
   const [response, setResponse] = useState<ObjectionResponse | null>(null);
   const [copied, setCopied] = useState(false);
 
   const handleObjection = async () => {
     if (!selectedObjection) return;
     setLoading(true);
     try {
       const { data, error } = await supabase.functions.invoke('objection-handler', {
         body: {
           contactId: contact.id,
           objectionId: selectedObjection,
         }
       });
 
       if (error) throw error;
       setResponse(data.suggestion);
       toast.success('Estratégia de contorno gerada!');
     } catch (error) {
       logger.error('Error handling objection:', error);
       toast.error('Erro ao gerar contorno de objeção.');
     } finally {
       setLoading(false);
     }
   };
 
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     setCopied(true);
     toast.success('Copiado!');
     setTimeout(() => setCopied(false), 2000);
   };
 
   return (
     <div className="space-y-6">
       <div className="bg-muted/50 rounded-lg p-4 border border-primary/10">
         <h4 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
           <ShieldAlert className="h-4 w-4 text-primary" />
           Tratador de Objeções Inteligente
         </h4>
         
         <p className="text-sm text-muted-foreground mb-4">
           Selecione a objeção que o cliente apresentou. A IA usará o perfil <Badge variant="outline">{contact.behavior?.discProfile || 'Não Identificado'}</Badge> para gerar o melhor contorno.
         </p>
 
         <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
           {COMMON_OBJECTIONS.map((obj) => (
             <Button
               key={obj.id}
               variant={selectedObjection === obj.id ? 'default' : 'outline'}
               className="text-xs h-auto py-2 px-3 text-left justify-start"
               onClick={() => setSelectedObjection(obj.id)}
             >
               {obj.label}
             </Button>
           ))}
         </div>
 
         <Button 
           className="w-full" 
           disabled={!selectedObjection || loading}
           onClick={handleObjection}
         >
           {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
           Gerar Contorno de Objeção
         </Button>
       </div>
 
       {response && (
         <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
           <CardContent className="p-6">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Badge className={response.urgency === 'high' ? 'bg-destructive' : 'bg-warning'}>
                   {response.urgency.toUpperCase()}
                 </Badge>
                 <h5 className="font-bold">{response.title}</h5>
               </div>
               <Badge variant="outline" className="text-success border-success/30 bg-success/5">
                 {response.confidence}% Confiança
               </Badge>
             </div>
 
             <p className="text-sm text-muted-foreground mb-4">
               {response.description}
             </p>
 
             <div className="relative group mb-4">
               <div className="bg-white border rounded-lg p-4 text-sm leading-relaxed italic">
                 "{response.suggested_message}"
               </div>
               <Button 
                 size="icon" aria-label="Confirmar" 
                 variant="outline" 
                 className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                 onClick={() => copyToClipboard(response.suggested_message)}
               >
                 {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
               </Button>
             </div>
 
             <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
               <div className="flex items-center gap-2 mb-2">
                 <Brain className="h-4 w-4 text-primary" />
                 <span className="text-xs font-bold uppercase text-primary">Por que isso funciona?</span>
               </div>
               <p className="text-xs leading-normal">
                 {response.reasoning}
               </p>
             </div>
           </CardContent>
         </Card>
       )}
 
       {!response && !loading && (
         <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
           <AlertCircle className="h-12 w-12 opacity-10 mb-2" />
           <p className="text-sm">Selecione uma objeção acima para ver a recomendação estratégica.</p>
         </div>
       )}
     </div>
   );
 }