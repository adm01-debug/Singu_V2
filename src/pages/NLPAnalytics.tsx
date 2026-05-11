import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Header } from '@/components/layout/Header';
import NLPConversionMetrics from '@/components/nlp/NLPConversionMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const NLPAnalytics = () => {
  return (
    <AppLayout>
      <SEOHead 
        title="Análise PNL | CRM Inteligente" 
        description="Métricas avançadas de conversão baseadas em padrões de PNL, VAK e Metaprogramas." 
      />
      <Header 
        title="Análise Comportamental (PNL)" 
        subtitle="Insights avançados sobre a eficácia da comunicação e perfis de clientes"
        hideBack
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <NLPConversionMetrics />
          </Card>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Meta 10/10: Excelência PNL
                </CardTitle>
                <CardDescription className="text-xs">
                  Seu CRM está operando com análise em tempo real de padrões subconscientes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Precisão VAK</span>
                    <span className="font-bold text-success">94%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Detecção de Objeções</span>
                    <span className="font-bold text-primary">88%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sucesso de Reenquadramento</span>
                    <span className="font-bold text-amber-500">76%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Insight Estratégico
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 leading-relaxed">
                <p>
                  Contatos <strong>Visuais</strong> tendem a converter <span className="text-success font-bold">15% mais rápido</span> quando recebem propostas com gráficos.
                </p>
                <p>
                  O padrão de metaprograma <strong>"Em direção a"</strong> responde melhor a gatilhos de benefício imediato, enquanto <strong>"Afastar-se de"</strong> exige ênfase em garantias.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NLPAnalytics;