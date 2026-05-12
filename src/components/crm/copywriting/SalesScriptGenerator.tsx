 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Badge } from '@/components/ui/badge';
 import { Wand2, UserCheck, ShieldAlert, Zap, Copy as CopyIcon, Check } from 'lucide-react';
 import { toast } from 'sonner';
 
 export const SalesScriptGenerator = () => {
   const [persona, setPersona] = useState('disc-d');
   const [stage, setStage] = useState('prospecting');
   const [channel, setChannel] = useState('whatsapp');
   const [isGenerating, setIsGenerating] = useState(false);
   const [script, setScript] = useState('');
   const [copied, setCopied] = useState(false);
 
   const generateScript = () => {
     setIsGenerating(true);
     // Simulation of AI generation logic based on behavior profiles
     setTimeout(() => {
       let content = "";
       if (persona === 'disc-d') { // Dominant: Quick, direct, results-oriented
         content = channel === 'whatsapp' 
           ? "Olá [Nome], direto ao ponto: vi que sua empresa busca [Resultado]. Temos uma solução que aumenta [Métrica] em [X]%. Pode falar amanhã às 10h?" 
           : "Assunto: ROI de [X]% em [Métrica]\n\n[Nome],\n\nNotei que sua operação está focada em [Meta]. Implementamos um sistema que corta custos em [X]% em 30 dias. Os números estão em anexo. Vamos falar?";
       } else if (persona === 'disc-i') { // Influential: Friendly, social, enthusiastic
         content = "Oi [Nome]! Tudo ótimo? Adorei sua última postagem sobre [Tema]. Me lembrou muito um desafio que resolvemos recentemente. Adoraria trocar uma ideia sobre como estamos ajudando líderes como você a brilharem em [Área]. Topa um café virtual?";
       } else {
         content = "Prezado [Nome], espero que esteja bem. Analisando os dados de [Setor], identificamos uma oportunidade de otimização em [Processo]. Gostaria de agendar uma breve reunião técnica para apresentar nossa metodologia fundamentada em [Prova Social]. Qual sua disponibilidade?";
       }
       
       setScript(content);
       setIsGenerating(false);
     }, 800);
   };
 
   const handleCopy = () => {
     navigator.clipboard.writeText(script);
     setCopied(true);
     toast.success('Script copiado!');
     setTimeout(() => setCopied(false), 2000);
   };
 
   return (
     <div className="grid lg:grid-cols-3 gap-6">
       <Card className="lg:col-span-1">
         <CardHeader>
           <CardTitle className="text-lg flex items-center gap-2">
             <UserCheck className="w-5 h-5" />
             Configurar Perfil
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2">
             <Label>Perfil Comportamental (DISC)</Label>
             <Select value={persona} onValueChange={setPersona}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="disc-d">Dominante (Direto/Resultados)</SelectItem>
                 <SelectItem value="disc-i">Influente (Relacional/Social)</SelectItem>
                 <SelectItem value="disc-s">Estável (Segurança/Processo)</SelectItem>
                 <SelectItem value="disc-c">Analítico (Dados/Precisão)</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Canal de Comunicação</Label>
             <Select value={channel} onValueChange={setChannel}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="whatsapp">WhatsApp</SelectItem>
                 <SelectItem value="email">E-mail</SelectItem>
                 <SelectItem value="linkedin">LinkedIn DM</SelectItem>
                 <SelectItem value="call">Roteiro de Ligação</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Etapa do Funil</Label>
             <Select value={stage} onValueChange={setStage}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="prospecting">Prospecção Fria</SelectItem>
                 <SelectItem value="followup">Follow-up</SelectItem>
                 <SelectItem value="objection">Tratamento de Objeção</SelectItem>
                 <SelectItem value="closing">Fechamento</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <Button 
             className="w-full gap-2 mt-4" 
             onClick={generateScript}
             disabled={isGenerating}
           >
             {isGenerating ? (
               <Zap className="w-4 h-4 animate-pulse" />
             ) : (
               <Wand2 className="w-4 h-4" />
             )}
             Gerar Script de Alta Conversão
           </Button>
         </CardContent>
       </Card>
 
       <Card className="lg:col-span-2 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4">
           {script && (
             <Button size="icon" variant="ghost" onClick={handleCopy}>
               {copied ? <Check className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
             </Button>
           )}
         </div>
         <CardHeader>
           <CardTitle className="text-lg">Script Gerado</CardTitle>
         </CardHeader>
         <CardContent>
           {script ? (
             <div className="space-y-4">
               <div className="bg-muted p-6 rounded-lg font-mono text-sm leading-relaxed whitespace-pre-wrap border shadow-inner">
                 {script}
               </div>
               <div className="flex flex-wrap gap-2">
                 <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                   <ShieldAlert className="w-3 h-3 mr-1" /> Gatilho: Autoridade
                 </Badge>
                 <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                   <Zap className="w-3 h-3 mr-1" /> Gatilho: Reciprocidade
                 </Badge>
                 <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">
                   <UserCheck className="w-3 h-3 mr-1" /> Ajuste VAK: Visual
                 </Badge>
               </div>
             </div>
           ) : (
             <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
               <Wand2 className="w-12 h-12 mb-2 opacity-20" />
               <p>Configure as opções ao lado para gerar seu roteiro de vendas.</p>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };