import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Activity, Sparkles, Target, Waves, Sliders, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { PromptChips, type PromptChip } from '@/components/ui/prompt-chips';
import { toast } from 'sonner';

const NEURO_STYLE_CHIPS: PromptChip[] = [
  { id: 'logic', label: 'Foco Neocórtex (Lógico)', icon: <Brain className="h-3 w-3 mr-1.5" />, color: "hover:border-blue-500/40 hover:bg-blue-50/50 hover:text-blue-600" },
  { id: 'emotion', label: 'Foco Límbico (Emocional)', icon: <Activity className="h-3 w-3 mr-1.5" />, color: "hover:border-pink-500/40 hover:bg-pink-50/50 hover:text-pink-600" },
  { id: 'reptile', label: 'Foco Reptiliano (Urgência)', icon: <Zap className="h-3 w-3 mr-1.5" />, color: "hover:border-orange-500/40 hover:bg-orange-50/50 hover:text-orange-600" },
];


export const NeuroCommunicationHub = () => {
  const { BRAIN_SYSTEM_INFO, NEUROCHEMICAL_INFO } = useNeuromarketing();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-500/10 via-background to-purple-500/10 border-indigo-500/20 shadow-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black flex items-center gap-2 tracking-tight">
                <Brain className="h-6 w-6 text-indigo-500" />
                HUB DE NEURO-COMUNICAÇÃO <span className="text-indigo-600">10/10</span>
              </CardTitle>
              <CardDescription className="text-indigo-700/60 font-medium">
                Interface de Neuromodulação e Engenharia de Influência Subconsciente
              </CardDescription>
            </div>
            <Badge className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1 animate-pulse">
              SISTEMA OPERACIONAL ATIVO
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="systems" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-indigo-500/5 p-1 h-auto">
              <TabsTrigger value="systems" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 py-2">
                <Sliders className="h-4 w-4 mr-2" /> Sistemas
              </TabsTrigger>
              <TabsTrigger value="chemicals" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 py-2">
                <Waves className="h-4 w-4 mr-2" /> Neuroquímica
              </TabsTrigger>
              <TabsTrigger value="optimization" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 py-2">
                <Target className="h-4 w-4 mr-2" /> Otimização
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 py-2">
                <ShieldCheck className="h-4 w-4 mr-2" /> Ética
              </TabsTrigger>
            </TabsList>

            <TabsContent value="systems" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(BRAIN_SYSTEM_INFO).map(([id, info], idx) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-xl bg-white border border-indigo-100 shadow-sm group hover:border-indigo-500/50 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-primary-foreground transition-colors">
                        <Activity className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-sm uppercase tracking-wider">{info.namePt}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{info.descriptionPt}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-indigo-600">
                        <span>Nível de Ativação</span>
                        <span>98%</span>
                      </div>
                      <Progress value={98} className="h-1.5 bg-indigo-100" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="chemicals" className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(NEUROCHEMICAL_INFO).map(([id, info], idx) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-100 flex flex-col items-center text-center"
                  >
                    <Waves className="h-6 w-6 text-indigo-500 mb-2" />
                    <h5 className="font-black text-indigo-900 text-xs uppercase mb-1">{info.namePt}</h5>
                    <span className="text-[10px] text-indigo-600/70 font-medium mb-3 uppercase tracking-tighter">
                      {info.effectPt.split(' ')[0]}
                    </span>
                    <div className="text-2xl font-black text-indigo-600">95%</div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight">Engenharia de {id} ativada com precisão cirúrgica.</p>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="pt-4">
              <div className="bg-white rounded-xl border border-indigo-100 p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-full bg-indigo-500 text-primary-foreground shadow-lg shadow-indigo-200">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-indigo-950">Neuromodulação Adaptativa</h4>
                    <p className="text-sm text-muted-foreground">Sintonização dinâmica de gatilhos baseada em ressonância límbica.</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-[11px] font-bold text-indigo-900/60 uppercase mb-3 tracking-widest flex items-center gap-2">
                    <Sliders className="h-3 w-3" /> Selecionar Perfil de Neuromodulação
                  </p>
                  <PromptChips 
                    chips={NEURO_STYLE_CHIPS} 
                    onSelect={(style) => toast.success(`Perfil ${style} ativado para a próxima interação.`)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Ressonância Límbica', value: 94, icon: <Activity className="h-4 w-4" /> },
                    { label: 'Urgência Reptiliana', value: 97, icon: <Zap className="h-4 w-4" /> },
                    { label: 'Validação Neocórtex', value: 92, icon: <Target className="h-4 w-4" /> },
                    { label: 'Fluidez Cognitiva', value: 99, icon: <Sparkles className="h-4 w-4" /> },
                  ].map((metric, i) => (
                    <div key={i} className="p-3 border border-indigo-50 rounded-lg bg-indigo-50/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                          {metric.icon} {metric.label}
                        </span>
                        <span className="text-xs font-black text-indigo-600">{metric.value}%</span>
                      </div>
                      <Progress value={metric.value} className="h-1 bg-indigo-200" />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="pt-4">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-500 text-primary-foreground">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900">Protocolo de Influência Ética</h4>
                  <p className="text-xs text-emerald-700/70">
                    Todos os padrões de neuromodulação seguem as diretrizes de integridade e benefício mútuo (Ganhar-Ganhar).
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};