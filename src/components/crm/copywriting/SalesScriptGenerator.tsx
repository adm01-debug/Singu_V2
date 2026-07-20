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
   const [vakPreference, setVakPreference] = useState('visual');
   const [stage, setStage] = useState('prospecting');
   const [trigger, setTrigger] = useState('none');
   const [objectionType, setObjectionType] = useState('price');
   const [channel, setChannel] = useState('whatsapp');
   const [isGenerating, setIsGenerating] = useState(false);
   const [script, setScript] = useState('');
   const [copied, setCopied] = useState(false);
 
   const generateScript = () => {
     setIsGenerating(true);
       setTimeout(() => {
         let content = "";
         const vakPrefix = {
           visual: "Veja bem",
           auditory: "Ouça o que tenho a dizer",
           kinesthetic: "Sinta o impacto"
         }[vakPreference as 'visual'|'auditory'|'kinesthetic'] || "Veja";

          if (persona === 'disc-d') {
            content = channel === 'whatsapp' 
              ? `Olá [Nome], direto ao ponto. ${vakPrefix}: temos uma solução que aumenta [Métrica] em [X]%. Pode falar amanhã às 10h?` 
              : `Assunto: ROI de [X]% em [Métrica]\n\n[Nome],\n\nNotei sua meta. ${vakPrefix}: implementamos um sistema que corta custos em [X]% em 30 dias. Vamos falar?`;
          } else if (persona === 'disc-i') {
            content = `Oi [Nome]! Tudo ótimo? ${vakPrefix}: adorei sua postagem sobre [Tema]. Me lembrou um desafio que resolvemos. Adoraria trocar uma ideia sobre como estamos ajudando líderes a brilharem. Topa um café?`;
          } else if (persona === 'disc-s') {
            content = `Olá [Nome], espero que esteja bem. ${vakPrefix}: nossa metodologia foca em segurança e previsibilidade operacional. Temos casos de sucesso em [Setor] com resultados consistentes. Gostaria de conhecer nosso processo?`;
           } else {
             content = `Prezado [Nome], analisando os dados de [Setor], ${vakPrefix}: identificamos uma oportunidade de otimização baseada em [Métrica]. Segue análise técnica anexa para sua validação de precisão. Qual sua disponibilidade?`;
           }

           if (stage === 'objection') {
             const objectionScripts = {
               price: `\n\n[TRATAMENTO DE OBJEÇÃO - PREÇO]: Entendo perfeitamente sua preocupação com o investimento. No entanto, se olharmos para o custo de inação, ${vakPrefix} que o prejuízo pode ser maior que o aporte inicial.`,
               time: `\n\n[TRATAMENTO DE OBJEÇÃO - TEMPO]: Comprendo que sua agenda está lotada. Justamente por isso, nossa solução foi desenhada para automatizar tarefas que hoje consomem 40% do seu dia. ${vakPrefix} o tempo que você recuperará.`,
               trust: `\n\n[TRATAMENTO DE OBJEÇÃO - CONFIANÇA]: É natural ter cautela com novas tecnologias. ${vakPrefix}: temos mais de 500 clientes enterprise e 98% de retenção. Nossa implementação é acompanhada por especialistas.`,
               authority: `\n\n[TRATAMENTO DE OBJEÇÃO - AUTORIDADE]: Entendo que precise validar com outros decisores. ${vakPrefix}: preparei este sumário executivo com foco em ROI para facilitar essa apresentação interna.`
             };
             content += objectionScripts[objectionType as keyof typeof objectionScripts] || objectionScripts.price;
           }

          if (trigger === 'novelty') {
            content = `[NOVIDADE EXCLUSIVA] ` + content;
          } else if (trigger === 'exclusivity') {
            content = `[ACESSO RESTRITO] ` + content;
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
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Perfil DISC</Label>
                 <Select value={persona} onValueChange={setPersona}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="disc-d">Dominante</SelectItem>
                     <SelectItem value="disc-i">Influente</SelectItem>
                     <SelectItem value="disc-s">Estável</SelectItem>
                     <SelectItem value="disc-c">Analítico</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Sistema VAK</Label>
                 <Select value={vakPreference} onValueChange={setVakPreference}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="visual">Visual</SelectItem>
                     <SelectItem value="auditory">Auditivo</SelectItem>
                     <SelectItem value="kinesthetic">Cinestésico</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
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
 
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Etapa do Funil</Label>
                 <Select value={stage} onValueChange={setStage}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="prospecting">Prospecção</SelectItem>
                     <SelectItem value="followup">Follow-up</SelectItem>
                     <SelectItem value="objection">Objeção</SelectItem>
                     <SelectItem value="closing">Fechamento</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
 
               {stage === 'objection' && (
                 <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                   <Label>Tipo de Objeção</Label>
                   <Select value={objectionType} onValueChange={setObjectionType}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="price">Preço / Orçamento</SelectItem>
                       <SelectItem value="time">Falta de Tempo</SelectItem>
                       <SelectItem value="trust">Falta de Confiança / Risco</SelectItem>
                       <SelectItem value="authority">Precisa de Aprovação</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               )}
              <div className="space-y-2">
                <Label>Gatilho Mental</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="novelty">Novidade</SelectItem>
                    <SelectItem value="exclusivity">Exclusividade</SelectItem>
                    <SelectItem value="authority">Autoridade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
             <Button size="icon" aria-label="Confirmar" variant="ghost" onClick={handleCopy}>
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
                    <UserCheck className="w-3 h-3 mr-1" /> Ajuste VAK: {vakPreference}
                  </Badge>
                  <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                    <Check className="w-3 h-3 mr-1" /> Carnegie: Ativo
                  </Badge>
                </div>
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded text-[11px] text-indigo-800 italic">
                  <strong>Insight Dale Carnegie:</strong> {persona === 'disc-i' ? "Seja um bom ouvinte. Incentive os outros a falarem sobre si mesmos." : persona === 'disc-d' ? "A única maneira de ganhar uma discussão é evitá-la." : "Faça a outra pessoa sentir-se importante."}
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