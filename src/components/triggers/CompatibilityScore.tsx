import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Heart, AlertTriangle, CheckCircle2, Sparkles, ArrowRight,
  Brain, Eye, Zap, Target, Compass, GitBranch, TrendingUp, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAKProfile, VAK_LABELS } from '@/types/vak';
import { MetaprogramProfile } from '@/types/metaprograms';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from "@/lib/logger";
import { DISC_COMPATIBILITY, VAK_COMPATIBILITY, getDISCTip } from './compatibility/compatibilityData';

interface CompatibilityScoreProps {
  contact: Contact;
  vakProfile: VAKProfile | null;
  metaprogramProfile: MetaprogramProfile | null;
  className?: string;
}

interface SalespersonProfile {
  vakProfile: VAKType | null;
  discProfile: DISCProfile | null;
  metaprograms: {
    motivationDirection: string | null;
    referenceFrame: string | null;
    workingStyle: string | null;
    chunkSize: string | null;
    actionFilter: string | null;
    comparisonStyle: string | null;
  };
}

interface CompatibilityFactor {
  name: string;
  score: number;
  maxScore: number;
  icon: typeof Brain;
  color: string;
  insight: string;
  tip: string;
}

export function CompatibilityScore({ contact, vakProfile, metaprogramProfile, className }: CompatibilityScoreProps) {
  const { user } = useAuth();
  const [salespersonProfile, setSalespersonProfile] = useState<SalespersonProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchSalespersonProfile(); }, [user]);

  const fetchSalespersonProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('nlp_profile').eq('id', user.id).maybeSingle();
      if (!error && data?.nlp_profile) setSalespersonProfile(data.nlp_profile as unknown as SalespersonProfile);
    } catch (err) { 
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error fetching salesperson profile:', { error: msg }); 
    }
    finally { setLoading(false); }
  };

  const contactDISC = contact.behavior?.discProfile as DISCProfile | undefined;

  const compatibilityFactors = useMemo<CompatibilityFactor[]>(() => {
    const factors: CompatibilityFactor[] = [];
    if (!salespersonProfile) return factors;

    if (salespersonProfile.vakProfile && vakProfile?.primary) {
      const vakScore = VAK_COMPATIBILITY[salespersonProfile.vakProfile][vakProfile.primary];
      const isSameVAK = salespersonProfile.vakProfile === vakProfile.primary;
      factors.push({
        name: 'Linguagem VAK', score: vakScore, maxScore: 100, icon: Eye,
        color: isSameVAK ? 'text-success' : vakScore >= 70 ? 'text-info' : 'text-warning',
        insight: isSameVAK ? `Ambos são ${VAK_LABELS[vakProfile.primary].fullName}s - comunicação natural!` : `Você: ${VAK_LABELS[salespersonProfile.vakProfile].name} → Cliente: ${VAK_LABELS[vakProfile.primary].name}`,
        tip: isSameVAK ? 'Use sua linguagem natural, vocês se entendem bem.' : `Adapte sua comunicação para usar mais predicados ${VAK_LABELS[vakProfile.primary].name.toLowerCase()}s.`,
      });
    }

    if (salespersonProfile.discProfile && contactDISC) {
      const discScore = DISC_COMPATIBILITY[salespersonProfile.discProfile][contactDISC];
      factors.push({
        name: 'Perfil DISC', score: discScore, maxScore: 100, icon: Target,
        color: discScore >= 80 ? 'text-success' : discScore >= 60 ? 'text-info' : 'text-warning',
        insight: salespersonProfile.discProfile === contactDISC ? `Ambos são ${DISC_LABELS[contactDISC].name}s - sintonia comportamental!` : `Você: ${salespersonProfile.discProfile} (${DISC_LABELS[salespersonProfile.discProfile].name}) → Cliente: ${contactDISC} (${DISC_LABELS[contactDISC].name})`,
        tip: getDISCTip(salespersonProfile.discProfile, contactDISC),
      });
    }

    if (salespersonProfile.metaprograms?.motivationDirection && metaprogramProfile?.motivationDirection) {
      const isSame = salespersonProfile.metaprograms.motivationDirection === metaprogramProfile.motivationDirection || salespersonProfile.metaprograms.motivationDirection === 'balanced' || metaprogramProfile.motivationDirection === 'balanced';
      factors.push({
        name: 'Direção Motivacional', score: isSame ? 90 : 50, maxScore: 100, icon: Zap,
        color: isSame ? 'text-success' : 'text-warning',
        insight: isSame ? 'Motivação alinhada - fácil de persuadir.' : `Você foca em "${salespersonProfile.metaprograms.motivationDirection}" mas cliente foca em "${metaprogramProfile.motivationDirection}"`,
        tip: isSame ? 'Continue usando sua abordagem natural.' : metaprogramProfile.motivationDirection === 'toward' ? 'Foque em OBJETIVOS e GANHOS ao invés de problemas.' : 'Foque em PROBLEMAS a EVITAR ao invés de ganhos.',
      });
    }

    if (salespersonProfile.metaprograms?.referenceFrame && metaprogramProfile?.referenceFrame) {
      const isSame = salespersonProfile.metaprograms.referenceFrame === metaprogramProfile.referenceFrame || salespersonProfile.metaprograms.referenceFrame === 'balanced' || metaprogramProfile.referenceFrame === 'balanced';
      factors.push({
        name: 'Quadro de Referência', score: isSame ? 85 : 55, maxScore: 100, icon: Compass,
        color: isSame ? 'text-success' : 'text-warning',
        insight: isSame ? 'Referência alinhada - validação natural.' : `Você usa ref. ${salespersonProfile.metaprograms.referenceFrame} mas cliente usa ref. ${metaprogramProfile.referenceFrame}`,
        tip: isSame ? 'Continue com sua estratégia de validação.' : metaprogramProfile.referenceFrame === 'internal' ? 'Deixe-o decidir sozinho, não force opiniões externas.' : 'Use mais dados, depoimentos e referências externas.',
      });
    }

    if (salespersonProfile.metaprograms?.workingStyle && metaprogramProfile?.workingStyle) {
      const isSame = salespersonProfile.metaprograms.workingStyle === metaprogramProfile.workingStyle || salespersonProfile.metaprograms.workingStyle === 'balanced' || metaprogramProfile.workingStyle === 'balanced';
      factors.push({
        name: 'Estilo de Trabalho', score: isSame ? 85 : 55, maxScore: 100, icon: GitBranch,
        color: isSame ? 'text-success' : 'text-warning',
        insight: isSame ? 'Estilos compatíveis - apresentação fluida.' : `Você prefere ${salespersonProfile.metaprograms.workingStyle} mas cliente prefere ${metaprogramProfile.workingStyle}`,
        tip: isSame ? 'Continue com seu estilo natural de apresentação.' : metaprogramProfile.workingStyle === 'options' ? 'Ofereça alternativas e flexibilidade.' : 'Apresente um processo estruturado passo a passo.',
      });
    }

    return factors;
  }, [salespersonProfile, vakProfile, metaprogramProfile, contactDISC]);

  const overallScore = useMemo(() => {
    if (compatibilityFactors.length === 0) return 0;
    const totalScore = compatibilityFactors.reduce((sum, f) => sum + f.score, 0);
    const maxScore = compatibilityFactors.reduce((sum, f) => sum + f.maxScore, 0);
    return Math.round((totalScore / maxScore) * 100);
  }, [compatibilityFactors]);

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'text-success', bgColor: 'bg-success', icon: CheckCircle2 };
    if (score >= 60) return { label: 'Boa', color: 'text-info', bgColor: 'bg-info', icon: TrendingUp };
    if (score >= 40) return { label: 'Moderada', color: 'text-warning', bgColor: 'bg-warning', icon: AlertTriangle };
    return { label: 'Desafiadora', color: 'text-destructive', bgColor: 'bg-destructive', icon: AlertTriangle };
  };

  const scoreLevel = getScoreLevel(overallScore);

  if (loading) return <Card className={className}><CardContent className="pt-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-muted rounded w-1/3" /><div className="h-20 bg-muted rounded" /></div></CardContent></Card>;

  if (!salespersonProfile?.vakProfile && !salespersonProfile?.discProfile) {
    return (
      <Card className={className}><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users className="w-5 h-5 text-primary" />Compatibilidade Vendedor-Cliente</CardTitle></CardHeader>
        <CardContent><div className="text-center py-6"><Brain className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" /><p className="text-sm text-muted-foreground mb-3">Configure seu perfil PNL para ver a compatibilidade</p><Button variant="outline" size="sm" asChild><a href="/configuracoes">Configurar Meu Perfil</a></Button></div></CardContent></Card>
    );
  }

  if (!vakProfile?.primary && !contactDISC && !metaprogramProfile) {
    return (
      <Card className={className}><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users className="w-5 h-5 text-primary" />Compatibilidade Vendedor-Cliente</CardTitle></CardHeader>
        <CardContent><div className="text-center py-6"><Target className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" /><p className="text-sm text-muted-foreground">Analise o perfil do contato para calcular compatibilidade</p></div></CardContent></Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5 text-primary" />Compatibilidade Vendedor-Cliente
          <TooltipProvider><Tooltip><TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger><TooltipContent className="max-w-xs"><p className="text-xs">A compatibilidade é calculada comparando seu perfil PNL (VAK, DISC, Metaprogramas) com o perfil do cliente.</p></TooltipContent></Tooltip></TooltipProvider>
        </CardTitle>
        <CardDescription className="text-xs">Baseada em VAK, DISC e Metaprogramas</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn('p-4 rounded-lg border-2', scoreLevel.bgColor, 'border-current/20')}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><scoreLevel.icon className={cn('w-5 h-5', scoreLevel.color)} /><span className={cn('font-semibold', scoreLevel.color)}>Compatibilidade {scoreLevel.label}</span></div>
            <Badge variant="secondary" className="text-lg px-3 py-1">{overallScore}%</Badge>
          </div>
          <Progress value={overallScore} className="h-2" />
        </motion.div>

        <div className="flex items-center justify-center gap-3 py-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Você</p>
            <div className="flex gap-1">
              {salespersonProfile?.vakProfile && <Badge variant="outline" className="text-xs">{VAK_LABELS[salespersonProfile.vakProfile].icon}</Badge>}
              {salespersonProfile?.discProfile && <Badge variant="outline" className="text-xs">{salespersonProfile.discProfile}</Badge>}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{contact.firstName}</p>
            <div className="flex gap-1">
              {vakProfile?.primary && <Badge variant="outline" className="text-xs">{VAK_LABELS[vakProfile.primary].icon}</Badge>}
              {contactDISC && <Badge variant="outline" className="text-xs">{contactDISC}</Badge>}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Fatores de Compatibilidade:</p>
          {compatibilityFactors.map((factor, i) => (
            <motion.div key={factor.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><factor.icon className={cn('w-4 h-4', factor.color)} /><span className="text-sm font-medium">{factor.name}</span></div>
                <Badge variant="outline" className={cn('text-xs', factor.color)}>{factor.score}%</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{factor.insight}</p>
              <div className="flex items-start gap-1.5 mt-2 p-2 rounded bg-primary/5"><Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" /><p className="text-xs text-primary">{factor.tip}</p></div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
