 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Brain, Sparkles, AlertTriangle, CheckCircle2, MessageSquare, Mail, Smartphone } from 'lucide-react';
 
 export const CopyAnalyzer = () => {
   const [text, setText] = useState('');
   const [analysis, setAnalysis] = useState({
     readability: 0,
     emotions: { joy: 0, urgency: 0, trust: 0, fear: 0 },
     triggers: [] as string[],
     score: 0,
     tips: [] as string[]
   });
 
   useEffect(() => {
     if (!text) {
       setAnalysis({ readability: 0, emotions: { joy: 0, urgency: 0, trust: 0, fear: 0 }, triggers: [], score: 0, tips: [] });
       return;
     }
 
     // Mock analysis engine for real-time feedback
     const words = text.split(/\s+/).filter(w => w.length > 0);
     const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
     
     // Simple Flesch-like calculation for PT-BR
     const avgWordsPerSentence = words.length / (sentenceCount || 1);
     const readability = Math.min(100, Math.max(0, 100 - (avgWordsPerSentence * 2)));
 
     const triggersFound = [];
     if (text.toLowerCase().includes('agora')) triggersFound.push('Urgência');
     if (text.toLowerCase().includes('exclusivo')) triggersFound.push('Exclusividade');
     if (text.toLowerCase().includes('garantido')) triggersFound.push('Segurança');
     if (text.toLowerCase().includes('você')) triggersFound.push('Personalização');
     if (text.toLowerCase().includes('limitado')) triggersFound.push('Escassez');
 
     const tips = [];
     if (avgWordsPerSentence > 20) tips.push('Sentenças longas detectadas. Tente encurtar para melhor fluidez.');
     if (triggersFound.length < 2) tips.push('Adicione mais gatilhos mentais para aumentar a conversão.');
     if (readability < 60) tips.push('Texto complexo. Use palavras mais simples para atingir um público maior.');
 
     setAnalysis({
       readability: Math.round(readability),
       emotions: {
         joy: text.includes('!') ? 80 : 40,
         urgency: triggersFound.includes('Urgência') ? 90 : 30,
         trust: triggersFound.includes('Segurança') ? 85 : 50,
         fear: text.toLowerCase().includes('perca') ? 70 : 10,
       },
       triggers: triggersFound,
       score: Math.round((readability + (triggersFound.length * 20)) / 2),
       tips
     });
   }, [text]);
 
   return (
     <div className="grid lg:grid-cols-2 gap-6">
       <div className="space-y-4">
         <Card>
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
               <MessageSquare className="w-5 h-5 text-primary" />
               Editor de Persuasão
             </CardTitle>
           </CardHeader>
           <CardContent>
             <Textarea 
               placeholder="Digite ou cole sua copy aqui..." 
               className="min-h-[400px] text-base leading-relaxed"
               value={text}
               onChange={(e) => setText(e.target.value)}
             />
             <div className="mt-4 flex flex-wrap gap-2">
               {['FAB', 'AIDA', 'PAS', '4Ps'].map(f => (
                 <Badge key={f} variant="outline" className="cursor-pointer hover:bg-primary/10">
                   Template {f}
                 </Badge>
               ))}
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-medium">Previews Multi-Canal</CardTitle>
           </CardHeader>
           <CardContent>
             <Tabs defaultValue="whatsapp">
               <TabsList className="grid w-full grid-cols-3">
                 <TabsTrigger value="whatsapp"><Smartphone className="w-4 h-4 mr-2" /> WhatsApp</TabsTrigger>
                 <TabsTrigger value="email"><Mail className="w-4 h-4 mr-2" /> Email</TabsTrigger>
                 <TabsTrigger value="social"><Sparkles className="w-4 h-4 mr-2" /> Redes</TabsTrigger>
               </TabsList>
               <TabsContent value="whatsapp" className="mt-4">
                 <div className="bg-[#e5ddd5] p-4 rounded-lg min-h-[200px] relative overflow-hidden">
                   <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] relative">
                     <p className="whitespace-pre-wrap text-sm">{text || 'Prévia da mensagem...'}</p>
                     <span className="text-[10px] text-muted-foreground float-right mt-1">12:00</span>
                   </div>
                 </div>
               </TabsContent>
               <TabsContent value="email" className="mt-4">
                 <div className="border rounded-md p-4 bg-white min-h-[200px] shadow-inner">
                   <div className="border-b pb-2 mb-2 text-xs text-muted-foreground">
                     <p>De: Equipe de Vendas</p>
                     <p>Para: Lead Qualificado</p>
                     <p>Assunto: [Proposta] Oportunidade Exclusiva</p>
                   </div>
                   <p className="whitespace-pre-wrap text-sm">{text || 'Corpo do email...'}</p>
                 </div>
               </TabsContent>
               <TabsContent value="social" className="mt-4">
                 <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                   <div className="p-3 flex items-center gap-2 border-b">
                     <div className="w-8 h-8 rounded-full bg-primary/20" />
                     <span className="text-xs font-bold">Sua Marca</span>
                   </div>
                   <div className="aspect-video bg-muted flex items-center justify-center">
                     <Sparkles className="w-12 h-12 text-muted-foreground/20" />
                   </div>
                   <div className="p-3">
                     <p className="text-sm line-clamp-3">{text || 'Legenda do post...'}</p>
                   </div>
                 </div>
               </TabsContent>
             </Tabs>
           </CardContent>
         </Card>
       </div>
 
       <div className="space-y-4">
         <Card className="border-primary/20 bg-primary/5">
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
               <Brain className="w-5 h-5" />
               Neuromarketing Score
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="flex items-center justify-between">
               <div className="text-4xl font-bold text-primary">{analysis.score}%</div>
               <Badge variant={analysis.score > 70 ? 'default' : 'secondary'}>
                 {analysis.score > 70 ? 'Alta Conversão' : 'Melhoria Necessária'}
               </Badge>
             </div>
 
             <div className="space-y-4">
               <div className="space-y-1.5">
                 <div className="flex justify-between text-xs">
                   <span>Legibilidade (Flesch PT-BR)</span>
                   <span>{analysis.readability}%</span>
                 </div>
                 <Progress value={analysis.readability} className="h-1.5" />
               </div>
 
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <span className="text-[10px] uppercase text-muted-foreground font-bold">Confiança</span>
                   <Progress value={analysis.emotions.trust} className="h-1 bg-blue-100" />
                 </div>
                 <div className="space-y-1.5">
                   <span className="text-[10px] uppercase text-muted-foreground font-bold">Urgência</span>
                   <Progress value={analysis.emotions.urgency} className="h-1 bg-amber-100" />
                 </div>
                 <div className="space-y-1.5">
                   <span className="text-[10px] uppercase text-muted-foreground font-bold">Alegria/Entusiasmo</span>
                   <Progress value={analysis.emotions.joy} className="h-1 bg-green-100" />
                 </div>
                 <div className="space-y-1.5">
                   <span className="text-[10px] uppercase text-muted-foreground font-bold">FOMO (Medo)</span>
                   <Progress value={analysis.emotions.fear} className="h-1 bg-red-100" />
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-medium">Gatilhos Mentais Detectados</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex flex-wrap gap-2">
               {analysis.triggers.map(t => (
                 <Badge key={t} variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                   <CheckCircle2 className="w-3 h-3 mr-1" /> {t}
                 </Badge>
               ))}
               {analysis.triggers.length === 0 && (
                 <span className="text-xs text-muted-foreground italic">Nenhum gatilho detectado ainda.</span>
               )}
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-medium">Sugestões de Otimização</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {analysis.tips.map((tip, i) => (
               <div key={i} className="flex gap-3 text-xs bg-amber-50 p-3 rounded-md border border-amber-100">
                 <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                 <p className="text-amber-800">{tip}</p>
               </div>
             ))}
             {analysis.tips.length === 0 && text && (
               <div className="flex gap-3 text-xs bg-green-50 p-3 rounded-md border border-green-100">
                 <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                 <p className="text-green-800">Sua copy está excelente! Pronto para disparar.</p>
               </div>
             )}
             {!text && <p className="text-xs text-muted-foreground italic">Escreva algo para ver as sugestões.</p>}
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };