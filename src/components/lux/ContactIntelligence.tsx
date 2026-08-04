import { Brain, Briefcase, Heart, Globe, Building2, GraduationCap, Award, TrendingUp, Plane, BarChart3, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataCard, SocialProfileCard } from './LuxSharedComponents';
import type { LuxIntelligenceRecord, LuxSocialProfile, LuxEducation } from '@/hooks/useLuxIntelligence';

interface LuxSocialData {
  personality_type?: string;
  communication_style?: string;
  content_themes?: string[];
  [key: string]: unknown;
}

interface LuxProfileData {
  current_position?: string;
  company?: string;
  tenure?: string;
  specialties?: string[];
  education?: LuxEducation[];
  previous_companies?: string[];
  hobbies?: string[];
  interests?: string[];
  travels?: string[];
  bio?: string;
  skills?: string[];
  [key: string]: unknown;
}

export function ContactIntelligence({ record }: { record: LuxIntelligenceRecord }) {
  const profile = (record.personal_profile || {}) as LuxProfileData;
  const social = (record.social_analysis || {}) as LuxSocialData;
  const socialProfiles = record.social_profiles || [];

  return (
    <Tabs defaultValue="summary" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4 h-auto p-1">
        <TabsTrigger value="summary" className="text-xs py-2"><Brain className="w-3.5 h-3.5 mr-1.5" />Resumo</TabsTrigger>
        <TabsTrigger value="professional" className="text-xs py-2"><Briefcase className="w-3.5 h-3.5 mr-1.5" />Profissional</TabsTrigger>
        <TabsTrigger value="personal" className="text-xs py-2"><Heart className="w-3.5 h-3.5 mr-1.5" />Pessoal</TabsTrigger>
        <TabsTrigger value="social" className="text-xs py-2"><Globe className="w-3.5 h-3.5 mr-1.5" />Social</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="space-y-4">
        {record.ai_summary && (
          <DataCard title="Resumo do Perfil" icon={Brain} iconColor="bg-secondary dark:bg-secondary/30 text-secondary">
            <p className="text-sm text-muted-foreground leading-relaxed">{record.ai_summary}</p>
          </DataCard>
        )}
        {record.ai_report && (
          <DataCard title="Relatório Completo" icon={FileText} iconColor="bg-info dark:bg-info/30 text-info">
            <ScrollArea className="max-h-96">
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">{record.ai_report}</div>
            </ScrollArea>
          </DataCard>
        )}
        {!record.ai_summary && !record.ai_report && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm">Resumo ainda não disponível</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="professional" className="space-y-4">
        {Object.keys(profile).length > 0 ? (
          <>
            <DataCard title="Perfil Profissional" icon={Briefcase} iconColor="bg-info dark:bg-info/30 text-info">
              <div className="space-y-3">
                {profile.current_position && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Cargo Atual</span>
                    <span className="text-sm font-medium">{profile.current_position}</span>
                  </div>
                )}
                {profile.company && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Empresa</span>
                    <span className="text-sm font-medium">{profile.company}</span>
                  </div>
                )}
                {profile.tenure && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Tempo na Empresa</span>
                    <Badge variant="outline">{profile.tenure}</Badge>
                  </div>
                )}
                {profile.specialties && profile.specialties.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Especialidades</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.specialties.map((s: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </DataCard>
            {profile.education && profile.education.length > 0 && (
              <DataCard title="Formação" icon={GraduationCap} iconColor="bg-success dark:bg-success/30 text-success">
                <div className="space-y-3">
                  {profile.education.map((e: LuxEducation, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">{typeof e === 'string' ? e : e.degree}</p>
                      {typeof e !== 'string' && e.institution && <p className="text-xs text-muted-foreground mt-1">{e.institution}</p>}
                    </div>
                  ))}
                </div>
              </DataCard>
            )}
            {profile.previous_companies && profile.previous_companies.length > 0 && (
              <DataCard title="Empresas Anteriores" icon={Building2} iconColor="bg-muted dark:bg-muted/30 text-muted-foreground">
                <div className="flex flex-wrap gap-1.5">
                  {profile.previous_companies.map((c: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}
                </div>
              </DataCard>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground"><Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm">Dados profissionais não disponíveis</p></div>
        )}
      </TabsContent>

      <TabsContent value="personal" className="space-y-4">
        {((profile.hobbies?.length ?? 0) > 0 || (profile.interests?.length ?? 0) > 0 || (profile.travels?.length ?? 0) > 0) ? (
          <>
            {profile.hobbies && profile.hobbies.length > 0 && (
              <DataCard title="Hobbies" icon={Heart} iconColor="bg-primary dark:bg-primary/30 text-primary">
                <div className="flex flex-wrap gap-1.5">{profile.hobbies.map((h: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary dark:bg-primary/20 border-primary/30 dark:border-primary/30">{h}</Badge>
                ))}</div>
              </DataCard>
            )}
            {profile.interests && profile.interests.length > 0 && (
              <DataCard title="Interesses" icon={TrendingUp} iconColor="bg-warning dark:bg-warning/30 text-warning">
                <div className="flex flex-wrap gap-1.5">{profile.interests.map((h: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs bg-warning dark:bg-warning/20 border-warning/30 dark:border-warning/30">{h}</Badge>
                ))}</div>
              </DataCard>
            )}
            {profile.travels && profile.travels.length > 0 && (
              <DataCard title="Viagens Recentes" icon={Plane} iconColor="bg-info/10 dark:bg-info/20 text-info">
                <div className="flex flex-wrap gap-1.5">{profile.travels.map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">📍 {t}</Badge>
                ))}</div>
              </DataCard>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground"><Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm">Dados pessoais não disponíveis</p></div>
        )}
      </TabsContent>

      <TabsContent value="social" className="space-y-4">
        {socialProfiles.length > 0 && (
          <DataCard title="Redes Sociais" icon={Globe} iconColor="bg-success dark:bg-success/30 text-success">
            <div className="space-y-2">{socialProfiles.map((p: LuxSocialProfile, i: number) => <SocialProfileCard key={i} profile={p} />)}</div>
          </DataCard>
        )}
        {Object.keys(social).length > 0 && (
          <DataCard title="Análise de Comportamento Social" icon={BarChart3} iconColor="bg-accent/10 dark:bg-accent/20 text-accent">
            <div className="space-y-3">
              {social.personality_type && (<div><p className="text-xs text-muted-foreground mb-1">Tipo de Personalidade</p><Badge variant="secondary">{social.personality_type}</Badge></div>)}
              {social.communication_style && (<div><p className="text-xs text-muted-foreground mb-1">Estilo de Comunicação</p><p className="text-sm">{social.communication_style}</p></div>)}
              {social.content_themes && social.content_themes.length > 0 && (
                <div><p className="text-xs text-muted-foreground mb-2">Temas Recorrentes</p>
                  <div className="flex flex-wrap gap-1.5">{social.content_themes.map((t: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}</div>
                </div>
              )}
            </div>
          </DataCard>
        )}
        {socialProfiles.length === 0 && Object.keys(social).length === 0 && (
          <div className="text-center py-8 text-muted-foreground"><Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm">Dados sociais não disponíveis</p></div>
        )}
      </TabsContent>
    </Tabs>
  );
}
