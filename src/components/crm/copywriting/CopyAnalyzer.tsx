 import { FRAMEWORKS } from './PersuasionFrameworks';
 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
   import { Brain, Sparkles, AlertTriangle, CheckCircle2, MessageSquare, Mail, Smartphone, Target } from 'lucide-react';
 
 export const CopyAnalyzer = () => {
   const [text, setText] = useState('');
   const [analysis, setAnalysis] = useState({
      readability: 0,
      emotions: { joy: 0, urgency: 0, trust: 0, fear: 0, cognitive_ease: 0 },
      triggers: [] as string[],
      score: 0,
       tips: [] as { text: string; severity: 'warning' | 'info' | 'success' }[],
       storytelling_arc: 'Linear',
       objections: [] as string[],
       emotional_tone: 'Neutro'
    });
 
   useEffect(() => {
      if (!text) {
        setAnalysis({ 
          readability: 0, 
          emotions: { joy: 0, urgency: 0, trust: 0, fear: 0, cognitive_ease: 0 }, 
          triggers: [], 
          score: 0, 
          tips: [],
          storytelling_arc: 'Linear',
          objections: [],
          emotional_tone: 'Neutro'
        });
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
 
      const tips: { text: string; severity: 'warning' | 'info' | 'success' }[] = [];
      if (avgWordsPerSentence > 20) tips.push({ text: 'Sentenças longas detectadas (Média: ' + Math.round(avgWordsPerSentence) + ' palavras). Tente encurtar para melhor fluidez.', severity: 'warning' });
      if (triggersFound.length < 2) tips.push({ text: 'Baixa densidade de gatilhos mentais. Adicione elementos de Escassez ou Prova Social.', severity: 'info' });
       if (readability < 60) tips.push({ text: 'Texto com alta barreira cognitiva (Score: ' + Math.round(readability) + '). Use vocabulário mais acessível.', severity: 'warning' });
 
       // Hero's Journey detection
       const hasHero = text.toLowerCase().includes('imagine') || text.toLowerCase().includes('conheça') || text.toLowerCase().includes('história');
       const hasConflict = text.toLowerCase().includes('mas') || text.toLowerCase().includes('desafio') || text.toLowerCase().includes('obstáculo');
       const hasResolution = text.toLowerCase().includes('solução') || text.toLowerCase().includes('resultado') || text.toLowerCase().includes('sucesso');
 
       let arc = 'Arco Linear (Pitch Direto)';
       if (hasHero && hasConflict && hasResolution) arc = 'Jornada do Herói (Completa)';
       else if (hasHero && hasConflict) arc = 'Arco de Tensão (Incompleto)';
       else if (text.length > 250) arc = 'Narrativa Expandida';

      let tone = 'Neutro';
      if (text.includes('!')) tone = 'Entusiasmado';
      if (text.toLowerCase().includes('perigo') || text.toLowerCase().includes('urgente')) tone = 'Urgente/Alerta';
      if (text.toLowerCase().includes('obrigado') || text.toLowerCase().includes('ajudar')) tone = 'Empático';
 
      const cognitiveEase = Math.round(readability * 0.8 + (triggersFound.length * 4));

      setAnalysis({
        readability: Math.round(readability),
        emotions: {
          joy: text.includes('!') ? 80 : 40,
          urgency: triggersFound.includes('Urgência') ? 90 : 30,
          trust: triggersFound.includes('Segurança') ? 85 : 50,
          fear: text.toLowerCase().includes('perca') ? 70 : 10,
          cognitive_ease: cognitiveEase
        },
        triggers: triggersFound,
        score: Math.min(100, Math.round((readability + (triggersFound.length * 20) + cognitiveEase) / 3)),
        tips,
         storytelling_arc: arc,
        objections: text.toLowerCase().includes('caro') || text.toLowerCase().includes('preço') ? ['Preço/Valor'] : text.toLowerCase().includes('tempo') ? ['Falta de Tempo'] : [],
        emotional_tone: tone
     });
   }, [text]);
 
   const applyTemplate = (example: string) => {
     setText(example);
   };

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
               {FRAMEWORKS.map(f => (
                 <Badge 
                   key={f.id} 
                   variant="outline" 
                   className="cursor-pointer hover:bg-primary/10"
                   onClick={() => applyTemplate(f.example)}
                 >
                   Template {f.name}
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
                     <TabsTrigger value="objections"><Target className="w-4 h-4 mr-2" /> Objeções</TabsTrigger>
               </TabsList>
               <TabsContent value="whatsapp" className="mt-4">
                 <div className="bg-[#e5ddd5] p-4 rounded-lg min-h-[200px] relative overflow-hidden">
                   <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] relative">
                     <p className="whitespace-pre-wrap text-sm">{text || 'Prévia da mensagem...'}</p>
                     <span className="text-[10px] text-muted-foreground float-right mt-1">12:00</span>
                   </div>
                 </div>
                 </TabsContent>
                 <TabsContent value="objections" className="mt-4">
                   <div className="border rounded-lg p-4 bg-red-50/30 border-red-100">
                     <h4 className="text-sm font-bold flex items-center gap-2 text-red-700 mb-3">
                       <Target className="w-4 h-4" /> Radar de Resistência
                     </h4>
                     {analysis.objections.length > 0 ? (
                       <div className="space-y-3">
                         <p className="text-xs text-red-800">Detectamos gatilhos de resistência sobre: <strong>{analysis.objections.join(', ')}</strong></p>
                         <div className="bg-white p-3 rounded border border-red-200 text-xs">
                           <p className="font-bold text-red-700 mb-1">Dica de Reenquadramento:</p>
                           <p className="text-muted-foreground italic">"Em vez de focar no preço, foque no custo de não resolver o problema agora."</p>
                         </div>
                       </div>
                     ) : (
                       <p className="text-xs text-muted-foreground italic text-center py-8">Nenhuma objeção explícita detectada. O texto parece fluir sem barreiras de preço ou autoridade.</p>
                     )}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-primary">{analysis.score}%</div>
                  <Badge variant={analysis.score > 70 ? 'default' : 'secondary'} className="text-[10px]">
                    {analysis.score > 70 ? 'Alta Conversão' : 'Melhoria Necessária'}
                  </Badge>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-xs font-bold uppercase text-muted-foreground">Tom Emocional</div>
                  <div className="text-sm font-medium text-primary flex items-center justify-end gap-1">
                    <Sparkles className="w-3 h-3" /> {analysis.emotional_tone}
                  </div>
                </div>
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
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">Facilidade Cognitiva</span>
                    <Progress value={analysis.emotions.cognitive_ease} className="h-1 bg-indigo-100" />
                  </div>
                </div>

                <div className="pt-4 border-t border-primary/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium">Arco Narrativo</span>
                    <Badge variant="outline" className="text-[10px]">{analysis.storytelling_arc}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight italic">
                    {analysis.storytelling_arc === 'Jornada do Herói' 
                      ? 'Detectada estrutura de transformação: Problema -> Conflito -> Resolução.' 
                      : 'Estrutura focada em clareza e velocidade de processamento.'}
                  </p>
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
            <CardContent className="space-y-2">
              {analysis.tips.map((tip, i) => {
                const isWarning = tip.severity === 'warning';
                return (
                  <div key={i} className={`flex gap-3 text-[11px] p-2.5 rounded-md border ${isWarning ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                    {isWarning ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <Brain className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    <p className={isWarning ? 'text-amber-800' : 'text-blue-800'}>{tip.text}</p>
                  </div>
                );
              })}
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