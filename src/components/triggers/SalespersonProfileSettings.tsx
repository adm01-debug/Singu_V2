import React, { useState, useEffect } from 'react';
import {
  Brain,
  Eye,
  Target,
  Compass,
  GitBranch,
  Zap,
  Search,
  Rocket,
  Link,
  Save,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAK_LABELS } from '@/types/vak';
import { METAPROGRAM_LABELS } from '@/types/metaprograms';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface SalespersonNLPProfile {
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

export function SalespersonProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<SalespersonNLPProfile>({
    vakProfile: null,
    discProfile: null,
    metaprograms: {
      motivationDirection: null,
      referenceFrame: null,
      workingStyle: null,
      chunkSize: null,
      actionFilter: null,
      comparisonStyle: null,
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nlp_profile')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data?.nlp_profile) {
        setProfile(data.nlp_profile as unknown as SalespersonNLPProfile);
      }
    } catch (err) {
      logger.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nlp_profile: profile as unknown as import('@/integrations/supabase/types').Json })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil PNL salvo com sucesso!', {
        description: 'Sua compatibilidade com clientes será calculada automaticamente.',
      });
    } catch (err) {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const updateMetaprogram = (key: keyof SalespersonNLPProfile['metaprograms'], value: string) => {
    setProfile((prev) => ({
      ...prev,
      metaprograms: {
        ...prev.metaprograms,
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Meu Perfil PNL
        </CardTitle>
        <CardDescription>
          Configure seu perfil para calcular compatibilidade com clientes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* VAK Profile */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4 text-secondary" />
            Sistema Representacional (VAK)
          </Label>
          <p className="text-xs text-muted-foreground">
            Como você processa informações naturalmente?
          </p>
          <RadioGroup
            value={profile.vakProfile || ''}
            onValueChange={(value) => setProfile({ ...profile, vakProfile: value as VAKType })}
            className="grid grid-cols-2 gap-3"
          >
            {(['V', 'A', 'K', 'D'] as VAKType[]).map((type) => (
              <Label
                key={type}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  profile.vakProfile === type
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <RadioGroupItem value={type} className="sr-only" />
                <span className="text-2xl">{VAK_LABELS[type].icon}</span>
                <div>
                  <p className="font-medium text-sm">{VAK_LABELS[type].fullName}</p>
                  <p className="text-xs text-muted-foreground">{VAK_LABELS[type].description?.slice(0, 50)}...</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* DISC Profile */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-info" />
            Perfil DISC
          </Label>
          <p className="text-xs text-muted-foreground">
            Qual é seu estilo comportamental dominante?
          </p>
          <RadioGroup
            value={profile.discProfile || ''}
            onValueChange={(value) => setProfile({ ...profile, discProfile: value as DISCProfile })}
            className="grid grid-cols-2 gap-3"
          >
            {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((type) => (
              <Label
                key={type}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  profile.discProfile === type
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <RadioGroupItem value={type} className="sr-only" />
                <span className="text-xl font-bold">{type}</span>
                <div>
                  <p className="font-medium text-sm">{DISC_LABELS[type].name}</p>
                  <p className="text-xs text-muted-foreground">{DISC_LABELS[type].description?.slice(0, 40)}...</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Metaprograms */}
        <div className="space-y-4">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-success" />
            Metaprogramas
          </Label>
          <p className="text-xs text-muted-foreground">
            Como você naturalmente pensa e se comunica?
          </p>

          {/* Motivation Direction */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" /> Direção Motivacional
            </Label>
            <RadioGroup
              value={profile.metaprograms.motivationDirection || ''}
              onValueChange={(v) => updateMetaprogram('motivationDirection', v)}
              className="flex flex-wrap gap-2"
            >
              {['toward', 'away_from', 'balanced'].map((option) => (
                <Label
                  key={option}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all',
                    profile.metaprograms.motivationDirection === option
                      ? METAPROGRAM_LABELS.motivationDirection[option as keyof typeof METAPROGRAM_LABELS.motivationDirection].color
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={option} className="sr-only" />
                  {METAPROGRAM_LABELS.motivationDirection[option as keyof typeof METAPROGRAM_LABELS.motivationDirection].icon}{' '}
                  {METAPROGRAM_LABELS.motivationDirection[option as keyof typeof METAPROGRAM_LABELS.motivationDirection].name}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Reference Frame */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Compass className="w-3 h-3" /> Quadro de Referência
            </Label>
            <RadioGroup
              value={profile.metaprograms.referenceFrame || ''}
              onValueChange={(v) => updateMetaprogram('referenceFrame', v)}
              className="flex flex-wrap gap-2"
            >
              {['internal', 'external', 'balanced'].map((option) => (
                <Label
                  key={option}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all',
                    profile.metaprograms.referenceFrame === option
                      ? METAPROGRAM_LABELS.referenceFrame[option as keyof typeof METAPROGRAM_LABELS.referenceFrame].color
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={option} className="sr-only" />
                  {METAPROGRAM_LABELS.referenceFrame[option as keyof typeof METAPROGRAM_LABELS.referenceFrame].icon}{' '}
                  {METAPROGRAM_LABELS.referenceFrame[option as keyof typeof METAPROGRAM_LABELS.referenceFrame].name}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Working Style */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> Estilo de Trabalho
            </Label>
            <RadioGroup
              value={profile.metaprograms.workingStyle || ''}
              onValueChange={(v) => updateMetaprogram('workingStyle', v)}
              className="flex flex-wrap gap-2"
            >
              {['options', 'procedures', 'balanced'].map((option) => (
                <Label
                  key={option}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all',
                    profile.metaprograms.workingStyle === option
                      ? METAPROGRAM_LABELS.workingStyle[option as keyof typeof METAPROGRAM_LABELS.workingStyle].color
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={option} className="sr-only" />
                  {METAPROGRAM_LABELS.workingStyle[option as keyof typeof METAPROGRAM_LABELS.workingStyle].icon}{' '}
                  {METAPROGRAM_LABELS.workingStyle[option as keyof typeof METAPROGRAM_LABELS.workingStyle].name}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Chunk Size */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Search className="w-3 h-3" /> Tamanho do Chunk
            </Label>
            <RadioGroup
              value={profile.metaprograms.chunkSize || ''}
              onValueChange={(v) => updateMetaprogram('chunkSize', v)}
              className="flex flex-wrap gap-2"
            >
              {['general', 'specific', 'balanced'].map((option) => (
                <Label
                  key={option}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all',
                    profile.metaprograms.chunkSize === option
                      ? METAPROGRAM_LABELS.chunkSize[option as keyof typeof METAPROGRAM_LABELS.chunkSize].color
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={option} className="sr-only" />
                  {METAPROGRAM_LABELS.chunkSize[option as keyof typeof METAPROGRAM_LABELS.chunkSize].icon}{' '}
                  {METAPROGRAM_LABELS.chunkSize[option as keyof typeof METAPROGRAM_LABELS.chunkSize].name}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Action Filter */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Rocket className="w-3 h-3" /> Filtro de Ação
            </Label>
            <RadioGroup
              value={profile.metaprograms.actionFilter || ''}
              onValueChange={(v) => updateMetaprogram('actionFilter', v)}
              className="flex flex-wrap gap-2"
            >
              {['proactive', 'reactive', 'balanced'].map((option) => (
                <Label
                  key={option}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all',
                    profile.metaprograms.actionFilter === option
                      ? METAPROGRAM_LABELS.actionFilter[option as keyof typeof METAPROGRAM_LABELS.actionFilter].color
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={option} className="sr-only" />
                  {METAPROGRAM_LABELS.actionFilter[option as keyof typeof METAPROGRAM_LABELS.actionFilter].icon}{' '}
                  {METAPROGRAM_LABELS.actionFilter[option as keyof typeof METAPROGRAM_LABELS.actionFilter].name}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Comparison Style */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Link className="w-3 h-3" /> Estilo de Comparação
            </Label>
            <RadioGroup
              value={profile.metaprograms.comparisonStyle || ''}
              onValueChange={(v) => updateMetaprogram('comparisonStyle', v)}
              className="flex flex-wrap gap-2"
            >
              {['sameness', 'difference', 'balanced'].map((option) => (
                <Label
                  key={option}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all',
                    profile.metaprograms.comparisonStyle === option
                      ? METAPROGRAM_LABELS.comparisonStyle[option as keyof typeof METAPROGRAM_LABELS.comparisonStyle].color
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={option} className="sr-only" />
                  {METAPROGRAM_LABELS.comparisonStyle[option as keyof typeof METAPROGRAM_LABELS.comparisonStyle].icon}{' '}
                  {METAPROGRAM_LABELS.comparisonStyle[option as keyof typeof METAPROGRAM_LABELS.comparisonStyle].name}
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>

        <Separator />

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Meu Perfil PNL'}
        </Button>
      </CardContent>
    </Card>
  );
}
