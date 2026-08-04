 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Layers, Copy, Check, Info } from 'lucide-react';
 import { toast } from 'sonner';
 
 // eslint-disable-next-line react-refresh/only-export-components
 export const FRAMEWORKS = [
   {
     id: 'aida',
     name: 'AIDA',
     fullName: 'Attention, Interest, Desire, Action',
     description: 'O framework mais clássico. Ideal para anúncios, landing pages e emails de prospecção fria.',
     structure: [
       { label: 'Atenção', placeholder: 'Capture a atenção com um gancho ou fato chocante.' },
       { label: 'Interesse', placeholder: 'Apresente informações que mantenham o interesse do lead.' },
       { label: 'Desejo', placeholder: 'Mostre como sua oferta resolve o problema e cria desejo.' },
       { label: 'Ação', placeholder: 'Chamada clara para o próximo passo.' }
     ],
     example: 'Atenção: 80% dos CRMs são abandonados em 6 meses.\\nInteresse: Isso acontece porque eles focam em dados, não em pessoas.\\nDesejo: Nossa IA prevê o comportamento humano, tornando o fechamento natural.\\nAção: Agende sua demo gratuita agora.'
   },
   {
     id: 'pas',
     name: 'PAS',
     fullName: 'Problem, Agitate, Solution',
     description: 'Altamente eficaz para converter através da dor. Ótimo para tratamento de objeções.',
     structure: [
       { label: 'Problema', placeholder: 'Identifique o problema específico que o lead enfrenta.' },
       { label: 'Agitação', placeholder: 'Dê ênfase às consequências negativas de não resolver o problema.' },
       { label: 'Solução', placeholder: 'Apresente sua solução como o único caminho viável.' }
     ],
     example: 'Problema: Você está perdendo horas digitando logs de CRM que ninguém lê.\\nAgitação: Enquanto isso, seus concorrentes usam IA para focar no que importa: o cliente. Você está ficando para trás.\\nSolução: Nosso CRM automatiza 90% da entrada de dados. Recupere seu tempo hoje.'
   },
   {
     id: 'fab',
     name: 'FAB',
     fullName: 'Features, Advantages, Benefits',
     description: 'Foca em transformar características técnicas em benefícios emocionais reais.',
     structure: [
       { label: 'Recurso', placeholder: 'Fato técnico sobre o produto (ex: Nuvem).' },
       { label: 'Vantagem', placeholder: 'O que esse recurso faz (ex: Acesso de qualquer lugar).' },
       { label: 'Benefício', placeholder: 'O valor emocional/financeiro (ex: Liberdade geográfica).' }
     ],
     example: 'Recurso: Algoritmo de análise DISC integrado.\\nVantagem: Identifica o perfil psicológico do lead em segundos.\\nBenefício: Você fala a língua do cliente, gera rapport imediato e fecha vendas 3x mais rápido.'
   },
   {
     id: '4ps',
     name: '4Ps',
     fullName: 'Promise, Picture, Proof, Push',
     description: 'Excelente para copywriting de vendas longo ou apresentações de impacto.',
     structure: [
       { label: 'Promessa', placeholder: 'Faça uma promessa ousada e atraente.' },
       { label: 'Imagem', placeholder: 'Pinte um quadro mental do futuro com a solução.' },
       { label: 'Prova', placeholder: 'Apresente dados, depoimentos ou estudos de caso.' },
       { label: 'Empurrão', placeholder: 'O CTA final com urgência ou escassez.' }
     ],
     example: 'Promessa: Vamos dobrar sua taxa de conversão em 90 dias.\\nImagem: Imagine sua equipe focada apenas em leads que já estão prontos para comprar.\\nProva: A Empresa X aumentou sua receita em 140% usando nossa tecnologia.\\nEmpurrão: Restam apenas 3 vagas para o programa de aceleração deste mês. Clique aqui.'
   },
   {
     id: 'storytelling',
     name: 'Storytelling',
     fullName: 'Hero\'s Journey (Jornada do Herói)',
     description: 'Cria conexão emocional profunda através de um arco narrativo de transformação.',
     structure: [
       { label: 'Mundo Comum', placeholder: 'Contexto inicial do lead antes do problema.' },
       { label: 'O Chamado', placeholder: 'O problema que obriga a mudança.' },
       { label: 'O Mentor', placeholder: 'Sua empresa guiando o lead com a solução.' },
       { label: 'A Recompensa', placeholder: 'O novo estado de sucesso alcançado.' }
     ],
     example: 'Mundo Comum: Você construiu sua empresa do zero com suor e planilhas.\\nO Chamado: Mas o crescimento parou. O caos dos dados fragmentados começou a custar caro.\\nO Mentor: Foi quando o Nexus CRM entrou como seu aliado estratégico, trazendo ordem ao caos.\\nA Recompensa: Hoje, sua equipe fecha negócios no automático e você recuperou a liberdade que sonhava.'
   }
 ];
 
 export const PersuasionFrameworks = () => {
   const [selectedId, setSelectedId] = useState('aida');
   const [copied, setCopied] = useState(false);
 
   const selected = FRAMEWORKS.find(f => f.id === selectedId) || FRAMEWORKS[0];
 
   const handleCopy = async () => {
     try {
       await navigator.clipboard.writeText(selected.example);
       setCopied(true);
       toast.success('Exemplo copiado para o clipboard!');
       setTimeout(() => setCopied(false), 2000);
     } catch {
       toast.error('Não foi possível copiar');
     }
   };
 
   return (
     <div className="grid lg:grid-cols-4 gap-6">
       <div className="lg:col-span-1 space-y-2">
         {FRAMEWORKS.map(f => (
           <Button
             key={f.id}
             variant={selectedId === f.id ? 'default' : 'outline'}
             className="w-full justify-start text-left h-auto py-4 px-4"
             onClick={() => setSelectedId(f.id)}
           >
             <div className="flex flex-col gap-1">
               <span className="font-bold">{f.name}</span>
               <span className="text-[10px] opacity-70 uppercase tracking-wider">{f.fullName}</span>
             </div>
           </Button>
         ))}
       </div>
 
       <Card className="lg:col-span-3 border-primary/20 bg-primary/5">
         <CardHeader>
           <div className="flex justify-between items-start">
             <div className="space-y-1">
               <CardTitle className="flex items-center gap-2">
                 <Layers className="w-5 h-5 text-primary" />
                 Framework {selected.name}
               </CardTitle>
               <CardDescription>{selected.fullName}</CardDescription>
             </div>
             <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
               {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               Copiar Exemplo
             </Button>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="bg-white/50 p-4 rounded-lg border border-primary/10">
             <p className="text-sm text-primary-foreground/80 leading-relaxed italic">
               "{selected.description}"
             </p>
           </div>
 
           <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-4">
               <h4 className="text-sm font-bold flex items-center gap-2">
                 <Info className="w-4 h-4 text-primary" />
                 Estrutura Logística
               </h4>
               <div className="space-y-3">
                 {selected.structure.map((step, i) => (
                   <div key={i} className="space-y-1">
                     <Badge variant="secondary" className="text-[10px]">{step.label}</Badge>
                     <p className="text-xs text-muted-foreground pl-1">{step.placeholder}</p>
                   </div>
                 ))}
               </div>
             </div>
 
             <div className="space-y-4">
               <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                 <Layers className="w-4 h-4" />
                 Exemplo Prático (Vendas B2B)
               </h4>
               <div className="bg-white p-4 rounded-lg border shadow-sm font-mono text-xs whitespace-pre-wrap leading-relaxed">
                 {selected.example}
               </div>
             </div>
           </div>
 
           <div className="pt-4 border-t border-primary/10">
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">
               Combine este framework com a análise de neuromarketing para atingir 10/10 em conversão.
             </p>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 };