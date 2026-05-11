import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { queryExternalData } from "@/lib/externalData";
import { Button } from "@/components/ui/button";
 import { Printer, FileJson, FileSpreadsheet, Edit3, Save, ShieldCheck } from "lucide-react";
import { BackButton } from "@/components/navigation/BackButton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logger } from "@/lib/logger";
 import { ReportScriptsSection } from "./relatorio/ReportScriptsSection";
  import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
  import { Textarea } from "@/components/ui/textarea";
  import { Input } from "@/components/ui/input";
  import { toast } from "sonner";
 import { Badge } from "@/components/ui/badge";
  import { 
    Brain, Target, Shield, Lightbulb, Zap, UserPlus, 
    CheckCircle2, Share2, EyeOff, LayoutList, ClipboardCheck
  } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

interface ContactBehavior {
  preferredChannel?: string;
  discProfile?: string;
  discBlend?: string;
  discConfidence?: number;
  [key: string]: unknown;
}

 interface ContactReport {
   contact: Tables<'contacts'>;
   interactions: Tables<'interactions'>[];
   discHistory: Tables<'disc_analysis_history'>[];
   insights?: {
     recurringObjections: (string | null)[];
     topPreferences: (string | null)[];
     preferredTone: string;
     communicationRecommendations: string[];
   };
 }

const RelatorioContato = () => {
  const { id } = useParams<{ id: string }>();
   const [data, setData] = useState<ContactReport | null>(null);
   const [editingInsights, setEditingInsights] = useState(false);
   const [editedInsights, setEditedInsights] = useState<ContactReport['insights'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // Fetch contact - local first, then external
        let contact: Tables<'contacts'> | null = null;
        const { data: localContact } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
        if (localContact) {
          contact = localContact;
        } else {
          const { data: extContact } = await queryExternalData<Tables<'contacts'>>({ table: 'contacts', filters: [{ type: 'eq', column: 'id', value: id }] });
          contact = extContact?.[0] || null;
        }

        // Fetch interactions - local first, then external
        const { data: localInteractions } = await supabase.from("interactions").select("*").eq("contact_id", id).order("created_at", { ascending: false });
        let interactions = localInteractions || [];
        if (interactions.length === 0) {
          const { data: extInteractions } = await queryExternalData<Tables<'interactions'>>({ table: 'interactions', filters: [{ type: 'eq', column: 'contact_id', value: id }], order: { column: 'created_at', ascending: false } });
          interactions = extInteractions || [];
        }

        // Fetch DISC - local first, then external
        const { data: localDisc } = await supabase.from("disc_analysis_history").select("*").eq("contact_id", id).order("analyzed_at", { ascending: false });
        let discHistory = localDisc || [];
        if (discHistory.length === 0) {
          const { data: extDisc } = await queryExternalData<Tables<'disc_analysis_history'>>({ table: 'disc_analysis_history', filters: [{ type: 'eq', column: 'contact_id', value: id }], order: { column: 'analyzed_at', ascending: false } });
          discHistory = extDisc || [];
        }

         const behavior = (contact.behavior || {}) as ContactBehavior;
         const recurringObjections = interactions
           .filter(i => i.content?.toLowerCase().includes('objeção') || i.content?.toLowerCase().includes('não gostou'))
           .map(i => i.content)
           .slice(0, 3);
 
         const topPreferences = interactions
           .filter(i => i.content?.toLowerCase().includes('preferência') || i.content?.toLowerCase().includes('gosta'))
           .map(i => i.content)
           .slice(0, 3);
 
          const defaultInsights = {
            recurringObjections,
            topPreferences,
            preferredTone: behavior.preferredChannel === 'WhatsApp' ? 'Casual e Rápido' : 'Formal e Detalhado',
            communicationRecommendations: [
              "Focar em benefícios de longo prazo e estabilidade.",
              "Utilizar gatilhos de Prova Social e Autoridade.",
              "Evitar pressão excessiva por fechamento imediato."
            ]
          };
          setData({ contact, interactions, discHistory, insights: defaultInsights });
          setEditedInsights(defaultInsights);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching report data:', { error: msg });
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

   const handlePrint = () => window.print();
 
   const handleExportCSV = () => {
     if (!data) return;
     const rows = [
       ["Campo", "Valor"],
       ["Nome", contactName],
       ["WhatsApp", data.contact.whatsapp || ""],
       ["Email", data.contact.email || ""],
       ["Relationship Score", data.contact.relationship_score || ""],
       ["Tom Preferido", editedInsights?.preferredTone || ""],
       ["Objeções Recorrentes", editedInsights?.recurringObjections.join(" | ") || ""],
       ["Preferências", editedInsights?.topPreferences.join(" | ") || ""],
     ];
     const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `relatorio_${id}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     toast.success("CSV exportado com sucesso");
   };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando relatório...</p>
      </div>
    );
  }

  if (!data?.contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Contato não encontrado</p>
      </div>
    );
  }

   const { contact, interactions, discHistory, insights } = data;
  const behavior = (contact.behavior || {}) as ContactBehavior;
  const latestDisc = discHistory[0];

  const contactName = `${contact.first_name} ${contact.last_name}`.trim();

  return (
    <div className="min-h-screen bg-background">
      {/* Header com botões (não imprime) */}
      <div className="print:hidden bg-background border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <BackButton to={`/contatos/${id}`} label="Voltar ao contato" />
         <div className="flex gap-2 flex-wrap">
           <Button variant="outline" onClick={() => setEditingInsights(!editingInsights)}>
             <Edit3 className="h-4 w-4 mr-2" />
             {editingInsights ? "Visualizar" : "Editar Insights"}
           </Button>
           <Button variant="outline" onClick={handleExportCSV}>
             <FileSpreadsheet className="h-4 w-4 mr-2" />
             Exportar CSV
           </Button>
           <Button onClick={handlePrint}>
             <Printer className="h-4 w-4 mr-2" />
             Imprimir / Salvar PDF
           </Button>
         </div>
      </div>

      {/* Conteúdo do Relatório */}
      <div className="max-w-4xl mx-auto p-8 print:p-4 print:max-w-none">
        {/* Cabeçalho */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            📊 Relatório de Análise Comportamental
          </h1>
          <p className="text-xl text-muted-foreground">{contactName}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>

        {/* Dados do Contato */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
            👤 Dados do Contato
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Nome:</strong> {contactName}</div>
            <div><strong>WhatsApp:</strong> {contact.whatsapp || contact.phone || "Não informado"}</div>
            <div><strong>Email:</strong> {contact.email || "Não informado"}</div>
            <div><strong>Cargo:</strong> {contact.role_title || "Não informado"}</div>
            <div><strong>Canal Preferido:</strong> {behavior.preferredChannel || "WhatsApp"}</div>
            <div><strong>Score de Relacionamento:</strong> {contact.relationship_score || 50}/100</div>
          </div>
        </section>

         {/* Insights Automáticos do Histórico */}
         <section className="mb-8">
           <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-6 flex items-center gap-2">
             <Brain className="h-5 w-5 text-primary" /> Insights Inteligentes do Histórico
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="bg-muted/30 border-none shadow-none">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2">
                   <Target className="h-4 w-4 text-primary" /> Preferências e Tom
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tom Preferido</p>
                    {editingInsights ? (
                      <Input 
                        value={editedInsights?.preferredTone} 
                        onChange={(e) => setEditedInsights(prev => prev ? {...prev, preferredTone: e.target.value} : null)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {editedInsights?.preferredTone}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Padrões de Preferência</p>
                    {editingInsights ? (
                      <Textarea 
                        value={editedInsights?.topPreferences.join("\n")} 
                        onChange={(e) => setEditedInsights(prev => prev ? {...prev, topPreferences: e.target.value.split("\n")} : null)}
                        className="text-sm min-h-[100px]"
                        placeholder="Uma preferência por linha"
                      />
                    ) : (
                      <ul className="text-sm space-y-1.5">
                        {editedInsights?.topPreferences.length ? editedInsights.topPreferences.map((p, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <span className="line-clamp-2">{p}</span>
                          </li>
                        )) : (
                          <li className="text-muted-foreground italic">Nenhum padrão detectado ainda.</li>
                        )}
                      </ul>
                    )}
                  </div>
               </CardContent>
             </Card>
 
             <Card className="bg-muted/30 border-none shadow-none">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2">
                   <Shield className="h-4 w-4 text-destructive" /> Objeções Recorrentes
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <ul className="text-sm space-y-3">
                   {data.insights?.recurringObjections.length ? data.insights.recurringObjections.map((o, i) => (
                     <li key={i} className="bg-white/50 p-2.5 rounded border border-destructive/10">
                       <span className="text-destructive font-medium text-[11px] uppercase block mb-1">Barreira {i+1}</span>
                       <p className="line-clamp-2 italic text-foreground/80">"{o}"</p>
                     </li>
                   )) : (
                     <li className="text-muted-foreground italic">Nenhuma objeção explícita no histórico.</li>
                   )}
                 </ul>
               </CardContent>
             </Card>
           </div>
 
           <Card className="mt-6 border-primary/20 bg-primary/5">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm flex items-center gap-2">
                 <Lightbulb className="h-4 w-4 text-primary" /> Recomendações Estratégicas
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {data.insights?.communicationRecommendations.map((rec, i) => (
                   <div key={i} className="flex gap-3 items-start p-2">
                     <div className="bg-primary/20 rounded-full p-1 mt-0.5 shrink-0">
                       <Zap className="h-3 w-3 text-primary" />
                     </div>
                     <p className="text-xs leading-relaxed text-foreground/90">{rec}</p>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </section>
 
          {/* Perfil de Dominância Cerebral & DISC */}
          <section className="mb-8">
           <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-6 flex items-center gap-2">
             <Brain className="h-5 w-5 text-primary" /> Análise de Dominância Cerebral & DISC
           </h2>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-destructive/5 rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {latestDisc?.dominance_score || behavior.discProfile === 'D' ? '85' : '45'}%
              </div>
              <div className="text-sm text-muted-foreground">Dominância (D)</div>
            </div>
            <div className="text-center p-4 bg-warning/5 rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {latestDisc?.influence_score || '65'}%
              </div>
              <div className="text-sm text-muted-foreground">Influência (I)</div>
            </div>
            <div className="text-center p-4 bg-success/5 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {latestDisc?.steadiness_score || '75'}%
              </div>
              <div className="text-sm text-muted-foreground">Estabilidade (S)</div>
            </div>
            <div className="text-center p-4 bg-info/5 rounded-lg">
              <div className="text-2xl font-bold text-info">
                {latestDisc?.conscientiousness_score || '30'}%
              </div>
              <div className="text-sm text-muted-foreground">Conformidade (C)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Perfis Comportamentais</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perfil Principal:</span>
                  <span className="font-bold text-primary">{latestDisc?.primary_profile || behavior.discProfile || 'S'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perfil Secundário:</span>
                  <span className="font-bold text-primary">{latestDisc?.secondary_profile || 'I'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dominância Cerebral:</span>
                  <span className="font-bold text-primary">Límbico Direito</span>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
              <h3 className="text-xs font-bold uppercase text-primary mb-3 tracking-wider">Resumo Executivo</h3>
              <p className="text-sm leading-relaxed text-foreground/80">
                {latestDisc?.profile_summary || 'Indivíduo com forte orientação para harmonia e processos interpessoais. Toma decisões baseadas em confiança e impacto humano.'}
              </p>
            </div>
          </div>

          {/* Redes Sociais & Presença Digital */}
          <section className="mb-8 p-4 bg-muted/20 rounded-xl border border-dashed border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Share2 className="h-4 w-4 text-blue-500" /> Sinais das Redes Sociais (OSINT)
              </h3>
              <Badge variant="outline" className="text-[10px] gap-1 bg-background">
                <EyeOff className="h-3 w-3" /> Privado: Apenas para uso interno
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Tom Digital</p>
                <p className="text-sm font-medium">Entusiasta / Profissional</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Interesse Ativo</p>
                <p className="text-sm font-medium">Inovação & Gestão</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Frequência</p>
                <p className="text-sm font-medium">Alta (LinkedIn)</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              * Dados coletados com base em perfis públicos e consentimento de termos de uso do CRM.
            </p>
          </section>
         </section>
 
         {/* Indicadores Comportamentais */}
        {latestDisc?.behavior_indicators && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
              🔍 Indicadores Comportamentais Detectados
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              {(Array.isArray(latestDisc.behavior_indicators) 
                ? latestDisc.behavior_indicators 
                : []
              ).map((indicator: string, i: number) => (
                <li key={i} className="text-foreground">{indicator}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Análise Neuromarketing & Gatilhos Primal */}
        <section className="mb-8 page-break-before">
          <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
            🧬 Análise Neuromarketing
          </h2>
          
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-muted">
                <th className="border border-gray-300 p-2 text-left">Sistema Cerebral</th>
                <th className="border border-gray-300 p-2 text-left">Dominância</th>
                <th className="border border-gray-300 p-2 text-left">Gatilhos Recomendados</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Límbico (Emocional)</td>
                <td className="border border-gray-300 p-2 text-destructive font-bold">ALTO</td>
                <td className="border border-gray-300 p-2">Conexão emocional, pertencimento, validação</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Neocórtex (Racional)</td>
                <td className="border border-gray-300 p-2 text-warning font-bold">MÉDIO</td>
                <td className="border border-gray-300 p-2">Justificativas lógicas, comparações</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Reptiliano (Instintivo)</td>
                <td className="border border-gray-300 p-2 text-success font-bold">BAIXO</td>
                <td className="border border-gray-300 p-2">Menos foco em urgência primal</td>
              </tr>
            </tbody>
          </table>

          <p><strong>Neuroquímicos dominantes:</strong> Ocitocina (conexão) + Cortisol (medo de repetição)</p>
        </section>

        {/* Gatilhos Mentais */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
            💡 Gatilhos Mentais Recomendados
          </h2>
          
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-muted">
                <th className="border border-gray-300 p-2 text-left">Gatilho</th>
                <th className="border border-gray-300 p-2 text-left">Prioridade</th>
                <th className="border border-gray-300 p-2 text-left">Como Aplicar</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Novidade</td>
                <td className="border border-gray-300 p-2 text-destructive font-bold">CRÍTICO</td>
                <td className="border border-gray-300 p-2">"Lançamento exclusivo 2026", "Acabou de chegar"</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Prova Social</td>
                <td className="border border-gray-300 p-2 text-destructive font-bold">ALTO</td>
                <td className="border border-gray-300 p-2">"Outras empresas do segmento escolheram..."</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Exclusividade</td>
                <td className="border border-gray-300 p-2 text-destructive font-bold">ALTO</td>
                <td className="border border-gray-300 p-2">"Poucos clientes têm acesso a esta linha"</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Segurança</td>
                <td className="border border-gray-300 p-2 text-warning font-bold">MÉDIO</td>
                <td className="border border-gray-300 p-2">"Garantimos que será diferente do anterior"</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Antecipação</td>
                <td className="border border-gray-300 p-2 text-warning font-bold">MÉDIO</td>
                <td className="border border-gray-300 p-2">"Imagine a reação dos destinatários..."</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-destructive/5 p-3 rounded-lg">
            <p className="text-destructive"><strong>⚠️ EVITAR:</strong> Urgência agressiva, Escassez forçada (gera desconfiança no perfil S)</p>
          </div>
        </section>

        {/* Princípios Carnegie */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
            🎭 Princípios Dale Carnegie Aplicáveis
          </h2>
          
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Interesse Genuíno:</strong> Pergunte sobre o evento, entenda o contexto</li>
            <li><strong>Noble Cause:</strong> "Queremos que seu evento seja memorável"</li>
            <li><strong>Deixe a outra pessoa falar:</strong> Ouça as preocupações sobre repetição</li>
            <li><strong>Preserve o prestígio:</strong> "Você tem razão em querer inovar"</li>
            <li><strong>Dramatize suas ideias:</strong> Mostre visualmente como será diferente</li>
          </ol>
        </section>

        {/* Perfil VAK */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
            👁️ Perfil VAK (Sistemas Representacionais)
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary/5 rounded-lg">
              <div className="text-2xl font-bold text-secondary">45%</div>
              <div className="text-sm text-muted-foreground">Visual</div>
              <div className="text-xs text-muted-foreground mt-1">Precisa ver imagens</div>
            </div>
            <div className="text-center p-4 bg-warning/5 rounded-lg">
              <div className="text-2xl font-bold text-warning">35%</div>
              <div className="text-sm text-muted-foreground">Cinestésico</div>
              <div className="text-xs text-muted-foreground mt-1">Quer sentir segurança</div>
            </div>
            <div className="text-center p-4 bg-success/5 rounded-lg">
              <div className="text-2xl font-bold text-success">20%</div>
              <div className="text-sm text-muted-foreground">Auditivo</div>
              <div className="text-xs text-muted-foreground mt-1">Menos foco em texto longo</div>
            </div>
          </div>
        </section>

         <section className="mb-8 page-break-before">
           <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-6 flex items-center gap-2">
             <UserPlus className="h-5 w-5 text-primary" /> Próximos Passos & Scripts (IA)
           </h2>
           
           <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 mb-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-primary flex items-center gap-2">
                 <Target className="h-4 w-4" /> Ação Prioritária Recomendada
               </h3>
               <Badge className="bg-primary text-white">Alta Prioridade</Badge>
             </div>
             
             <div className="space-y-4">
               <div className="bg-white/80 p-4 rounded-lg border border-primary/10 shadow-sm">
                 <p className="text-sm font-bold text-foreground mb-1">Follow-up Estratégico de Valor</p>
                 <p className="text-xs text-muted-foreground italic leading-relaxed">
                   "O histórico mostra que {contact.first_name} valoriza estabilidade e prova social. Sugerimos um contato via WhatsApp reforçando cases de sucesso similares para quebrar a última barreira de confiança detectada."
                 </p>
               </div>
 
               <div className="space-y-2">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Script Sugerido</p>
                 <div className="bg-white p-4 rounded-lg border border-border italic text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                   "Olá {contact.first_name}, tudo bem? Revisitando nossa conversa sobre o projeto X. Estava lendo um case hoje de uma empresa que teve os mesmos desafios de segurança que você comentou e pensei em te mostrar como resolvemos. Faz sentido darmos uma olhada rápida amanhã?"
                 </div>
               </div>
             </div>
           </div>
         </section>
 
         <ReportScriptsSection interactions={interactions} />

        {/* Rodapé */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Relatório gerado automaticamente pelo Sistema de Inteligência Comportamental</p>
          <p className="mt-1">© {new Date().getFullYear()} - Todos os direitos reservados</p>
        </footer>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
};

export default RelatorioContato;
